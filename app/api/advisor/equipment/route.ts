import { auth } from "@/auth";
import { db } from "@/db";
import { gymEquipment } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const items = await db
    .select()
    .from(gymEquipment)
    .where(eq(gymEquipment.userId, session.user.id))
    .orderBy(asc(gymEquipment.category), asc(gymEquipment.name));

  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, category, notes } = await req.json();

  if (!name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const [item] = await db
    .insert(gymEquipment)
    .values({
      userId: session.user.id,
      name: name.trim(),
      category: category ?? null,
      notes: notes ?? null,
    })
    .returning();

  return NextResponse.json(item, { status: 201 });
}
