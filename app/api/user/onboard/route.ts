import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

// Mifflin-St Jeor BMR → TDEE → macro split
function calculateTargets({
  ageYears,
  heightCm,
  weightKg,
  goal,
  activityLevel,
  isMale = true,
}: {
  ageYears: number;
  heightCm: number;
  weightKg: number;
  goal: string;
  activityLevel: string;
  isMale?: boolean;
}) {
  const bmr = isMale
    ? 10 * weightKg + 6.25 * heightCm - 5 * ageYears + 5
    : 10 * weightKg + 6.25 * heightCm - 5 * ageYears - 161;

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

  // Macro split (protein-forward)
  const targetProteinG = Math.round(weightKg * 2.0);       // 2g per kg
  const proteinCals    = targetProteinG * 4;
  const fatCals        = Math.round(targetCalories * 0.28);
  const targetFatG     = Math.round(fatCals / 9);
  const remainingCals  = targetCalories - proteinCals - fatCals;
  const targetCarbsG   = Math.round(Math.max(remainingCals, 0) / 4);

  return { targetCalories, targetProteinG, targetCarbsG, targetFatG };
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clerkUser = await currentUser();
  if (!clerkUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const body = await req.json();
  const { name, ageYears, heightCm, weightKg, goal, activityLevel } = body;

  const targets = calculateTargets({ ageYears, heightCm, weightKg, goal, activityLevel });

  await db
    .insert(users)
    .values({
      clerkId:       userId,
      email:         clerkUser.emailAddresses[0]?.emailAddress ?? "",
      name,
      avatarUrl:     clerkUser.imageUrl,
      ageYears,
      heightCm,
      weightKg,
      goal,
      activityLevel,
      ...targets,
      onboardingDone: true,
    })
    .onConflictDoUpdate({
      target: users.clerkId,
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

// Sync Clerk user to DB on first login (called from dashboard layout)
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await db
    .select({ onboardingDone: users.onboardingDone })
    .from(users)
    .where(eq(users.clerkId, userId))
    .limit(1);

  return NextResponse.json({
    onboardingDone: existing[0]?.onboardingDone ?? false,
  });
}
