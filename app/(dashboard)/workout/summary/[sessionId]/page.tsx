import { auth } from "@/auth";
import { db } from "@/db";
import { workoutSessions, loggedSets, workoutPlans, exercises } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function SummaryPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const session = await auth();
  const userId = session!.user!.id!;
  const { sessionId } = await params;

  const [workoutSession] = await db
    .select()
    .from(workoutSessions)
    .where(eq(workoutSessions.id, sessionId))
    .limit(1);

  if (!workoutSession || workoutSession.userId !== userId) notFound();

  // Get plan name if available
  let planName: string | null = null;
  if (workoutSession.planId) {
    const [plan] = await db
      .select({ name: workoutPlans.name })
      .from(workoutPlans)
      .where(eq(workoutPlans.id, workoutSession.planId))
      .limit(1);
    planName = plan?.name ?? null;
  }

  // Get all logged sets with exercise names
  const sets = await db
    .select({
      id: loggedSets.id,
      exerciseId: loggedSets.exerciseId,
      setNumber: loggedSets.setNumber,
      reps: loggedSets.reps,
      weightKg: loggedSets.weightKg,
      rpe: loggedSets.rpe,
      exerciseName: exercises.name,
      muscleGroup: exercises.muscleGroup,
    })
    .from(loggedSets)
    .innerJoin(exercises, eq(loggedSets.exerciseId, exercises.id))
    .where(eq(loggedSets.sessionId, sessionId))
    .orderBy(asc(loggedSets.loggedAt));

  // Group sets by exercise
  const exerciseMap = new Map<
    string,
    { name: string; muscleGroup: string; sets: typeof sets }
  >();
  for (const s of sets) {
    if (!exerciseMap.has(s.exerciseId)) {
      exerciseMap.set(s.exerciseId, { name: s.exerciseName, muscleGroup: s.muscleGroup, sets: [] });
    }
    exerciseMap.get(s.exerciseId)!.sets.push(s);
  }

  // Stats
  const totalSets = sets.length;
  const totalVolume = sets.reduce((acc, s) => {
    if (s.weightKg && s.reps) return acc + s.weightKg * s.reps;
    return acc;
  }, 0);

  const startDate = new Date(workoutSession.startedAt);
  const dateStr = startDate.toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric",
  });

  const MUSCLE_LABELS: Record<string, string> = {
    chest: "Chest", back: "Back", shoulders: "Shoulders", biceps: "Biceps",
    triceps: "Triceps", forearms: "Forearms", core: "Core", glutes: "Glutes",
    quads: "Quads", hamstrings: "Hamstrings", calves: "Calves", full_body: "Full Body",
  };

  return (
    <div className="px-6 pt-12 pb-32 animate-fade-in">
      {/* Header */}
      <div className="mb-2">
        <p className="section-label mb-1">Workout Complete</p>
        <h1 className="text-title">{planName ?? "Session"}</h1>
        <p className="text-label text-text-secondary mt-1">{dateStr}</p>
      </div>

      {/* Stats row */}
      <div className="flex gap-3 my-6">
        {[
          { label: "Duration", value: workoutSession.durationMin ? `${workoutSession.durationMin} min` : "n/a" },
          { label: "Sets", value: String(totalSets) },
          { label: "Volume", value: totalVolume > 0 ? `${Math.round(totalVolume).toLocaleString()} kg` : "n/a" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="flex-1 neuo-card p-4 text-center"
            style={{ borderRadius: "1.5rem" }}
          >
            <p className="text-caption text-text-secondary mb-1">{stat.label}</p>
            <p className="text-heading font-bold" style={{ letterSpacing: "-0.02em" }}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Per-exercise breakdown */}
      {exerciseMap.size > 0 && (
        <div className="mb-8">
          <p className="section-label mb-4">Breakdown</p>
          <div className="space-y-3">
            {Array.from(exerciseMap.values()).map((ex) => (
              <div
                key={ex.name}
                className="neuo-card p-5"
                style={{ borderRadius: "1.75rem" }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-body font-semibold">{ex.name}</p>
                    <p className="text-caption text-text-secondary">{MUSCLE_LABELS[ex.muscleGroup]}</p>
                  </div>
                  <span
                    className="text-caption text-text-secondary px-2 py-1 rounded-xl"
                    style={{
                      backgroundColor: "var(--neuo-bg)",
                      boxShadow: "inset 2px 2px 4px var(--neuo-mid), inset -2px -2px 4px var(--neuo-light)",
                    }}
                  >
                    {ex.sets.length} sets
                  </span>
                </div>
                <div className="space-y-1">
                  {ex.sets.map((s) => (
                    <div key={s.id} className="flex items-center justify-between">
                      <span className="text-label text-text-secondary">Set {s.setNumber}</span>
                      <span className="text-label">
                        {s.reps ?? "?"} reps{s.weightKg ? ` × ${s.weightKg} kg` : ""}
                        {s.rpe ? ` · RPE ${s.rpe}` : ""}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Link href="/" className="btn-primary block text-center">
        Done
      </Link>
    </div>
  );
}
