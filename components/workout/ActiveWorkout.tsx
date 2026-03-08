"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { haptic } from "@/lib/haptics";
import { useWorkoutSession } from "@/contexts/WorkoutSessionContext";

type PlanExercise = {
  id: string;
  exerciseId: string;
  orderIndex: number;
  targetSets: number;
  targetReps: number | null;
  targetWeightKg: number | null;
  restSeconds: number | null;
  notes: string | null;
  exerciseName: string;
  muscleGroup: string;
  equipment: string | null;
  instructions: string | null;
};

type LoggedSet = {
  id: string;
  exerciseId: string;
  setNumber: number;
  reps: number | null;
  weightKg: number | null;
  rpe: number | null;
};

type SessionData = {
  id: string;
  planId: string | null;
  startedAt: string;
  completedAt: string | null;
  planExercises: PlanExercise[];
  loggedSets: LoggedSet[];
};

const MUSCLE_LABELS: Record<string, string> = {
  chest: "Chest", back: "Back", shoulders: "Shoulders", biceps: "Biceps",
  triceps: "Triceps", forearms: "Forearms", core: "Core", glutes: "Glutes",
  quads: "Quads", hamstrings: "Hamstrings", calves: "Calves", full_body: "Full Body",
};

export default function ActiveWorkout({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const workoutCtx = useWorkoutSession();
  const [session, setSession] = useState<SessionData | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [reps, setReps] = useState("");
  const [weight, setWeight] = useState("");
  const [rpe, setRpe] = useState("");
  const [isLogging, setIsLogging] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [restTimeLeft, setRestTimeLeft] = useState<number>(-1);
  const [showInstructions, setShowInstructions] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch session on mount + register as active in context
  useEffect(() => {
    workoutCtx.startSession(sessionId);
    fetch(`/api/workouts/${sessionId}`)
      .then((r) => r.json())
      .then((data: SessionData) => {
        setSession(data);
        const ex = data.planExercises[0];
        if (ex?.targetWeightKg) setWeight(String(ex.targetWeightKg));
        if (ex?.targetReps) setReps(String(ex.targetReps));
        if (ex) workoutCtx.updateExercise(ex.exerciseName, 1, ex.targetSets);
      });
    return () => workoutCtx.endSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  // Rest timer countdown
  useEffect(() => {
    if (restTimeLeft <= 0) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (restTimeLeft === 0) {
        setRestTimeLeft(-1);
        workoutCtx.updateRestTimer(-1);
        haptic.alert();
      }
      return;
    }
    workoutCtx.updateRestTimer(restTimeLeft);
    intervalRef.current = setInterval(() => {
      setRestTimeLeft((t) => t - 1);
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restTimeLeft]);

  function startRestTimer(seconds: number) {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRestTimeLeft(seconds);
    haptic.success();
  }

  function skipRest() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRestTimeLeft(-1);
    workoutCtx.updateRestTimer(-1);
  }

  const currentExercise = session?.planExercises[currentIdx];

  const setsForCurrentExercise = session?.loggedSets.filter(
    (s) => s.exerciseId === currentExercise?.exerciseId
  ) ?? [];

  const targetSets = currentExercise?.targetSets ?? 3;
  const setsLogged = setsForCurrentExercise.length;
  const exerciseDone = setsLogged >= targetSets;

  async function logSet() {
    if (!currentExercise || isLogging) return;
    setIsLogging(true);

    const setNumber = setsLogged + 1;
    const res = await fetch(`/api/workouts/${sessionId}/log-set`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        exerciseId: currentExercise.exerciseId,
        setNumber,
        reps: reps ? parseInt(reps) : undefined,
        weightKg: weight ? parseFloat(weight) : undefined,
        rpe: rpe ? parseInt(rpe) : undefined,
      }),
    });

    if (res.ok) {
      const newSet = await res.json() as LoggedSet;
      setSession((prev) =>
        prev ? { ...prev, loggedSets: [...prev.loggedSets, newSet] } : prev
      );
      workoutCtx.updateExercise(currentExercise.exerciseName, setNumber + 1, currentExercise.targetSets);
      // Start rest timer
      const restSecs = currentExercise.restSeconds ?? 90;
      startRestTimer(restSecs);
    }

    setIsLogging(false);
  }

  function goToNext() {
    if (!session) return;
    const next = currentIdx + 1;
    if (next < session.planExercises.length) {
      setCurrentIdx(next);
      setRestTimeLeft(-1);
      const nextEx = session.planExercises[next];
      setReps(nextEx.targetReps ? String(nextEx.targetReps) : "");
      setWeight(nextEx.targetWeightKg ? String(nextEx.targetWeightKg) : "");
      setRpe("");
      setShowInstructions(false);
      workoutCtx.updateExercise(nextEx.exerciseName, 1, nextEx.targetSets);
    }
  }

  async function finishWorkout() {
    if (isFinishing) return;
    setIsFinishing(true);
    haptic.heavy();
    workoutCtx.endSession();
    await fetch(`/api/workouts/${sessionId}/complete`, { method: "POST" });
    router.push(`/workout/summary/${sessionId}`);
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div
          className="w-16 h-16 rounded-full"
          style={{
            backgroundColor: "var(--neuo-bg)",
            boxShadow: "inset 4px 4px 8px var(--neuo-mid), inset -4px -4px 8px var(--neuo-light)",
          }}
        />
      </div>
    );
  }

  if (!currentExercise || session.planExercises.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
        <h2 className="text-heading font-bold mb-4">No exercises in this session</h2>
        <button className="btn-ghost" onClick={finishWorkout}>
          End Session
        </button>
      </div>
    );
  }

  const totalExercises = session.planExercises.length;
  const progressPct = ((currentIdx + (exerciseDone ? 1 : setsLogged / targetSets)) / totalExercises) * 100;

  return (
    <div
      className="min-h-screen flex flex-col px-6 pt-12 pb-8"
      style={{ backgroundColor: "var(--neuo-bg)" }}
    >
      {/* Progress bar + header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <p className="section-label">
            Exercise {currentIdx + 1} of {totalExercises}
          </p>
          <button
            onClick={finishWorkout}
            disabled={isFinishing}
            aria-busy={isFinishing}
            className="text-label text-text-secondary px-3 py-1 rounded-2xl transition-all duration-200"
            style={{
              backgroundColor: "var(--neuo-bg)",
              boxShadow: "3px 3px 6px var(--neuo-mid), -3px -3px 6px var(--neuo-light)",
            }}
          >
            {isFinishing ? "Finishing..." : "Finish"}
          </button>
        </div>
        {/* Progress track */}
        <div
          className="h-1.5 rounded-full overflow-hidden"
          style={{
            backgroundColor: "var(--neuo-bg)",
            boxShadow: "inset 2px 2px 4px var(--neuo-dark), inset -2px -2px 4px var(--neuo-light)",
          }}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%`, backgroundColor: "#007AFF" }}
          />
        </div>
      </div>

      {/* Exercise card */}
      <div
        className="neuo-card p-6 mb-5"
        style={{ borderRadius: "2rem" }}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1
              className="text-title font-bold mb-1"
              style={{ letterSpacing: "-0.02em" }}
            >
              {currentExercise.exerciseName}
            </h1>
            <p className="text-label text-text-secondary">
              {MUSCLE_LABELS[currentExercise.muscleGroup]}
              {currentExercise.equipment ? ` · ${currentExercise.equipment}` : ""}
            </p>
          </div>
          {/* Target badge */}
          <div
            className="rounded-2xl px-3 py-2 text-right ml-3"
            style={{
              backgroundColor: "var(--neuo-bg)",
              boxShadow: "inset 3px 3px 6px var(--neuo-mid), inset -3px -3px 6px var(--neuo-light)",
            }}
          >
            <p className="text-caption text-text-secondary">Target</p>
            <p className="text-label font-semibold">
              {currentExercise.targetSets}×{currentExercise.targetReps ?? "AMRAP"}
            </p>
          </div>
        </div>

        {/* Instructions toggle */}
        {currentExercise.instructions && (
          <button
            onClick={() => setShowInstructions((v) => !v)}
            aria-expanded={showInstructions}
            className="mt-4 text-label text-action flex items-center gap-1"
          >
            {showInstructions ? "Hide" : "Show"} instructions
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path
                d={showInstructions ? "M18 15L12 9L6 15" : "M6 9L12 15L18 9"}
                stroke="#007AFF"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        )}
        {showInstructions && currentExercise.instructions && (
          <p className="text-body text-text-secondary mt-3 leading-relaxed">
            {currentExercise.instructions}
          </p>
        )}
      </div>

      {/* Set dots */}
      <div className="flex gap-2 justify-center mb-5">
        {Array.from({ length: targetSets }).map((_, i) => (
          <div
            key={i}
            className="w-3 h-3 rounded-full transition-all duration-300"
            style={
              i < setsLogged
                ? { backgroundColor: "#007AFF", boxShadow: "0 0 6px rgba(0,122,255,0.5)" }
                : {
                    backgroundColor: "var(--neuo-bg)",
                    boxShadow: "inset 2px 2px 4px var(--neuo-mid), inset -2px -2px 4px var(--neuo-light)",
                  }
            }
          />
        ))}
      </div>

      {/* Logged sets */}
      {setsForCurrentExercise.length > 0 && (
        <div className="mb-5">
          {setsForCurrentExercise.map((s) => (
            <div key={s.id} className="flex items-center gap-3 py-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M20 6L9 17L4 12" stroke="#007AFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-body text-text-secondary">
                Set {s.setNumber}: {s.reps ?? "?"} reps
                {s.weightKg ? ` × ${s.weightKg} kg` : ""}
                {s.rpe ? ` · RPE ${s.rpe}` : ""}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Rest timer */}
      {restTimeLeft > 0 && (
        <div
          className="neuo-card p-5 mb-5 text-center"
          style={{ borderRadius: "2rem" }}
        >
          <p className="section-label mb-2">Rest</p>
          <p
            className="font-bold mb-3"
            style={{
              fontSize: "3rem",
              letterSpacing: "-0.04em",
              color: restTimeLeft <= 10 ? "#FF3B30" : "#007AFF",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {formatTime(restTimeLeft)}
          </p>
          <button className="btn-ghost text-body py-2 px-6" onClick={skipRest}>
            Skip rest
          </button>
        </div>
      )}

      {/* Input + log (shown when not done with this exercise) */}
      {!exerciseDone && restTimeLeft <= 0 && (
        <div
          className="neuo-card p-5 mb-5"
          style={{ borderRadius: "2rem" }}
        >
          <p className="section-label mb-4">Set {setsLogged + 1}</p>
          <div className="flex gap-3 mb-4">
            <div className="flex-1">
              <label htmlFor="input-reps" className="text-caption text-text-secondary mb-2 block">Reps</label>
              <input
                id="input-reps"
                type="number"
                className="input-field text-center"
                style={{ paddingTop: "0.75rem", paddingBottom: "0.75rem" }}
                placeholder="—"
                value={reps}
                onChange={(e) => setReps(e.target.value)}
                min={1}
                inputMode="numeric"
              />
            </div>
            <div className="flex-1">
              <label htmlFor="input-weight" className="text-caption text-text-secondary mb-2 block">Weight (kg)</label>
              <input
                id="input-weight"
                type="number"
                className="input-field text-center"
                style={{ paddingTop: "0.75rem", paddingBottom: "0.75rem" }}
                placeholder="BW"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                min={0}
                step={0.5}
                inputMode="decimal"
              />
            </div>
            <div style={{ width: "64px" }}>
              <label htmlFor="input-rpe" className="text-caption text-text-secondary mb-2 block">RPE</label>
              <input
                id="input-rpe"
                type="number"
                className="input-field text-center"
                style={{ paddingTop: "0.75rem", paddingBottom: "0.75rem" }}
                placeholder="—"
                value={rpe}
                onChange={(e) => setRpe(e.target.value)}
                min={1}
                max={10}
                inputMode="numeric"
              />
            </div>
          </div>
          <button
            className="btn-primary w-full"
            onClick={logSet}
            disabled={isLogging}
          >
            {isLogging ? "Logging..." : `Log Set ${setsLogged + 1}`}
          </button>
        </div>
      )}

      {/* Next exercise / finish */}
      {exerciseDone && (
        <div className="mt-auto">
          {currentIdx < totalExercises - 1 ? (
            <div>
              <p className="text-body text-text-secondary text-center mb-2">
                Next: {session.planExercises[currentIdx + 1]?.exerciseName}
              </p>
              <button
                className="btn-primary w-full"
                onClick={goToNext}
              >
                Next Exercise
              </button>
            </div>
          ) : (
            <button
              className="btn-primary w-full"
              onClick={finishWorkout}
              disabled={isFinishing}
            >
              {isFinishing ? "Saving..." : "Finish Workout"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
