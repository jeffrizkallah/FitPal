import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import {
  users,
  exercises,
  workoutPlans,
  planExercises,
  gymEquipment,
  workoutSessions,
  loggedSets,
} from "@/db/schema";
import { eq, asc, ilike, and, inArray, gte } from "drizzle-orm";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

type MuscleGroup =
  | "chest"
  | "back"
  | "shoulders"
  | "biceps"
  | "triceps"
  | "forearms"
  | "core"
  | "glutes"
  | "quads"
  | "hamstrings"
  | "calves"
  | "full_body";

const VALID_MUSCLE_GROUPS: MuscleGroup[] = [
  "chest",
  "back",
  "shoulders",
  "biceps",
  "triceps",
  "forearms",
  "core",
  "glutes",
  "quads",
  "hamstrings",
  "calves",
  "full_body",
];

interface PlanExercise {
  name: string;
  muscle_group: string;
  equipment: string;
  sets: number;
  reps: number;
  rest_seconds: number;
  suggested_weight_kg: number | null;
}

interface PlanDay {
  day_index: number;
  label: string;
  exercises: PlanExercise[];
}

interface GeneratedPlan {
  plan_name: string;
  days: PlanDay[];
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  // Fetch user profile, equipment, and active plan in parallel
  const [user, equipment, activePlanRows] = await Promise.all([
    db.select().from(users).where(eq(users.id, userId)).limit(1).then((r) => r[0]),
    db.select().from(gymEquipment).where(eq(gymEquipment.userId, userId)).orderBy(asc(gymEquipment.name)),
    db.select().from(workoutPlans).where(and(eq(workoutPlans.userId, userId), eq(workoutPlans.isActive, true))).limit(1),
  ]);

  if (!user) {
    return NextResponse.json({ error: "User profile not found" }, { status: 404 });
  }

  const currentPlan = activePlanRows[0] ?? null;
  if (!currentPlan) {
    return NextResponse.json({ error: "No active plan to progress from" }, { status: 404 });
  }

  // Fetch current plan exercises with exercise details
  const currentPlanExs = await db
    .select({
      planExId: planExercises.id,
      exerciseId: exercises.id,
      name: exercises.name,
      muscleGroup: exercises.muscleGroup,
      equipment: exercises.equipment,
      dayOfWeek: planExercises.dayOfWeek,
      targetSets: planExercises.targetSets,
      targetReps: planExercises.targetReps,
      targetWeightKg: planExercises.targetWeightKg,
      restSeconds: planExercises.restSeconds,
    })
    .from(planExercises)
    .innerJoin(exercises, eq(planExercises.exerciseId, exercises.id))
    .where(eq(planExercises.planId, currentPlan.id))
    .orderBy(asc(planExercises.dayOfWeek), asc(planExercises.orderIndex));

  // Fetch recent workout sessions for this plan (last 14 days)
  const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  const recentSessions = await db
    .select({ id: workoutSessions.id })
    .from(workoutSessions)
    .where(
      and(
        eq(workoutSessions.userId, userId),
        eq(workoutSessions.planId, currentPlan.id),
        gte(workoutSessions.startedAt, twoWeeksAgo)
      )
    );

  // Fetch logged sets for those sessions
  let allLoggedSets: { exerciseId: string; reps: number | null; weightKg: number | null; rpe: number | null }[] = [];
  if (recentSessions.length > 0) {
    const sessionIds = recentSessions.map((s) => s.id);
    allLoggedSets = await db
      .select({
        exerciseId: loggedSets.exerciseId,
        reps: loggedSets.reps,
        weightKg: loggedSets.weightKg,
        rpe: loggedSets.rpe,
      })
      .from(loggedSets)
      .where(inArray(loggedSets.sessionId, sessionIds));
  }

