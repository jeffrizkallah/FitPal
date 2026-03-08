import { auth } from "@/auth";
import { db } from "@/db";
import { workoutSessions, dailySummaries } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const { sessionId } = await params;

  const [workoutSession] = await db
    .select()
    .from(workoutSessions)
    .where(eq(workoutSessions.id, sessionId))
    .limit(1);

  if (!workoutSession || workoutSession.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (workoutSession.completedAt) {
    return NextResponse.json({ error: "Already completed" }, { status: 400 });
  }

  const now = new Date();
  const durationMin = Math.round(
    (now.getTime() - workoutSession.startedAt.getTime()) / 60000
  );

  await db
    .update(workoutSessions)
    .set({ completedAt: now, durationMin })
    .where(eq(workoutSessions.id, sessionId));

  // Update daily summary — upsert workout duration
  const today = now.toISOString().split("T")[0];

  const [existing] = await db
    .select()
    .from(dailySummaries)
    .where(and(eq(dailySummaries.userId, userId), eq(dailySummaries.date, today)))
    .limit(1);

  if (existing) {
    await db
      .update(dailySummaries)
      .set({ workoutDoneMin: (existing.workoutDoneMin ?? 0) + durationMin })
      .where(eq(dailySummaries.id, existing.id));
  } else {
    await db.insert(dailySummaries).values({
      userId,
      date: today,
      totalCalories: 0,
      totalProteinG: 0,
      totalCarbsG: 0,
      totalFatG: 0,
      workoutDoneMin: durationMin,
    });
  }

  return NextResponse.json({ sessionId, durationMin });
}
