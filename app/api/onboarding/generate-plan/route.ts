import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import {
  users,
  exercises,
  workoutPlans,
  planExercises,
  gymEquipment,
} from "@/db/schema";
import { eq, asc, ilike } from "drizzle-orm";
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

  // Optional freeform context from the user's own description (passed from onboarding)
  let userContext = "";
  let workoutsPerWeek: number | null = null;
  try {
    const body = await req.json().catch(() => ({}));
    userContext = typeof body.userContext === "string" ? body.userContext.slice(0, 300) : "";
    const wpw = body.workoutsPerWeek;
    if (typeof wpw === "number" && wpw >= 1 && wpw <= 7) workoutsPerWeek = wpw;
  } catch {
    // no body is fine
  }

  const [user, equipment] = await Promise.all([
    db.select().from(users).where(eq(users.id, userId)).limit(1).then((r) => r[0]),
    db.select().from(gymEquipment).where(eq(gymEquipment.userId, userId)).orderBy(asc(gymEquipment.name)),
  ]);

  if (!user) {
    return NextResponse.json({ error: "User profile not found" }, { status: 404 });
  }

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

  const goalDesc =
    goalDescriptions[user.goal ?? ""] ?? "general fitness improvement";
  const expDesc =
    experienceDescriptions[user.activityLevel ?? ""] ?? "intermediate";

  const trainingDays = workoutsPerWeek ?? (user.activityLevel === "sedentary" ? 3 : user.activityLevel === "lightly_active" ? 3 : user.activityLevel === "moderately_active" ? 4 : 5);
  const restDays = 7 - trainingDays;

  const prompt = `Design a 7-day workout plan for:
- Goal: ${goalDesc}
- Experience: ${expDesc}
- Weight: ${user.weightKg ?? 75}kg
- Available equipment: ${equipmentList}
- Training days per week: ${trainingDays} (rest days: ${restDays})${userContext ? `\n- Special notes: ${userContext}` : ""}

Return ONLY valid JSON (no markdown, no explanation):
{
  "plan_name": "Week 1: [training style]",
  "days": [
    {
      "day_index": 0,
      "label": "Push",
      "exercises": [
        {
          "name": "Barbell Bench Press",
          "muscle_group": "chest",
          "equipment": "barbell",
          "sets": 4,
          "reps": 8,
          "rest_seconds": 90
        }
      ]
    }
  ]
}

Rules:
- day_index: 0=Monday through 6=Sunday
- Include exactly ${restDays} rest or active recovery days (exercises: []), spread across the week
- Training days: 4-6 exercises per session, tailored to the specific goal and focus areas mentioned
- muscle_group must be one of: chest, back, shoulders, biceps, triceps, forearms, core, glutes, quads, hamstrings, calves, full_body
- Only use equipment from the available list
- Volume guidelines:
  - fat loss: 12-15 reps, 60s rest, circuit-friendly
  - muscle: 6-12 reps, 90-120s rest, progressive overload
  - endurance: 15-20 reps, 45s rest, include cardio movements
  - maintain: 8-12 reps, 90s rest, balanced
- Beginner: 3 sets max, compound movements first
- Advanced: 4-5 sets, include isolation work
- Select exercises appropriate for the available equipment
- If special notes mention injuries, restrictions, or focus areas, design the plan around those specifically
- Distribute muscle groups intelligently across the training days to avoid overtraining the same muscle two days in a row`;


  const response = await client.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 3000,
    messages: [{ role: "user", content: prompt }],
  });

  let plan: GeneratedPlan;
  try {
    const text =
      response.content[0].type === "text" ? response.content[0].text : "{}";
    // Strip any accidental markdown fences
    const cleaned = text.replace(/```(?:json)?\n?|\n?```/g, "").trim();
    plan = JSON.parse(cleaned);
  } catch (err) {
    console.error("Plan JSON parse error:", err);
    return NextResponse.json(
      { error: "Failed to generate plan" },
      { status: 500 }
    );
  }

  // Deactivate any existing active plans
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
        restSeconds: ex.rest_seconds || 90,
        dayOfWeek: day.day_index,
      });
    }
  }

  // Mark onboarding complete
  await db
    .update(users)
    .set({ onboardingDone: true, updatedAt: new Date() })
    .where(eq(users.id, userId));

  return NextResponse.json({ success: true, plan });
}
