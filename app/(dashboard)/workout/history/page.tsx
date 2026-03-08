import { auth } from "@/auth";
import { db } from "@/db";
import { workoutSessions, workoutPlans, loggedSets } from "@/db/schema";
import { eq, desc, count } from "drizzle-orm";
import Link from "next/link";

export default async function HistoryPage() {
  const session = await auth();
  const userId = session!.user!.id!;

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
    .limit(50);

  // Set counts per session
  const setCounts = await Promise.all(
    sessions.map(async (s) => {
      const [result] = await db
        .select({ count: count() })
        .from(loggedSets)
        .where(eq(loggedSets.sessionId, s.id));
      return { sessionId: s.id, setCount: result?.count ?? 0 };
    })
  );

  const countMap = new Map(setCounts.map((s) => [s.sessionId, s.setCount]));

  return (
    <div className="px-6 pt-12 pb-32 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/workout"
          className="w-10 h-10 rounded-2xl flex items-center justify-center"
          style={{
            backgroundColor: "var(--neuo-bg)",
            boxShadow: "4px 4px 10px var(--neuo-mid), -4px -4px 10px var(--neuo-light)",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M15 18L9 12L15 6" stroke="#2c2c2c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
        <div>
          <p className="section-label">Train</p>
          <h1 className="text-title">History</h1>
        </div>
      </div>

      {sessions.length === 0 ? (
        <div
          className="neuo-card p-8 text-center"
          style={{ borderRadius: "2rem" }}
        >
          <p className="text-body text-text-secondary">No sessions yet.</p>
          <p className="text-label text-text-secondary mt-1">
            Complete a workout to see it here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((s) => {
            const date = new Date(s.startedAt);
            const dateStr = date.toLocaleDateString("en-US", {
              weekday: "short", month: "short", day: "numeric",
            });
            const isComplete = !!s.completedAt;
            const setCount = countMap.get(s.id) ?? 0;

            return (
              <Link
                key={s.id}
                href={
                  isComplete
                    ? `/workout/summary/${s.id}`
                    : `/workout/active?sessionId=${s.id}`
                }
                className="neuo-card flex items-center justify-between px-5 py-4 active:shadow-[inset_6px_6px_12px_#d0d0d0,inset_-6px_-6px_12px_#ffffff] transition-all duration-200"
                style={{ borderRadius: "1.75rem" }}
              >
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-body font-medium">{dateStr}</p>
                    {!isComplete && (
                      <span
                        className="text-caption px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: "rgba(0,122,255,0.12)", color: "#007AFF" }}
                      >
                        In progress
                      </span>
                    )}
                  </div>
                  <p className="text-label text-text-secondary">
                    {s.planName ?? "Freeform"}
                    {isComplete && s.durationMin ? ` · ${s.durationMin} min` : ""}
                    {setCount > 0 ? ` · ${setCount} sets` : ""}
                  </p>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M9 18L15 12L9 6"
                    stroke="rgba(44,44,44,0.35)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
