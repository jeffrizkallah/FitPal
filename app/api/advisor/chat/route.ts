import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import {
  users,
  advisorMessages,
  dailySummaries,
  workoutSessions,
  workoutPlans,
  planExercises,
  exercises,
  gymEquipment,
} from "@/db/schema";
import { eq, desc, asc, ilike } from "drizzle-orm";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

const GOAL_LABELS: Record<string, string> = {
  lose_fat: "lose fat",
  build_muscle: "build muscle",
  maintain: "maintain weight",
  improve_endurance: "improve endurance",
};

const ACTIVITY_LABELS: Record<string, string> = {
  sedentary: "sedentary",
  lightly_active: "lightly active",
  moderately_active: "moderately active",
  very_active: "very active",
};

// ─── Tool definitions ─────────────────────────────────────
const ADVISOR_TOOLS: Anthropic.Tool[] = [
  {
    name: "update_exercise",
    description:
      "Update sets, reps, weight, or rest time for a specific exercise in the user's active workout plan. Only call this when the user explicitly asks to change their plan.",
    input_schema: {
      type: "object" as const,
      properties: {
        plan_exercise_id: {
          type: "string",
          description: "The ID of the plan exercise entry to update (from the plan listed in context)",
        },
        target_sets: { type: "integer", description: "New number of sets" },
        target_reps: { type: "integer", description: "New number of reps per set" },
        target_weight_kg: { type: "number", description: "New target weight in kilograms" },
        rest_seconds: { type: "integer", description: "New rest duration between sets in seconds" },
      },
      required: ["plan_exercise_id"],
    },
  },
  {
    name: "update_macro_targets",
    description:
      "Update the user's daily nutrition targets. Only call this when the user explicitly asks to adjust their macro or calorie goals.",
    input_schema: {
      type: "object" as const,
      properties: {
        target_calories: { type: "integer", description: "New daily calorie target" },
        target_protein_g: { type: "integer", description: "New daily protein target in grams" },
        target_carbs_g: { type: "integer", description: "New daily carbs target in grams" },
        target_fat_g: { type: "integer", description: "New daily fat target in grams" },
      },
    },
  },
  {
    name: "replace_exercise",
    description:
      "Swap an exercise in the user's plan with a different one. Use when the user asks to change a specific exercise to another. Finds or creates the replacement exercise in the database.",
    input_schema: {
      type: "object" as const,
      properties: {
        plan_exercise_id: {
          type: "string",
          description: "The ID of the plan exercise entry to replace (from the plan listed in context)",
        },
        new_exercise_name: {
          type: "string",
          description: "Name of the replacement exercise",
        },
        muscle_group: {
          type: "string",
          description: "Muscle group for the new exercise (chest, back, shoulders, biceps, triceps, forearms, core, glutes, quads, hamstrings, calves, full_body)",
        },
        equipment: {
          type: "string",
          description: "Equipment needed for the new exercise (e.g. barbell, dumbbell, cable, bodyweight)",
        },
      },
      required: ["plan_exercise_id", "new_exercise_name", "muscle_group"],
    },
  },
  {
    name: "add_exercise",
    description:
      "Add a new exercise to the user's active workout plan on a specific day. Use when the user asks to add an exercise to their plan.",
    input_schema: {
      type: "object" as const,
      properties: {
        exercise_name: { type: "string", description: "Name of the exercise to add" },
        muscle_group: {
          type: "string",
          description: "Muscle group (chest, back, shoulders, biceps, triceps, forearms, core, glutes, quads, hamstrings, calves, full_body)",
        },
        equipment: { type: "string", description: "Equipment needed (e.g. dumbbell, barbell, bodyweight)" },
        day_of_week: {
          type: "integer",
          description: "Day index: 0=Monday, 1=Tuesday, ..., 6=Sunday",
        },
        target_sets: { type: "integer", description: "Number of sets (default 3)" },
        target_reps: { type: "integer", description: "Number of reps per set (default 10)" },
        rest_seconds: { type: "integer", description: "Rest between sets in seconds (default 90)" },
      },
      required: ["exercise_name", "muscle_group", "day_of_week"],
    },
  },
  {
    name: "remove_exercise",
    description:
      "Remove an exercise from the user's active workout plan. Use when the user asks to drop or remove a specific exercise.",
    input_schema: {
      type: "object" as const,
      properties: {
        plan_exercise_id: {
          type: "string",
          description: "The ID of the plan exercise entry to remove (from the plan listed in context)",
        },
      },
      required: ["plan_exercise_id"],
    },
  },
];

