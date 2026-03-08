import { auth } from "@/auth";
import { db } from "@/db";
import { workoutPlans, planExercises, exercises } from "@/db/schema";
import { eq, asc, desc } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const plans = await db
    .select()
    .from(workoutPlans)
    .where(eq(workoutPlans.userId, userId))
    .orderBy(desc(workoutPlans.createdAt));

  // Fetch exercises for each plan
  const plansWithExercises = await Promise.all(
    plans.map(async (plan) => {
      const planExs = await db
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
        })
        .from(planExercises)
        .innerJoin(exercises, eq(planExercises.exerciseId, exercises.id))
        .where(eq(planExercises.planId, plan.id))
        .orderBy(asc(planExercises.orderIndex));

      return { ...plan, planExercises: planExs };
    })
  );

  return NextResponse.json(plansWithExercises);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const body = await req.json();
  const { name, description, exerciseList } = body as {
    name: string;
    description?: string;
    exerciseList: Array<{
      exerciseId: string;
      orderIndex: number;
      targetSets: number;
      targetReps?: number;
      targetWeightKg?: number;
      restSeconds?: number;
      dayOfWeek?: number;
    }>;
  };

  if (!name || !exerciseList?.length) {
    return NextResponse.json({ error: "Name and exercises are required" }, { status: 400 });
  }

  // Deactivate all other plans for this user first
  await db
    .update(workoutPlans)
    .set({ isActive: false })
    .where(eq(workoutPlans.userId, userId));

  // Create new plan (auto-activate it)
  const [newPlan] = await db
    .insert(workoutPlans)
    .values({
      userId,
      name,
      description: description ?? null,
      isActive: true,
      aiGenerated: false,
    })
    .returning();

  // Insert plan exercises
  await db.insert(planExercises).values(
    exerciseList.map((ex) => ({
      planId: newPlan.id,
      exerciseId: ex.exerciseId,
      orderIndex: ex.orderIndex,
      targetSets: ex.targetSets,
      targetReps: ex.targetReps ?? null,
      targetWeightKg: ex.targetWeightKg ?? null,
      restSeconds: ex.restSeconds ?? 90,
      dayOfWeek: ex.dayOfWeek ?? null,
    }))
  );

  return NextResponse.json({ id: newPlan.id }, { status: 201 });
}
