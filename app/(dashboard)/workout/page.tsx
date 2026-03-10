import { auth } from "@/auth";
import { db } from "@/db";
import { workoutPlans, planExercises, exercises } from "@/db/schema";
import { eq, desc, asc, and } from "drizzle-orm";
import Link from "next/link";
import WeeklyPlanView from "@/components/workout/WeeklyPlanView";
import GenerateNextPlanButton from "@/components/workout/GenerateNextPlanButton";

export default async function WorkoutPage() {
  const session = await auth();
  const userId = session!.user!.id!;

  // Get active plan
  const [activePlan] = await db
    .select()
    .from(workoutPlans)
    .where(and(eq(workoutPlans.userId, userId), eq(workoutPlans.isActive, true)))
    .limit(1);

  // Fallback to most recent plan
  const [fallbackPlan] = !activePlan
    ? await db
        .select()
        .from(workoutPlans)
        .where(eq(workoutPlans.userId, userId))
        .orderBy(desc(workoutPlans.createdAt))
        .limit(1)
    : [null];

  const currentPlan = activePlan ?? fallbackPlan ?? null;

  // Get exercises for current plan (including dayOfWeek and instructions)
  type PlanEx = {
    planExId: string;
    exerciseId: string;
    name: string;
    muscleGroup: string;
    instructions: string | null;
    targetSets: number;
    targetReps: number | null;
    dayOfWeek: number | null;
  };

  let planExs: PlanEx[] = [];
  if (currentPlan) {
    planExs = await db
      .select({
        planExId: planExercises.id,
        exerciseId: exercises.id,
        name: exercises.name,
        muscleGroup: exercises.muscleGroup,
        instructions: exercises.instructions,
        targetSets: planExercises.targetSets,
        targetReps: planExercises.targetReps,
        dayOfWeek: planExercises.dayOfWeek,
      })
      .from(planExercises)
      .innerJoin(exercises, eq(planExercises.exerciseId, exercises.id))
      .where(eq(planExercises.planId, currentPlan.id))
      .orderBy(asc(planExercises.dayOfWeek), asc(planExercises.orderIndex));
  }

  return (
    <div className="px-6 pt-12 pb-32 animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <p className="section-label mb-1">Train</p>
        <h1 className="text-title" style={{ letterSpacing: "-0.03em" }}>
          This Week
        </h1>
        {currentPlan && (
          <p
            className="text-label text-text-secondary mt-1 truncate"
            style={{ letterSpacing: "0.005em", maxWidth: "80%" }}
          >
            {currentPlan.name}
          </p>
        )}
      </div>

      {currentPlan ? (
        <>
          <WeeklyPlanView exercises={planExs} planName={currentPlan.name} planId={currentPlan.id} />

          {/* Plan actions */}
          <div className="mt-8 flex flex-col gap-3">
            <GenerateNextPlanButton planId={currentPlan.id} />
            <Link
              href="/workout/plan/new"
              className="btn-ghost w-full text-center block"
            >
              New Plan
            </Link>
          </div>
        </>
      ) : (
        /* No plan state */
        <div
          className="neuo-card p-10 text-center"
          style={{ borderRadius: "2rem" }}
        >
          <div
            className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center"
            style={{
              backgroundColor: "var(--neuo-bg)",
              boxShadow:
                "inset 4px 4px 8px var(--neuo-mid), inset -4px -4px 8px var(--neuo-light)",
            }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path
                d="M6 4V20M18 4V20M3 12H6M18 12H21M6 7H18M6 17H18"
                stroke="#007AFF"
                strokeWidth="1.75"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <h2
            className="text-heading font-bold mb-2"
            style={{ letterSpacing: "-0.02em" }}
          >
            No plan yet
          </h2>
          <p className="text-body text-text-secondary mb-7">
            Build your weekly plan to get started.
          </p>
          <Link
            href="/workout/plan/new"
            className="btn-primary inline-block text-center"
          >
            Create Plan
          </Link>
        </div>
      )}
    </div>
  );
}
