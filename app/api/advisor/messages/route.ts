import { auth } from "@/auth";
import { db } from "@/db";
import { advisorMessages } from "@/db/schema";
import { and, eq, asc, gte } from "drizzle-orm";
import { NextResponse } from "next/server";

export const DAILY_MESSAGE_LIMIT = 10;

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Only return today's messages — chat resets daily
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);

    const messages = await db
      .select()
      .from(advisorMessages)
      .where(
        and(
          eq(advisorMessages.userId, session.user.id),
          gte(advisorMessages.createdAt, todayStart)
        )
      )
      .orderBy(asc(advisorMessages.createdAt))
      .limit(100);

    return NextResponse.json(messages);
  } catch (err) {
    console.error("Failed to load advisor messages:", err);
    return NextResponse.json([], { status: 200 });
  }
}
