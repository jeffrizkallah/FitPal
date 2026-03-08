import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { mealLogs, dailySummaries } from "@/db/schema";
import { and, asc, eq, gte, lt } from "drizzle-orm";

export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const todayStr = new Date().toISOString().split("T")[0];
  const today = new Date(todayStr + "T00:00:00.000Z");
  const tomorrow = new Date(today.getTime() + 86400000);

  const [meals, summary] = await Promise.all([
    db
      .select()
      .from(mealLogs)
      .where(
        and(
          eq(mealLogs.userId, userId),
          gte(mealLogs.loggedAt, today),
          lt(mealLogs.loggedAt, tomorrow)
        )
      )
      .orderBy(asc(mealLogs.loggedAt)),
    db
      .select()
      .from(dailySummaries)
      .where(
        and(
          eq(dailySummaries.userId, userId),
          eq(dailySummaries.date, today.toISOString().split("T")[0])
        )
      )
      .limit(1),
  ]);

  return NextResponse.json({
    meals,
    totals: summary[0] ?? {
      totalCalories: 0,
      totalProteinG: 0,
      totalCarbsG: 0,
      totalFatG: 0,
    },
  });
}
