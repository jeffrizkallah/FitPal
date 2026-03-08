import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/db";
import { mealLogs, dailySummaries } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const body = await req.json();
  const { name, mealType, calories, proteinG, carbsG, fatG, aiRawData } =
    body as {
      name: string;
      mealType: "breakfast" | "lunch" | "dinner" | "snack";
      calories: number;
      proteinG: number;
      carbsG: number;
      fatG: number;
      aiRawData?: object;
    };

  const [meal] = await db
    .insert(mealLogs)
    .values({
      userId,
      mealType,
      loggedAt: new Date(),
      name,
      calories: Math.round(calories),
      proteinG,
      carbsG,
      fatG,
      aiRawData: aiRawData ?? null,
    })
    .returning({ id: mealLogs.id });

  // Upsert daily summary (select → update or insert)
  const today = new Date().toISOString().split("T")[0];

  const [existing] = await db
    .select()
    .from(dailySummaries)
    .where(
      and(eq(dailySummaries.userId, userId), eq(dailySummaries.date, today))
    )
    .limit(1);

  if (existing) {
    await db
      .update(dailySummaries)
      .set({
        totalCalories: (existing.totalCalories ?? 0) + Math.round(calories),
        totalProteinG: (existing.totalProteinG ?? 0) + proteinG,
        totalCarbsG: (existing.totalCarbsG ?? 0) + carbsG,
        totalFatG: (existing.totalFatG ?? 0) + fatG,
      })
      .where(eq(dailySummaries.id, existing.id));
  } else {
    await db.insert(dailySummaries).values({
      userId,
      date: today,
      totalCalories: Math.round(calories),
      totalProteinG: proteinG,
      totalCarbsG: carbsG,
      totalFatG: fatG,
      workoutDoneMin: 0,
    });
  }

  // Invalidate router cache so /nutrition and home show fresh data immediately
  revalidatePath("/nutrition");
  revalidatePath("/");

  return NextResponse.json({ id: meal.id }, { status: 201 });
}
