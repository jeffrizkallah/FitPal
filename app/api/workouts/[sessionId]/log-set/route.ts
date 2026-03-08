import { auth } from "@/auth";
import { db } from "@/db";
import { workoutSessions, loggedSets } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sessionId } = await params;

  // Verify session belongs to user
  const [workoutSession] = await db
    .select({ userId: workoutSessions.userId, completedAt: workoutSessions.completedAt })
    .from(workoutSessions)
    .where(eq(workoutSessions.id, sessionId))
    .limit(1);

  if (!workoutSession || workoutSession.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (workoutSession.completedAt) {
    return NextResponse.json({ error: "Session already completed" }, { status: 400 });
  }

  const body = await req.json();
  const { exerciseId, setNumber, reps, weightKg, rpe } = body as {
    exerciseId: string;
    setNumber: number;
    reps?: number;
    weightKg?: number;
    rpe?: number;
  };

  if (!exerciseId || !setNumber) {
    return NextResponse.json({ error: "exerciseId and setNumber are required" }, { status: 400 });
  }

  const [logged] = await db
    .insert(loggedSets)
    .values({
      sessionId,
      exerciseId,
      setNumber,
      reps: reps ?? null,
      weightKg: weightKg ?? null,
      rpe: rpe ?? null,
    })
    .returning();

  return NextResponse.json(logged, { status: 201 });
}
