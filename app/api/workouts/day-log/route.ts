import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { exerciseDayLogs } from "@/db/schema";
import { and, eq, gte, lte, desc } from "drizzle-orm";

// GET /api/workouts/day-log?weekStart=YYYY-MM-DD
// Returns all exercise logs for the given ISO week (Mon–Sun) plus the most
// recent weight per exerciseId from any prior date (for the "last weight" hint).
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const { searchParams } = new URL(req.url);
  const weekStart = searchParams.get("weekStart"); // "YYYY-MM-DD" (Monday)
  if (!weekStart) {
    return NextResponse.json({ error: "weekStart required" }, { status: 400 });
  }

  // Week end = 6 days after weekStart (Sunday)
  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekEnd.getUTCDate() + 6);
  const weekEndStr = weekEnd.toISOString().split("T")[0];

  // Fetch this week's logs
  const weekLogs = await db
    .select()
    .from(exerciseDayLogs)
    .where(
      and(
        eq(exerciseDayLogs.userId, userId),
        gte(exerciseDayLogs.date, weekStart),
        lte(exerciseDayLogs.date, weekEndStr)
      )
    );

  // Fetch the most recent weight per exerciseId before this week
  // (used as the "last weight" reference when no weight set yet this week)
  const priorWeights = await db
    .select({
      exerciseId: exerciseDayLogs.exerciseId,
      weightKg: exerciseDayLogs.weightKg,
      date: exerciseDayLogs.date,
    })
    .from(exerciseDayLogs)
    .where(
      and(
        eq(exerciseDayLogs.userId, userId),
        lte(exerciseDayLogs.date, weekStart)
      )
    )
    .orderBy(desc(exerciseDayLogs.date));

  // Deduplicate — keep only the most recent per exerciseId
  const lastWeightMap: Record<string, number> = {};
  for (const row of priorWeights) {
    if (row.weightKg != null && !(row.exerciseId in lastWeightMap)) {
      lastWeightMap[row.exerciseId] = row.weightKg;
    }
  }

  return NextResponse.json({ weekLogs, lastWeightMap });
}

// POST /api/workouts/day-log
// Upserts a single exercise log entry for today.
// Body: { planExId, exerciseId, date, completed, completedSets, weightKg }
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const body = await req.json() as {
    planExId: string;
    exerciseId: string;
    date: string;
    completed: boolean;
    completedSets: boolean[];
    weightKg: number | null;
  };

  const { planExId, exerciseId, date, completed, completedSets, weightKg } = body;

  // Check for existing record
  const [existing] = await db
    .select({ id: exerciseDayLogs.id })
    .from(exerciseDayLogs)
    .where(
      and(
        eq(exerciseDayLogs.userId, userId),
        eq(exerciseDayLogs.planExId, planExId),
        eq(exerciseDayLogs.date, date)
      )
    )
    .limit(1);

  if (existing) {
    await db
      .update(exerciseDayLogs)
      .set({ completed, completedSets, weightKg: weightKg ?? null })
      .where(eq(exerciseDayLogs.id, existing.id));
  } else {
    await db.insert(exerciseDayLogs).values({
      userId,
      planExId,
      exerciseId,
      date,
      completed,
      completedSets,
      weightKg: weightKg ?? null,
    });
  }

  return NextResponse.json({ ok: true });
}
