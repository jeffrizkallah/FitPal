import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { users, dailySummaries, workoutSessions } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import MacroRing from "@/components/dashboard/MacroRing";
import DailySnapshot from "@/components/dashboard/DailySnapshot";

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

export default async function HomePage() {
  const { userId } = await auth();

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, userId!))
    .limit(1);

  const [summary] = await db
    .select()
    .from(dailySummaries)
    .where(eq(dailySummaries.userId, userId!))
    // would filter by date too in real query — simplified here
    .limit(1);

  const [lastSession] = await db
    .select({ completedAt: workoutSessions.completedAt, durationMin: workoutSessions.durationMin })
    .from(workoutSessions)
    .where(eq(workoutSessions.userId, userId!))
    .orderBy(desc(workoutSessions.startedAt))
    .limit(1);

  const calConsumed  = summary?.totalCalories ?? 0;
  const calTarget    = user?.targetCalories   ?? 2000;
  const proteinG     = summary?.totalProteinG ?? 0;
  const proteinTarget = user?.targetProteinG  ?? 150;

  const greeting = getGreeting();

  return (
    <div className="px-6 pt-12 animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <p className="text-label text-text-secondary mb-1">{greeting}</p>
        <h1 className="text-title">{user?.name ?? "Athlete"}</h1>
      </div>

      {/* Calorie ring */}
      <MacroRing
        consumed={calConsumed}
        target={calTarget}
        proteinG={Math.round(proteinG)}
        proteinTargetG={proteinTarget}
      />

      {/* Daily snapshot cards */}
      <DailySnapshot
        user={user}
        summary={summary ?? null}
        lastSession={lastSession ?? null}
      />
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning.";
  if (h < 17) return "Good afternoon.";
  return "Good evening.";
}
