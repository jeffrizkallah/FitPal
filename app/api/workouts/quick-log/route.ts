import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/db";
import { workoutSessions, workoutPlans, dailySummaries } from "@/db/schema";
import { and, eq, gte, lt } from "drizzle-orm";

// Called by WeeklyPlanView when all exercises for today are marked done.
// Creates a workout session record (if none exists today) so the nudges API
// correctly reports that a workout was logged.
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const body = await req.json();
  const { planId } = body as { planId?: string };

  const todayStr = new Date().toISOString().split("T")[0];
  const todayStart = new Date(todayStr + "T00:00:00.000Z");
  const tomorrow = new Date(todayStart.getTime() + 86400000);

  // Check if a session already exists today (avoid duplicates)
  const existing = await db
    .select({ id: workoutSessions.id })
    .from(workoutSessions)
    .where(
      and(
        eq(workoutSessions.userId, userId),
        gte(workoutSessions.startedAt, todayStart),
        lt(workoutSessions.startedAt, tomorrow)
      )
    )
    .limit(1);

  if (existing.length === 0) {
    // Resolve planId — use provided or fall back to active plan
    let resolvedPlanId: string | null = planId ?? null;
    if (!resolvedPlanId) {
      const [activePlan] = await db
        .select({ id: workoutPlans.id })
        .from(workoutPlans)
        .where(and(eq(workoutPlans.userId, userId), eq(workoutPlans.isActive, true)))
        .limit(1);
      resolvedPlanId = activePlan?.id ?? null;
    }

    const now = new Date();
    await db.insert(workoutSessions).values({
      userId,
      planId: resolvedPlanId,
      startedAt: now,
      completedAt: now,
      durationMin: null,
    });

    // Upsert daily summary — mark at least 1 min of workout activity
    const [existingSummary] = await db
      .select()
      .from(dailySummaries)
      .where(and(eq(dailySummaries.userId, userId), eq(dailySummaries.date, todayStr)))
      .limit(1);

    if (existingSummary) {
      if ((existingSummary.workoutDoneMin ?? 0) === 0) {
        await db
          .update(dailySummaries)
          .set({ workoutDoneMin: 1 })
          .where(eq(dailySummaries.id, existingSummary.id));
      }
    } else {
      await db.insert(dailySummaries).values({
        userId,
        date: todayStr,
        totalCalories: 0,
        totalProteinG: 0,
        totalCarbsG: 0,
        totalFatG: 0,
        workoutDoneMin: 1,
      });
    }

    revalidatePath("/");
  }

  return NextResponse.json({ ok: true });
}
