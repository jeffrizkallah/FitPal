import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

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
  // Mifflin-St Jeor (male default — Phase 4 advisor will refine with gender)
  const bmr = 10 * weightKg + 6.25 * heightCm - 5 * ageYears + 5;

  const activityMultipliers: Record<string, number> = {
    sedentary:         1.2,
    lightly_active:    1.375,
    moderately_active: 1.55,
    very_active:       1.725,
  };
  const tdee = bmr * (activityMultipliers[activityLevel] ?? 1.375);

  const goalAdjustments: Record<string, number> = {
    lose_fat:          -400,
    build_muscle:      +250,
    maintain:           0,
    improve_endurance: -100,
  };
  const targetCalories = Math.round(tdee + (goalAdjustments[goal] ?? 0));

  const targetProteinG = Math.round(weightKg * 2.0);
  const proteinCals    = targetProteinG * 4;
  const fatCals        = Math.round(targetCalories * 0.28);
  const targetFatG     = Math.round(fatCals / 9);
  const targetCarbsG   = Math.round(Math.max(targetCalories - proteinCals - fatCals, 0) / 4);

  return { targetCalories, targetProteinG, targetCarbsG, targetFatG };
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const body = await req.json();
  const { ageYears, heightCm, weightKg, goal, activityLevel } = body;
  // Fall back to the name saved on the auth user at sign-up
  const name: string | null = body.name ?? session.user?.name ?? null;

  const targets = calculateTargets({ ageYears, heightCm, weightKg, goal, activityLevel });

  await db
    .insert(users)
    .values({
      id: userId,
      name,
      ageYears,
      heightCm,
      weightKg,
      goal,
      activityLevel,
      ...targets,
      onboardingDone: true,
    })
    .onConflictDoUpdate({
      target: users.id,
      set: {
        name,
        ageYears,
        heightCm,
        weightKg,
        goal,
        activityLevel,
        ...targets,
        onboardingDone: true,
        updatedAt: new Date(),
      },
    });

  return NextResponse.json({ ok: true });
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await db
    .select({ onboardingDone: users.onboardingDone })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  return NextResponse.json({
    onboardingDone: existing[0]?.onboardingDone ?? false,
  });
}
