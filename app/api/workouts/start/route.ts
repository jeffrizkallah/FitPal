import { auth } from "@/auth";
import { db } from "@/db";
import { workoutPlans, workoutSessions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const body = await req.json().catch(() => ({}));
  const { planId } = body as { planId?: string };

  // If no planId provided, use the user's active plan
  let resolvedPlanId = planId ?? null;

  if (!resolvedPlanId) {
    const [activePlan] = await db
      .select({ id: workoutPlans.id })
      .from(workoutPlans)
      .where(eq(workoutPlans.userId, userId))
      .limit(1);

    // Find the active plan
    const [activeMarked] = await db
      .select({ id: workoutPlans.id })
      .from(workoutPlans)
      .where(eq(workoutPlans.isActive, true))
      .limit(1);

    resolvedPlanId = activeMarked?.id ?? activePlan?.id ?? null;
  }

  const [newSession] = await db
    .insert(workoutSessions)
    .values({
      userId,
      planId: resolvedPlanId,
      startedAt: new Date(),
    })
    .returning({ id: workoutSessions.id });

  return NextResponse.json({ sessionId: newSession.id }, { status: 201 });
}