  // Build progression map: exerciseId → { maxWeightKg, avgReps, maxRpe }
  const progressionMap: Record<string, { maxWeightKg: number; avgReps: number; maxRpe: number; count: number; totalReps: number }> = {};
  for (const s of allLoggedSets) {
    if (!progressionMap[s.exerciseId]) {
      progressionMap[s.exerciseId] = { maxWeightKg: 0, avgReps: 0, maxRpe: 0, count: 0, totalReps: 0 };
    }
    const entry = progressionMap[s.exerciseId];
    if (s.weightKg != null && s.weightKg > entry.maxWeightKg) entry.maxWeightKg = s.weightKg;
    if (s.rpe != null && s.rpe > entry.maxRpe) entry.maxRpe = s.rpe;
    if (s.reps != null) { entry.totalReps += s.reps; entry.count++; }
  }
  for (const id in progressionMap) {
    const e = progressionMap[id];
    e.avgReps = e.count > 0 ? Math.round(e.totalReps / e.count) : 0;
  }

  const hasLoggedData = allLoggedSets.length > 0;
  const noDataNote = hasLoggedData
    ? ""
    : "(No workout data logged this week. Maintain current volume. Only vary 1 exercise per day as novelty.)";

  // Build current plan text for prompt
  const dayMap: Record<number, typeof currentPlanExs> = {};
  for (const ex of currentPlanExs) {
    const day = ex.dayOfWeek ?? 7;
    if (!dayMap[day]) dayMap[day] = [];
    dayMap[day].push(ex);
  }

  const dayLabels = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const currentPlanText = Object.keys(dayMap)
    .map(Number)
    .sort((a, b) => a - b)
    .map((dayIdx) => {
      const exs = dayMap[dayIdx];
      const label = dayIdx < 7 ? dayLabels[dayIdx] : "Unscheduled";
      if (exs.length === 0) return `Day ${dayIdx} (${label}): REST`;
      const exLines = exs.map((ex) => {
        const weight = ex.targetWeightKg ? `@${ex.targetWeightKg}kg` : "(bodyweight)";
        const rest = ex.restSeconds ?? 90;
        const perf = progressionMap[ex.exerciseId];
        const perfStr = perf
          ? ` [actual: max ${perf.maxWeightKg}kg, avg ${perf.avgReps} reps, max RPE ${perf.maxRpe}/10]`
          : " [no data]";
        return `  - ${ex.name} ${ex.targetSets}×${ex.targetReps ?? "AMRAP"} ${weight} ${rest}s rest${perfStr}`;
      });
      return `Day ${dayIdx} (${label}):\n${exLines.join("\n")}`;
    })
    .join("\n\n");

  // Distinct day indices in current plan (for validation)
  const distinctDayCount = Object.keys(dayMap).length;

  const equipmentList =
    equipment.length > 0
      ? equipment.map((e) => e.name).join(", ")
      : "standard commercial gym (barbells, dumbbells, cables, machines, pull-up bar)";

  const goalDescriptions: Record<string, string> = {
    lose_fat: "fat loss with muscle preservation",
    build_muscle: "muscle hypertrophy and strength",
    maintain: "general fitness maintenance",
    improve_endurance: "cardiovascular endurance and conditioning",
  };

  const experienceDescriptions: Record<string, string> = {
    sedentary: "beginner with minimal fitness background",
    lightly_active: "beginner to intermediate",
    moderately_active: "intermediate with solid training base",
    very_active: "advanced with high training capacity",
  };

  const goalDesc = goalDescriptions[user.goal ?? ""] ?? "general fitness improvement";
  const expDesc = experienceDescriptions[user.activityLevel ?? ""] ?? "intermediate";

