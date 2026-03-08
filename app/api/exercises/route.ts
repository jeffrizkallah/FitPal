import { auth } from "@/auth";
import { db } from "@/db";
import { exercises } from "@/db/schema";
import { eq, or } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  // Return all base exercises + user's custom exercises
  const list = await db
    .select()
    .from(exercises)
    .where(or(eq(exercises.isCustom, false), eq(exercises.createdBy, userId)));

  return NextResponse.json(list);
}
