"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Exercise = {
  id: string;
  name: string;
  muscleGroup: string;
  equipment: string | null;
};

type PlanExercise = {
  exerciseId: string;
  name: string;
  targetSets: number;
  targetReps: number | null;
  dayOfWeek: number | null; // 0=Mon…6=Sun
};

const MUSCLE_LABELS: Record<string, string> = {
  chest: "Chest",
  back: "Back",
  shoulders: "Shoulders",
  biceps: "Biceps",
  triceps: "Triceps",
  forearms: "Forearms",
  core: "Core",
  glutes: "Glutes",
  quads: "Quads",
  hamstrings: "Hamstrings",
  calves: "Calves",
  full_body: "Full Body",
};

const DAY_LETTERS = ["M", "T", "W", "T", "F", "S", "S"];
const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function NewPlanPage() {
  const router = useRouter();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [planName, setPlanName] = useState("");
  const [planExercises, setPlanExercises] = useState<PlanExercise[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>("all");
  const [saving, setSaving] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    fetch("/api/exercises")
      .then((r) => r.json())
      .then(setExercises);
  }, []);

  const groups = [
    "all",
    ...Array.from(new Set(exercises.map((e) => e.muscleGroup))).sort(),
  ];
  const filtered =
    selectedGroup === "all"
      ? exercises
      : exercises.filter((e) => e.muscleGroup === selectedGroup);

  function addExercise(ex: Exercise) {
    if (planExercises.some((p) => p.exerciseId === ex.id)) return;
    setPlanExercises((prev) => [
      ...prev,
      {
        exerciseId: ex.id,
        name: ex.name,
        targetSets: 3,
        targetReps: 10,
        dayOfWeek: null,
      },
    ]);
    setShowPicker(false);
  }

  function removeExercise(idx: number) {
    setPlanExercises((prev) => prev.filter((_, i) => i !== idx));
  }

  function setDay(idx: number, day: number | null) {
    setPlanExercises((prev) =>
      prev.map((ex, i) => (i === idx ? { ...ex, dayOfWeek: day } : ex))
    );
  }

  function updateSets(idx: number, value: number) {
    setPlanExercises((prev) =>
      prev.map((ex, i) => (i === idx ? { ...ex, targetSets: value } : ex))
    );
  }

  function updateReps(idx: number, value: number | null) {
    setPlanExercises((prev) =>
      prev.map((ex, i) => (i === idx ? { ...ex, targetReps: value } : ex))
    );
  }

  async function savePlan() {
    if (!planName.trim() || planExercises.length === 0) return;
    setSaving(true);
    try {
      const res = await fetch("/api/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: planName.trim(),
          exerciseList: planExercises.map((ex, i) => ({
            exerciseId: ex.exerciseId,
            orderIndex: i,
            targetSets: ex.targetSets,
            targetReps: ex.targetReps,
            dayOfWeek: ex.dayOfWeek,
          })),
        }),
      });
      if (res.ok) router.push("/workout");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="px-6 pt-12 pb-32 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/workout"
          className="w-10 h-10 rounded-2xl flex items-center justify-center"
          style={{
            backgroundColor: "var(--neuo-bg)",
            boxShadow:
              "4px 4px 10px var(--neuo-mid), -4px -4px 10px var(--neuo-light)",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d="M15 18L9 12L15 6"
              stroke="#2c2c2c"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
        <h1 className="text-title">New Plan</h1>
      </div>

      {/* Plan name */}
      <div className="mb-6">
        <p className="section-label mb-3">Plan Name</p>
        <input
          className="input-field"
          placeholder="e.g. Push / Pull / Legs"
          value={planName}
          onChange={(e) => setPlanName(e.target.value)}
        />
      </div>

      {/* Exercise list */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <p className="section-label">Exercises</p>
          <span className="text-caption text-text-secondary">
            {planExercises.length} added
          </span>
        </div>

        {planExercises.length === 0 ? (
          <div
            className="neuo-card p-6 text-center"
            style={{ borderRadius: "2rem" }}
          >
            <p className="text-body text-text-secondary">No exercises yet.</p>
            <p className="text-label text-text-secondary mt-1">
              Tap + to browse the library.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {planExercises.map((ex, idx) => (
              <div
                key={ex.exerciseId}
                className="neuo-card p-5"
                style={{ borderRadius: "1.5rem" }}
              >
                {/* Name + remove */}
                <div className="flex items-center justify-between mb-4">
                  <p className="text-body font-semibold">{ex.name}</p>
                  <button
                    onClick={() => removeExercise(idx)}
                    className="w-7 h-7 rounded-xl flex items-center justify-center text-caption text-text-secondary transition-all duration-200"
                    style={{
                      backgroundColor: "var(--neuo-bg)",
                      boxShadow:
                        "3px 3px 6px var(--neuo-mid), -3px -3px 6px var(--neuo-light)",
                    }}
                  >
                    ✕
                  </button>
                </div>

                {/* Sets + Reps */}
                <div className="flex gap-3 mb-4">
                  <div className="flex-1">
                    <p className="text-caption text-text-secondary mb-1.5">
                      Sets
                    </p>
                    <input
                      type="number"
                      className="input-field text-center"
                      style={{ paddingTop: "0.5rem", paddingBottom: "0.5rem" }}
                      value={ex.targetSets}
                      min={1}
                      max={10}
                      onChange={(e) =>
                        updateSets(idx, parseInt(e.target.value) || 1)
                      }
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-caption text-text-secondary mb-1.5">
                      Reps
                    </p>
                    <input
                      type="number"
                      className="input-field text-center"
                      style={{ paddingTop: "0.5rem", paddingBottom: "0.5rem" }}
                      placeholder="AMRAP"
                      value={ex.targetReps ?? ""}
                      min={1}
                      onChange={(e) =>
                        updateReps(
                          idx,
                          e.target.value ? parseInt(e.target.value) : null
                        )
                      }
                    />
                  </div>
                </div>

                {/* Day assignment */}
                <div>
                  <p className="text-caption text-text-secondary mb-2">Day</p>
                  <div className="flex gap-1.5">
                    {DAY_LETTERS.map((letter, dayIdx) => {
                      const isSelected = ex.dayOfWeek === dayIdx;
                      return (
                        <button
                          key={dayIdx}
                          onClick={() =>
                            setDay(idx, isSelected ? null : dayIdx)
                          }
                          className="flex-1 h-9 rounded-2xl text-caption font-semibold transition-all duration-200"
                          style={
                            isSelected
                              ? {
                                  backgroundColor: "#007AFF",
                                  color: "#fff",
                                  boxShadow:
                                    "inset 3px 3px 6px rgba(0,0,0,0.18), inset -1px -1px 4px rgba(255,255,255,0.1)",
                                }
                              : {
                                  backgroundColor: "var(--neuo-bg)",
                                  color: "rgba(44,44,44,0.55)",
                                  boxShadow:
                                    "3px 3px 6px var(--neuo-mid), -3px -3px 6px var(--neuo-light)",
                                }
                          }
                          title={DAY_NAMES[dayIdx]}
                        >
                          {letter}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add exercise button */}
        <button
          className="btn-ghost w-full mt-3 flex items-center justify-center gap-2"
          onClick={() => setShowPicker(true)}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 5V19M5 12H19"
              stroke="#007AFF"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          Add Exercise
        </button>
      </div>

      {/* Save */}
      <button
        className="btn-primary w-full"
        onClick={savePlan}
        disabled={!planName.trim() || planExercises.length === 0 || saving}
      >
        {saving ? "Saving..." : "Save Plan"}
      </button>

      {/* Exercise picker modal */}
      {showPicker && (
        <div
          className="fixed inset-0 z-50 flex flex-col"
          style={{ backgroundColor: "var(--neuo-bg)" }}
        >
          <div className="px-6 pt-12 pb-4 flex items-center gap-4">
            <button
              onClick={() => setShowPicker(false)}
              className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{
                backgroundColor: "var(--neuo-bg)",
                boxShadow:
                  "4px 4px 10px var(--neuo-mid), -4px -4px 10px var(--neuo-light)",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M15 18L9 12L15 6"
                  stroke="#2c2c2c"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <h2 className="text-heading font-bold">Exercise Library</h2>
          </div>

          {/* Muscle group filter */}
          <div className="px-6 overflow-x-auto no-scrollbar">
            <div className="flex gap-2 pb-4" style={{ width: "max-content" }}>
              {groups.map((g) => (
                <button
                  key={g}
                  onClick={() => setSelectedGroup(g)}
                  className="px-4 py-2 rounded-2xl text-label whitespace-nowrap transition-all duration-200"
                  style={
                    selectedGroup === g
                      ? {
                          backgroundColor: "#007AFF",
                          color: "#fff",
                          boxShadow: "inset 3px 3px 6px rgba(0,0,0,0.2)",
                        }
                      : {
                          backgroundColor: "var(--neuo-bg)",
                          color: "#2c2c2c",
                          boxShadow:
                            "4px 4px 10px var(--neuo-mid), -4px -4px 10px var(--neuo-light)",
                        }
                  }
                >
                  {g === "all" ? "All" : (MUSCLE_LABELS[g] ?? g)}
                </button>
              ))}
            </div>
          </div>

          {/* Exercise list */}
          <div className="flex-1 overflow-y-auto px-6 pb-8 space-y-2">
            {filtered.map((ex) => {
              const alreadyAdded = planExercises.some(
                (p) => p.exerciseId === ex.id
              );
              return (
                <button
                  key={ex.id}
                  onClick={() => !alreadyAdded && addExercise(ex)}
                  disabled={alreadyAdded}
                  className="neuo-card w-full text-left px-5 py-4 flex items-center justify-between transition-all duration-200 disabled:opacity-50"
                  style={{ borderRadius: "1.5rem" }}
                >
                  <div>
                    <p className="text-body font-medium">{ex.name}</p>
                    <p className="text-caption text-text-secondary">
                      {MUSCLE_LABELS[ex.muscleGroup]} ·{" "}
                      {ex.equipment ?? "bodyweight"}
                    </p>
                  </div>
                  {alreadyAdded ? (
                    <span className="text-label text-text-secondary">
                      Added
                    </span>
                  ) : (
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <path
                        d="M12 5V19M5 12H19"
                        stroke="#007AFF"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
