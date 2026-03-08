import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/db";
import { mealLogs, dailySummaries } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ mealId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const { mealId } = await params;

  const [meal] = await db
    .select()
    .from(mealLogs)
    .where(and(eq(mealLogs.id, mealId), eq(mealLogs.userId, userId)))
    .limit(1);

  if (!meal) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db.delete(mealLogs).where(eq(mealLogs.id, mealId));

  // Subtract from daily summary
  const today = new Date().toISOString().split("T")[0];
  const [summary] = await db
    .select()
    .from(dailySummaries)
    .where(
      and(eq(dailySummaries.userId, userId), eq(dailySummaries.date, today))
    )
    .limit(1);

  if (summary) {
    await db
      .update(dailySummaries)
      .set({
        totalCalories: Math.max(0, (summary.totalCalories ?? 0) - meal.calories),
        totalProteinG: Math.max(0, (summary.totalProteinG ?? 0) - meal.proteinG),
        totalCarbsG: Math.max(0, (summary.totalCarbsG ?? 0) - meal.carbsG),
        totalFatG: Math.max(0, (summary.totalFatG ?? 0) - meal.fatG),
      })
      .where(eq(dailySummaries.id, summary.id));
  }

  revalidatePath("/nutrition");
  revalidatePath("/");

  return NextResponse.json({ success: true });
}
