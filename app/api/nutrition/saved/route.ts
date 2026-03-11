import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { savedMeals } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const meals = await db
    .select()
    .from(savedMeals)
    .where(eq(savedMeals.userId, session.user.id))
    .orderBy(desc(savedMeals.createdAt))
    .limit(20);

  return NextResponse.json(meals);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, calories, proteinG, carbsG, fatG } = body as {
    name: string;
    calories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
  };

  if (!name || typeof calories !== "number") {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const [meal] = await db
    .insert(savedMeals)
    .values({
      userId: session.user.id,
      name,
      calories: Math.round(calories),
      proteinG,
      carbsG,
      fatG,
    })
    .returning({ id: savedMeals.id });

  return NextResponse.json({ id: meal.id }, { status: 201 });
}
