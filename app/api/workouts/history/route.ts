import { auth } from "@/auth";
import { db } from "@/db";
import { workoutSessions, workoutPlans, loggedSets } from "@/db/schema";
import { eq, desc, count } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const sessions = await db
    .select({
      id: workoutSessions.id,
      planId: workoutSessions.planId,
      startedAt: workoutSessions.startedAt,
      completedAt: workoutSessions.completedAt,
      durationMin: workoutSessions.durationMin,
      planName: workoutPlans.name,
    })
    .from(workoutSessions)
    .leftJoin(workoutPlans, eq(workoutSessions.planId, workoutPlans.id))
    .where(eq(workoutSessions.userId, userId))
    .orderBy(desc(workoutSessions.startedAt))
    .limit(20);

  // Get set counts per session
  const sessionIds = sessions.map((s) => s.id);

  const setCounts = sessionIds.length
    ? await Promise.all(
        sessionIds.map(async (id) => {
          const [result] = await db
            .select({ count: count() })
            .from(loggedSets)
            .where(eq(loggedSets.sessionId, id));
          return { sessionId: id, setCount: result?.count ?? 0 };
        })
      )
    : [];

  const countMap = new Map(setCounts.map((s) => [s.sessionId, s.setCount]));

  const enriched = sessions.map((s) => ({
    ...s,
    setCount: countMap.get(s.id) ?? 0,
  }));

  return NextResponse.json(enriched);
}
