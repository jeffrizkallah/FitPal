import { auth } from "@/auth";
import { db } from "@/db";
import { users, dailySummaries, workoutSessions } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { NextResponse } from "next/server";

export type Nudge = {
  type: "protein" | "calories" | "workout" | "streak";
  message: string;
  severity: "info" | "warning";
};

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const [user, recentSummaries, lastSession] = await Promise.all([
    db.select().from(users).where(eq(users.id, userId)).limit(1).then((r) => r[0]),
    db
      .select()
      .from(dailySummaries)
      .where(eq(dailySummaries.userId, userId))
      .orderBy(desc(dailySummaries.date))
      .limit(3),
    db
      .select({ startedAt: workoutSessions.startedAt })
      .from(workoutSessions)
      .where(eq(workoutSessions.userId, userId))
      .orderBy(desc(workoutSessions.startedAt))
      .limit(1)
      .then((r) => r[0]),
  ]);

  const nudges: Nudge[] = [];

  // ── Protein gap check ────────────────────────────────────
  const proteinTarget = user?.targetProteinG ?? 0;
  const daysWithMeals = recentSummaries.filter((s) => (s.totalCalories ?? 0) > 100);
  if (proteinTarget > 0 && daysWithMeals.length >= 2) {
    const avgProtein =
      daysWithMeals.reduce((sum, s) => sum + (s.totalProteinG ?? 0), 0) / daysWithMeals.length;
    const deficit = proteinTarget - avgProtein;
    if (deficit >= 30) {
      nudges.push({
        type: "protein",
        message: `Averaging ${Math.round(deficit)}g below protein target over the last ${daysWithMeals.length} days.`,
        severity: deficit >= 50 ? "warning" : "info",
      });
    }
  }

  // ── Calorie gap check ────────────────────────────────────
  const calTarget = user?.targetCalories ?? 0;
  if (calTarget > 0 && daysWithMeals.length >= 2) {
    const avgCal =
      daysWithMeals.reduce((sum, s) => sum + (s.totalCalories ?? 0), 0) / daysWithMeals.length;
    const calDeficit = calTarget - avgCal;
    if (calDeficit >= 300) {
      nudges.push({
        type: "calories",
        message: `Averaging ${Math.round(calDeficit)}kcal under target. Consistent under-eating can reduce recovery and muscle retention.`,
        severity: "info",
      });
    }
  }

  // ── Workout frequency check ──────────────────────────────
  if (!lastSession) {
    nudges.push({
      type: "workout",
      message: "No workouts logged yet. Start your first session from the Train tab.",
      severity: "info",
    });
  } else {
    const daysSinceLast = Math.floor(
      (Date.now() - new Date(lastSession.startedAt).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceLast >= 4) {
      nudges.push({
        type: "workout",
        message: `Last workout was ${daysSinceLast} days ago. Consistency is the primary driver of adaptation.`,
        severity: daysSinceLast >= 7 ? "warning" : "info",
      });
    }
  }

  // Return top 2 nudges, warnings first
  const sorted = nudges.sort((a, b) => {
    if (a.severity === "warning" && b.severity !== "warning") return -1;
    if (b.severity === "warning" && a.severity !== "warning") return 1;
    return 0;
  });

  return NextResponse.json(sorted.slice(0, 2));
}
