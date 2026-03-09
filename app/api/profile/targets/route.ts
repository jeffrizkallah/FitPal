import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { targetCalories, targetProteinG, targetCarbsG, targetFatG } =
    await req.json();

  const updates: Partial<typeof users.$inferInsert> = {};
  if (typeof targetCalories === "number") updates.targetCalories = targetCalories;
  if (typeof targetProteinG === "number") updates.targetProteinG = targetProteinG;
  if (typeof targetCarbsG === "number") updates.targetCarbsG = targetCarbsG;
  if (typeof targetFatG === "number") updates.targetFatG = targetFatG;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No values to update" }, { status: 400 });
  }

  await db
    .update(users)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(users.id, session.user.id));

  return NextResponse.json({ success: true });
}