  const prompt = `You are updating a 7-day workout plan. Generate the NEXT WEEK's plan, adapted to the user's goal.

USER PROFILE:
- Goal: ${user.goal ?? "general"} (${goalDesc})
- Experience: ${expDesc}
- Weight: ${user.weightKg ?? 75}kg
- Available equipment: ${equipmentList}

CURRENT PLAN ("${currentPlan.name}"):
${currentPlanText}

${noDataNote}

Return ONLY valid JSON (no markdown, no explanation):
{
  "plan_name": "Week N: [same training style]",
  "days": [
    {
      "day_index": 0,
      "label": "Push",
      "exercises": [
        {
          "name": "Dumbbell Bench Press",
          "muscle_group": "chest",
          "equipment": "dumbbell",
          "sets": 4,
          "reps": 8,
          "rest_seconds": 90,
          "suggested_weight_kg": 30.0
        }
      ]
    }
  ]
}

RULES (follow all):
1. day_index and label for each day must exactly match the current plan
2. Rest days (exercises: []) must remain rest days
3. Per training day: keep 3-4 exercises unchanged, swap 1-2 for same-muscle-group variants
4. Progression is goal-specific (apply only where actual data exists per exercise):
   - build_muscle: compound lifts (bench, squat, deadlift, row, press) +2.5kg if avg_reps >= target_reps; isolation +1.25kg if avg_reps >= target_reps; add 1 set (max 5) if avg_reps >= target_reps AND max_rpe <= 7; never increase both weight AND sets in the same week
   - lose_fat: increase reps by 1-2 rather than adding weight; shorten rest by 5-10s; swap 1-2 exercises per day with higher-rep compound or circuit variants
   - improve_endurance: increase reps by 2-3; shorten rest by 10-15s; prioritize full_body and cardio-style movements in swaps
   - maintain: keep volume identical; vary 1-2 exercises per day for novelty only
   - For any goal: if avg_reps < target_reps, keep same weight and sets
5. For exercises with no actual data: keep identical sets/reps/suggested_weight_kg from current plan
6. equipment field must only use equipment from the available list
7. muscle_group must be one of: chest, back, shoulders, biceps, triceps, forearms, core, glutes, quads, hamstrings, calves, full_body
8. suggested_weight_kg: use the progressed weight (float), or null for bodyweight exercises`;

  const aiResponse = await client.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 3000,
    messages: [{ role: "user", content: prompt }],
  });

  let plan: GeneratedPlan;
  try {
    const text = aiResponse.content[0].type === "text" ? aiResponse.content[0].text : "{}";
    const cleaned = text.replace(/```(?:json)?\n?|\n?```/g, "").trim();
    plan = JSON.parse(cleaned);
  } catch (err) {
    console.error("Next-plan JSON parse error:", err);
    return NextResponse.json({ error: "Failed to generate plan" }, { status: 500 });
  }

  // Validate day count matches current plan structure
  if (!Array.isArray(plan.days) || plan.days.length !== distinctDayCount) {
    console.error(
      `Next-plan day count mismatch: expected ${distinctDayCount}, got ${plan.days?.length}`
    );
    return NextResponse.json({ error: "Failed to generate plan" }, { status: 500 });
  }

  // Deactivate all existing plans
  await db
    .update(workoutPlans)
    .set({ isActive: false })
    .where(eq(workoutPlans.userId, userId));

  // Create the new plan
  const [newPlan] = await db
    .insert(workoutPlans)
    .values({
      userId,
      name: plan.plan_name,
      description: `AI-generated for ${goalDesc}`,
      isActive: true,
      aiGenerated: true,
    })
    .returning();

  // Upsert exercises and create plan exercises
  let orderIndex = 0;
  for (const day of plan.days) {
    for (const ex of day.exercises) {
      const muscleGroup: MuscleGroup = VALID_MUSCLE_GROUPS.includes(
        ex.muscle_group as MuscleGroup
      )
        ? (ex.muscle_group as MuscleGroup)
        : "full_body";

      // Find or create exercise by name
      const existing = await db
        .select({ id: exercises.id })
        .from(exercises)
        .where(ilike(exercises.name, ex.name))
        .limit(1);

      let exerciseId: string;
      if (existing.length > 0) {
        exerciseId = existing[0].id;
      } else {
        const [newEx] = await db
          .insert(exercises)
          .values({
            name: ex.name,
            muscleGroup,
            equipment: ex.equipment || null,
            isCustom: false,
          })
          .returning();
        exerciseId = newEx.id;
      }

      await db.insert(planExercises).values({
        planId: newPlan.id,
        exerciseId,
        orderIndex: orderIndex++,
        targetSets: Math.max(1, ex.sets || 3),
        targetReps: Math.max(1, ex.reps || 10),
        targetWeightKg: ex.suggested_weight_kg ?? null,
        restSeconds: ex.rest_seconds || 90,
        dayOfWeek: day.day_index,
      });
    }
  }

  return NextResponse.json({ success: true });
}