// ─── Tool executor ────────────────────────────────────────
async function executeTool(
  name: string,
  input: Record<string, unknown>,
  userId: string
): Promise<{ success: boolean; message: string }> {
  if (name === "update_exercise") {
    const { plan_exercise_id, target_sets, target_reps, target_weight_kg, rest_seconds } = input as {
      plan_exercise_id: string;
      target_sets?: number;
      target_reps?: number;
      target_weight_kg?: number;
      rest_seconds?: number;
    };

    const updates: Partial<typeof planExercises.$inferInsert> = {};
    if (target_sets !== undefined) updates.targetSets = target_sets;
    if (target_reps !== undefined) updates.targetReps = target_reps;
    if (target_weight_kg !== undefined) updates.targetWeightKg = target_weight_kg;
    if (rest_seconds !== undefined) updates.restSeconds = rest_seconds;

    if (Object.keys(updates).length === 0) {
      return { success: false, message: "No fields to update." };
    }

    await db
      .update(planExercises)
      .set(updates)
      .where(eq(planExercises.id, plan_exercise_id));

    return { success: true, message: "Exercise updated successfully." };
  }

  if (name === "update_macro_targets") {
    const { target_calories, target_protein_g, target_carbs_g, target_fat_g } = input as {
      target_calories?: number;
      target_protein_g?: number;
      target_carbs_g?: number;
      target_fat_g?: number;
    };

    const updates: Partial<typeof users.$inferInsert> = {};
    if (target_calories !== undefined) updates.targetCalories = target_calories;
    if (target_protein_g !== undefined) updates.targetProteinG = target_protein_g;
    if (target_carbs_g !== undefined) updates.targetCarbsG = target_carbs_g;
    if (target_fat_g !== undefined) updates.targetFatG = target_fat_g;

    if (Object.keys(updates).length === 0) {
      return { success: false, message: "No fields to update." };
    }

    await db.update(users).set(updates).where(eq(users.id, userId));

    return { success: true, message: "Macro targets updated successfully." };
  }

  if (name === "replace_exercise") {
    const { plan_exercise_id, new_exercise_name, muscle_group, equipment } = input as {
      plan_exercise_id: string;
      new_exercise_name: string;
      muscle_group: string;
      equipment?: string;
    };

    const VALID_MUSCLE_GROUPS = [
      "chest","back","shoulders","biceps","triceps","forearms","core",
      "glutes","quads","hamstrings","calves","full_body",
    ] as const;
    type MuscleGroup = typeof VALID_MUSCLE_GROUPS[number];
    const mg: MuscleGroup = VALID_MUSCLE_GROUPS.includes(muscle_group as MuscleGroup)
      ? (muscle_group as MuscleGroup)
      : "full_body";

    // Find or create the replacement exercise
    const existing = await db
      .select({ id: exercises.id })
      .from(exercises)
      .where(ilike(exercises.name, new_exercise_name))
      .limit(1);

    let exerciseId: string;
    if (existing.length > 0) {
      exerciseId = existing[0].id;
    } else {
      const [newEx] = await db
        .insert(exercises)
        .values({ name: new_exercise_name, muscleGroup: mg, equipment: equipment ?? null, isCustom: false })
        .returning();
      exerciseId = newEx.id;
    }

    await db
      .update(planExercises)
      .set({ exerciseId })
      .where(eq(planExercises.id, plan_exercise_id));

    return { success: true, message: `Exercise replaced with ${new_exercise_name}.` };
  }

  if (name === "add_exercise") {
    const { exercise_name, muscle_group, equipment, day_of_week, target_sets, target_reps, rest_seconds } = input as {
      exercise_name: string;
      muscle_group: string;
      equipment?: string;
      day_of_week: number;
      target_sets?: number;
      target_reps?: number;
      rest_seconds?: number;
    };

    const VALID_MUSCLE_GROUPS = [
      "chest","back","shoulders","biceps","triceps","forearms","core",
      "glutes","quads","hamstrings","calves","full_body",
    ] as const;
    type MuscleGroup = typeof VALID_MUSCLE_GROUPS[number];
    const mg: MuscleGroup = VALID_MUSCLE_GROUPS.includes(muscle_group as MuscleGroup)
      ? (muscle_group as MuscleGroup)
      : "full_body";

    // Find the user's active plan
    const [activePlan] = await db
      .select({ id: workoutPlans.id })
      .from(workoutPlans)
      .where(eq(workoutPlans.userId, userId))
      .orderBy(desc(workoutPlans.createdAt))
      .limit(1);

    if (!activePlan) return { success: false, message: "No active plan found." };

    // Find max orderIndex for the day
    const dayExercises = await db
      .select({ orderIndex: planExercises.orderIndex })
      .from(planExercises)
      .where(eq(planExercises.planId, activePlan.id));

    const maxOrder = dayExercises.reduce((max, e) => Math.max(max, e.orderIndex ?? 0), 0);

    // Find or create exercise
    const existing = await db
      .select({ id: exercises.id })
      .from(exercises)
      .where(ilike(exercises.name, exercise_name))
      .limit(1);

    let exerciseId: string;
    if (existing.length > 0) {
      exerciseId = existing[0].id;
    } else {
      const [newEx] = await db
        .insert(exercises)
        .values({ name: exercise_name, muscleGroup: mg, equipment: equipment ?? null, isCustom: false })
        .returning();
      exerciseId = newEx.id;
    }

    await db.insert(planExercises).values({
      planId: activePlan.id,
      exerciseId,
      orderIndex: maxOrder + 1,
      targetSets: target_sets ?? 3,
      targetReps: target_reps ?? 10,
      restSeconds: rest_seconds ?? 90,
      dayOfWeek: day_of_week,
    });

    return { success: true, message: `${exercise_name} added to the plan.` };
  }

  if (name === "remove_exercise") {
    const { plan_exercise_id } = input as { plan_exercise_id: string };

    await db.delete(planExercises).where(eq(planExercises.id, plan_exercise_id));

    return { success: true, message: "Exercise removed from plan." };
  }

  return { success: false, message: "Unknown tool." };
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const userId = session.user.id;
  const body = await req.json();
  const message: string = body.message?.trim();

  if (!message) {
    return new Response("Missing message", { status: 400 });
  }

  // Fetch all context in parallel
  const [user, recentSummaries, recentSessions, history, activePlanRows, equipment] =
    await Promise.all([
      db.select().from(users).where(eq(users.id, userId)).limit(1).then((r) => r[0]),
      db
        .select()
        .from(dailySummaries)
        .where(eq(dailySummaries.userId, userId))
        .orderBy(desc(dailySummaries.date))
        .limit(7),
      db
        .select({
          startedAt: workoutSessions.startedAt,
          durationMin: workoutSessions.durationMin,
          planName: workoutPlans.name,
        })
        .from(workoutSessions)
        .leftJoin(workoutPlans, eq(workoutSessions.planId, workoutPlans.id))
        .where(eq(workoutSessions.userId, userId))
        .orderBy(desc(workoutSessions.startedAt))
        .limit(5),
      db
        .select()
        .from(advisorMessages)
        .where(eq(advisorMessages.userId, userId))
        .orderBy(asc(advisorMessages.createdAt))
        .limit(20),
      // Active plan + exercises
      db
        .select({
          planId: workoutPlans.id,
          planName: workoutPlans.name,
          planExerciseId: planExercises.id,
          exerciseName: exercises.name,
          targetSets: planExercises.targetSets,
          targetReps: planExercises.targetReps,
          targetWeightKg: planExercises.targetWeightKg,
          restSeconds: planExercises.restSeconds,
          dayOfWeek: planExercises.dayOfWeek,
        })
        .from(workoutPlans)
        .innerJoin(planExercises, eq(planExercises.planId, workoutPlans.id))
        .innerJoin(exercises, eq(exercises.id, planExercises.exerciseId))
        .where(eq(workoutPlans.userId, userId))
        .orderBy(asc(planExercises.orderIndex))
        .limit(30),
      db
        .select()
        .from(gymEquipment)
        .where(eq(gymEquipment.userId, userId))
        .orderBy(asc(gymEquipment.name)),
    ]);

  // Save user message immediately
  await db.insert(advisorMessages).values({ userId, role: "user", content: message });

  // ── Build system prompt ──────────────────────────────────
  const nutritionContext = recentSummaries.length
    ? recentSummaries
        .map(
          (s) =>
            `${s.date}: ${s.totalCalories ?? 0}kcal, ${Math.round(s.totalProteinG ?? 0)}g protein, ${Math.round(s.totalCarbsG ?? 0)}g carbs, ${Math.round(s.totalFatG ?? 0)}g fat`
        )
        .join("\n")
    : "No nutrition data logged yet.";

  const workoutContext = recentSessions.length
    ? recentSessions
        .map((s) => {
          const date = new Date(s.startedAt).toLocaleDateString("en-CA");
          return `${date}: ${s.planName ?? "Unnamed plan"} — ${s.durationMin ?? "?"}min`;
        })
        .join("\n")
    : "No workout sessions logged yet.";

  const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const planContext = activePlanRows.length
    ? `Active Plan: "${activePlanRows[0].planName}"\n` +
      activePlanRows
        .map(
          (e) =>
            `  - [ID: ${e.planExerciseId}] ${e.exerciseName}: ${e.targetSets}×${e.targetReps ?? "AMRAP"}` +
            (e.targetWeightKg ? ` @ ${e.targetWeightKg}kg` : "") +
            (e.restSeconds ? `, ${e.restSeconds}s rest` : "") +
            (e.dayOfWeek !== null && e.dayOfWeek !== undefined ? ` (${DAYS[e.dayOfWeek]})` : "")
        )
        .join("\n")
    : "No active workout plan.";

  const equipmentContext = equipment.length
    ? equipment.map((e) => `${e.name}${e.category ? ` (${e.category})` : ""}`).join(", ")
    : "No equipment logged yet.";

  const systemPrompt = `You are a professional fitness advisor. Be direct, concise, and data-driven. No motivational filler. No exclamation marks. Never use em-dashes (—) in your responses. Give specific, actionable advice backed by the user's actual data.

You have tools to fully edit the user's workout plan and nutrition targets. Use them when the user asks. You can: update sets/reps/weight/rest for any exercise, swap an exercise for a different one, add a new exercise to any day, remove an exercise, and adjust calorie/macro targets.

User Profile:
- Name: ${user?.name ?? "Unknown"}
- Age: ${user?.ageYears ?? "?"}yr, Height: ${user?.heightCm ?? "?"}cm, Weight: ${user?.weightKg ?? "?"}kg
- Goal: ${GOAL_LABELS[user?.goal ?? ""] ?? user?.goal ?? "Unknown"}
- Activity: ${ACTIVITY_LABELS[user?.activityLevel ?? ""] ?? user?.activityLevel ?? "Unknown"}
- Daily targets: ${user?.targetCalories ?? "?"}kcal | ${user?.targetProteinG ?? "?"}g protein | ${user?.targetCarbsG ?? "?"}g carbs | ${user?.targetFatG ?? "?"}g fat

Workout Plan:
${planContext}

Available Equipment: ${equipmentContext}

Nutrition (last ${recentSummaries.length} days):
${nutritionContext}

Sessions (last ${recentSessions.length}):
${workoutContext}

Keep responses to 3–5 sentences unless a detailed breakdown is requested. When recommending exercise changes, use the exact plan exercise IDs shown above.`;

  const claudeMessages: Anthropic.MessageParam[] = [
    ...history.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user", content: message },
  ];

  // ── Streaming with transparent tool use ──────────────────
  const encoder = new TextEncoder();

  const readableStream = new ReadableStream({
    async start(controller) {
      try {
        // Phase 1: stream first response (with tools)
        const firstStream = client.messages.stream({
          model: "claude-opus-4-6",
          max_tokens: 1024,
          system: systemPrompt,
          messages: claudeMessages,
          tools: ADVISOR_TOOLS,
        });

        let firstText = "";
        const collectedToolUses: Array<{ id: string; name: string; inputStr: string }> = [];
        let activeToolUse: { id: string; name: string; inputStr: string } | null = null;

        for await (const event of firstStream) {
          if (
            event.type === "content_block_start" &&
            event.content_block.type === "tool_use"
          ) {
            activeToolUse = {
              id: event.content_block.id,
              name: event.content_block.name,
              inputStr: "",
            };
          } else if (
            event.type === "content_block_delta" &&
            event.delta.type === "input_json_delta" &&
            activeToolUse
          ) {
            activeToolUse.inputStr += event.delta.partial_json;
          } else if (event.type === "content_block_stop" && activeToolUse) {
            collectedToolUses.push(activeToolUse);
            activeToolUse = null;
          } else if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            firstText += event.delta.text;
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }

        // No tool use — save and done
        if (collectedToolUses.length === 0) {
          await db.insert(advisorMessages).values({
            userId,
            role: "assistant",
            content: firstText,
          });
          controller.close();
          return;
        }

        // Phase 2: execute tools
        const toolResults: Anthropic.ToolResultBlockParam[] = [];
        for (const tool of collectedToolUses) {
          const input = JSON.parse(tool.inputStr || "{}") as Record<string, unknown>;
          const result = await executeTool(tool.name, input, userId);
          toolResults.push({
            type: "tool_result",
            tool_use_id: tool.id,
            content: JSON.stringify(result),
          });
        }

        // Build assistant content for follow-up (text + tool_use blocks)
        // Use Anthropic.Messages.ContentBlockParam which accepts partial shapes
        type ContentPart = Anthropic.Messages.TextBlockParam | Anthropic.Messages.ToolUseBlockParam;
        const assistantContent: ContentPart[] = [];
        if (firstText) {
          assistantContent.push({ type: "text", text: firstText });
        }
        for (const tool of collectedToolUses) {
          assistantContent.push({
            type: "tool_use",
            id: tool.id,
            name: tool.name,
            input: JSON.parse(tool.inputStr || "{}"),
          });
        }

        const followUpMessages: Anthropic.MessageParam[] = [
          ...claudeMessages,
          { role: "assistant", content: assistantContent },
          { role: "user", content: toolResults },
        ];

        // Phase 3: stream follow-up response
        const followUpStream = client.messages.stream({
          model: "claude-opus-4-6",
          max_tokens: 512,
          system: systemPrompt,
          messages: followUpMessages,
        });

        let followUpText = "";
        for await (const event of followUpStream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            followUpText += event.delta.text;
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }

        await db.insert(advisorMessages).values({
          userId,
          role: "assistant",
          content: followUpText || firstText,
        });
      } catch (err) {
        console.error("Advisor chat error:", err);
        controller.enqueue(encoder.encode("Something went wrong. Please try again."));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readableStream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
