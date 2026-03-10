import { auth } from "@/auth";
import { db } from "@/db";
import { users, authUsers, dailySummaries, workoutSessions } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import Link from "next/link";

export const dynamic = "force-dynamic";
import MacroRing from "@/components/dashboard/MacroRing";
import NudgesSection from "@/components/advisor/NudgesSection";
import ContextualQuickStart from "@/components/dashboard/ContextualQuickStart";
import PageRefresher from "@/components/PageRefresher";

export default async function HomePage() {
  const session = await auth();
  const userId = session!.user!.id!;

  const todayStr = new Date().toISOString().split("T")[0];

  // Parallelize all DB queries for performance
  const [userRows, authUserRows, summaryRows, sessionRows] = await Promise.all([
    db.select().from(users).where(eq(users.id, userId)).limit(1),
    db.select({ name: authUsers.name }).from(authUsers).where(eq(authUsers.id, userId)).limit(1),
    db.select().from(dailySummaries)
      .where(and(eq(dailySummaries.userId, userId), eq(dailySummaries.date, todayStr)))
      .limit(1),
    db
      .select({ completedAt: workoutSessions.completedAt, durationMin: workoutSessions.durationMin })
      .from(workoutSessions)
      .where(eq(workoutSessions.userId, userId))
      .orderBy(desc(workoutSessions.startedAt))
      .limit(1),
  ]);

  const user        = userRows[0];
  const summary     = summaryRows[0];
  const lastSession = sessionRows[0];
  const displayName = user?.name ?? authUserRows[0]?.name ?? "Athlete";

  const calConsumed   = summary?.totalCalories ?? 0;
  const calTarget     = user?.targetCalories   ?? 2000;
  const proteinG      = summary?.totalProteinG ?? 0;
  const proteinTarget = user?.targetProteinG   ?? 150;
  const carbsG        = summary?.totalCarbsG   ?? 0;
  const carbsTarget   = user?.targetCarbsG     ?? 250;

  const greeting = getGreeting();

  return (
    <div className="px-6 pt-12 animate-fade-in">
      <PageRefresher />
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="text-label text-text-secondary mb-1">{greeting}</p>
          <h1 className="text-title">{displayName}</h1>
        </div>

        <Link
          href="/profile"
          aria-label="Profile"
          style={{
            background: "var(--neuo-bg)",
            boxShadow: "4px 4px 10px var(--neuo-mid), -4px -4px 10px var(--neuo-light)",
          }}
          className="flex items-center justify-center w-11 h-11 rounded-2xl transition-all duration-200 active:shadow-[inset_4px_4px_8px_var(--neuo-mid),inset_-4px_-4px_8px_var(--neuo-light)]"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#2c2c2c"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
          </svg>
        </Link>
      </div>

      <MacroRing
        consumed={calConsumed}
        target={calTarget}
        proteinG={Math.round(proteinG)}
        proteinTargetG={proteinTarget}
        carbsG={Math.round(carbsG)}
        carbsTargetG={carbsTarget}
      />

      <ContextualQuickStart
        lastSessionMin={lastSession?.durationMin ?? 0}
        mealLogged={calConsumed > 0}
        hasActivity={!!lastSession || calConsumed > 0}
      />

      <NudgesSection />
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning.";
  if (h < 17) return "Good afternoon.";
  return "Good evening.";
}
