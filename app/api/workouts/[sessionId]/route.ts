import { auth } from "@/auth";
import { db } from "@/db";
import { workoutSessions, loggedSets, planExercises, exercises } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sessionId } = await params;

  const [workoutSession] = await db
    .select()
    .from(workoutSessions)
    .where(eq(workoutSessions.id, sessionId))
    .limit(1);

  if (!workoutSession || workoutSession.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Fetch plan exercises if plan exists
  let planExs: Array<{
    id: string;
    exerciseId: string;
    orderIndex: number;
    targetSets: number;
    targetReps: number | null;
    targetWeightKg: number | null;
    restSeconds: number | null;
    notes: string | null;
    exerciseName: string;
    muscleGroup: string;
    equipment: string | null;
    instructions: string | null;
  }> = [];

  if (workoutSession.planId) {
    planExs = await db
      .select({
        id: planExercises.id,
        exerciseId: planExercises.exerciseId,
        orderIndex: planExercises.orderIndex,
        targetSets: planExercises.targetSets,
        targetReps: planExercises.targetReps,
        targetWeightKg: planExercises.targetWeightKg,
        restSeconds: planExercises.restSeconds,
        notes: planExercises.notes,
        exerciseName: exercises.name,
        muscleGroup: exercises.muscleGroup,
        equipment: exercises.equipment,
        instructions: exercises.instructions,
      })
      .from(planExercises)
      .innerJoin(exercises, eq(planExercises.exerciseId, exercises.id))
      .where(eq(planExercises.planId, workoutSession.planId))
      .orderBy(asc(planExercises.orderIndex));
  }

  // Fetch all logged sets for this session
  const sets = await db
    .select()
    .from(loggedSets)
    .where(eq(loggedSets.sessionId, sessionId))
    .orderBy(asc(loggedSets.loggedAt));

  return NextResponse.json({
    ...workoutSession,
    planExercises: planExs,
    loggedSets: sets,
  });
}
