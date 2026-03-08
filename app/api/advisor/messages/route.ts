import { auth } from "@/auth";
import { db } from "@/db";
import { advisorMessages } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const messages = await db
    .select()
    .from(advisorMessages)
    .where(eq(advisorMessages.userId, session.user.id))
    .orderBy(asc(advisorMessages.createdAt))
    .limit(100);

  return NextResponse.json(messages);
}
