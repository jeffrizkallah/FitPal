import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

function calculateTargets({
  ageYears,
  heightCm,
  weightKg,
  goal,
  activityLevel,
}: {
  ageYears: number;
  heightCm: number;
  weightKg: number;
  goal: string;
  activityLevel: string;
}) {
  // Mifflin-St Jeor (male default)
  const bmr = 10 * weightKg + 6.25 * heightCm - 5 * ageYears + 5;

  const activityMultipliers: Record<string, number> = {
    sedentary: 1.2,
    lightly_active: 1.375,
    moderately_active: 1.55,
    very_active: 1.725,
  };
  const tdee = bmr * (activityMultipliers[activityLevel] ?? 1.375);

  const goalAdjustments: Record<string, number> = {
    lose_fat: -400,
    build_muscle: +250,
    maintain: 0,
    improve_endurance: -100,
  };
  const targetCalories = Math.round(tdee + (goalAdjustments[goal] ?? 0));

  const targetProteinG = Math.round(weightKg * 2.0);
  const proteinCals = targetProteinG * 4;
  const fatCals = Math.round(targetCalories * 0.28);
  const targetFatG = Math.round(fatCals / 9);
  const targetCarbsG = Math.round(
    Math.max(targetCalories - proteinCals - fatCals, 0) / 4
  );

  return { targetCalories, targetProteinG, targetCarbsG, targetFatG };
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const userName = session.user.name ?? null;
  const { message } = await req.json();

  if (!message?.trim()) {
    return NextResponse.json(
      { success: false, error: "No message provided" },
      { status: 400 }
    );
  }

  // Use Haiku for fast structured extraction
  const extraction = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 512,
    system: `Extract fitness profile data from the user's message. Return ONLY valid JSON, no markdown, no code fences:
{
  "height_cm": <number or null>,
  "weight_kg": <number or null>,
  "age_years": <number or null>,
  "goal": <"lose_fat" | "build_muscle" | "maintain" | "improve_endurance">,
  "activity_level": <"sedentary" | "lightly_active" | "moderately_active" | "very_active">,
  "user_context": <short string summarising any special needs, injuries, or specific goals mentioned, or "" if none>
}

Conversion rules:
- Feet/inches → cm (5'10" = 177.8cm, 6' = 182.9cm)
- Pounds/lbs → kg (divide by 2.205)
- "5 10" or "5-10" = 5 feet 10 inches

Goal mapping — always pick the CLOSEST of the four values, never null:
- lose weight / fat loss / cut / slim / tone / body recomposition → "lose_fat"
- gain muscle / bulk / build mass / get bigger / strength / powerlifting / bodybuilding → "build_muscle"
- injury rehab / recovering / post-surgery / strengthen specific body part / physical therapy / weak muscles / low back pain / joint pain / senior fitness / elderly / balance / functional fitness / general health → "build_muscle" (use "maintain" if the user explicitly wants no intensity)
- maintain / stay the same / stay fit / general wellness / not sure → "maintain"
- endurance / running / cardio / marathon / triathlon / cycling / swimming / sport performance / HIIT → "improve_endurance"
- If truly ambiguous, default to "build_muscle"

Activity mapping — always pick one, never null:
- desk job / sedentary / barely move / rarely exercise / very inactive → "sedentary"
- walk sometimes / light activity / 1-3 days per week / casual exercise → "lightly_active"
- 3-5 days per week / moderate / regular exercise → "moderately_active"
- 6-7 days per week / very active / athlete / daily training / physical job → "very_active"
- If not mentioned, default to "lightly_active"

user_context: Capture any important details the plan should respect, for example:
- injuries ("left knee ACL surgery 6 months ago")
- age-related notes ("70 years old, low impact preferred")
- specific body part goals ("wants to strengthen lower back and glutes")
- restrictions ("no heavy squats, doctor advised low-impact only")
- sport-specific goals ("training for a 10k in 3 months")
- Keep it under 100 characters. Use "" if nothing special.`,
    messages: [{ role: "user", content: message }],
  });

  let profile: {
    height_cm: number | null;
    weight_kg: number | null;
    age_years: number | null;
    goal: string;
    activity_level: string;
    user_context: string;
  };

  try {
    const raw =
      extraction.content[0].type === "text"
        ? extraction.content[0].text
        : "{}";
    // Strip markdown code fences if the model wrapped the JSON
    const text = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
    profile = JSON.parse(text);
  } catch {
    return NextResponse.json({
      success: false,
      error:
        "Could not read that. Try something like: '175cm, 80kg, recovering from knee injury, light activity'",
    });
  }

  if (!profile.height_cm || !profile.weight_kg) {
    const missing = [];
    if (!profile.height_cm) missing.push("height");
    if (!profile.weight_kg) missing.push("weight");
    return NextResponse.json({
      success: false,
      error: `Still need: ${missing.join(", ")}. Example: '32 years old, 180cm, 85kg, strengthening lower back'`,
    });
  }

  const activityLevel = profile.activity_level ?? "lightly_active";
  const ageYears = profile.age_years ?? 25;

  // Validate goal is a known enum value; fall back to "build_muscle" if something slipped through
  const VALID_GOALS = ["lose_fat", "build_muscle", "maintain", "improve_endurance"];
  const goal = VALID_GOALS.includes(profile.goal) ? profile.goal : "build_muscle";

  const targets = calculateTargets({
    ageYears,
    heightCm: profile.height_cm,
    weightKg: profile.weight_kg,
    goal,
    activityLevel,
  });

  // Save profile (onboardingDone stays false until plan is generated)
  await db
    .insert(users)
    .values({
      id: userId,
      name: userName,
      heightCm: profile.height_cm,
      weightKg: profile.weight_kg,
      goal: goal as "lose_fat" | "build_muscle" | "maintain" | "improve_endurance",
      activityLevel: activityLevel as
        | "sedentary"
        | "lightly_active"
        | "moderately_active"
        | "very_active",
      ageYears,
      ...targets,
      onboardingDone: false,
    })
    .onConflictDoUpdate({
      target: users.id,
      set: {
        name: userName,
        heightCm: profile.height_cm,
        weightKg: profile.weight_kg,
        goal: goal as "lose_fat" | "build_muscle" | "maintain" | "improve_endurance",
        activityLevel: activityLevel as
          | "sedentary"
          | "lightly_active"
          | "moderately_active"
          | "very_active",
        ageYears,
        ...targets,
        updatedAt: new Date(),
      },
    });

  return NextResponse.json({
    success: true,
    userContext: profile.user_context ?? "",
    profile: {
      heightCm: profile.height_cm,
      weightKg: profile.weight_kg,
      goal,
      activityLevel,
      ...targets,
    },
  });
}
