"use client";

import { useState, useEffect } from "react";
import ExerciseLottie from "@/components/workout/ExerciseLottie";

export type DayExercise = {
  planExId: string;
  exerciseId: string;
  name: string;
  muscleGroup: string;
  instructions: string | null;
  targetSets: number;
  targetReps: number | null;
  dayOfWeek: number | null; // 0=Mon…6=Sun
};

type Props = {
  exercises: DayExercise[];
  planName: string;
};

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const DAY_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

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

const DEFAULT_INSTRUCTIONS: Record<string, string> = {
  chest:
    "Keep your back flat and core tight. Lower slowly, then press through your chest to return. Keep shoulder blades retracted.",
  back:
    "Pull with your elbows, not your hands. Retract shoulder blades at the top. Keep your spine neutral throughout.",
  shoulders:
    "Maintain an upright posture. Avoid shrugging. Control the weight through the full range of motion.",
  biceps:
    "Pin your elbows at your sides. Curl through the full range. Squeeze hard at the top and lower slowly.",
  triceps:
    "Keep elbows close to your body. Extend fully at the bottom. Control the return. Don't drop the weight.",
  forearms:
    "Perform controlled wrist curls or extensions. Avoid momentum. Keep wrists neutral when gripping.",
  core:
    "Brace your abs before moving. Exhale on the exertion phase. Never hold your breath or pull your neck.",
  glutes:
    "Drive through your heels. Squeeze your glutes at the top of every rep. Keep your spine neutral.",
  quads:
    "Track your knees over your toes. Control the descent. Drive through your whole foot to stand.",
  hamstrings:
    "Hinge at the hips with a neutral spine. Feel the stretch before driving your hips forward to return.",
  calves:
    "Use the full range. Pause at the bottom for a stretch. Drive up through the ball of your foot.",
  full_body:
    "Maintain proper form throughout every component. Rest as needed between movements.",
};

// ─── Muscle SVG ───────────────────────────────────────────────────────────────
// ─── Helpers ──────────────────────────────────────────────────────────────────
function getTodayIndex() {
  const js = new Date().getDay();
  return js === 0 ? 6 : js - 1;
}

function todayStorageKey() {
  const d = new Date();
  return `forma-done-${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function setsStorageKey() {
  const d = new Date();
  return `forma-sets-${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function lastWeightKey(exerciseId: string) {
  return `forma-last-weight-${exerciseId}`;
}

function todayWeightKey(exerciseId: string) {
  const d = new Date();
  return `forma-weight-${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}-${exerciseId}`;
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function WeeklyPlanView({ exercises }: Props) {
  const todayIdx = getTodayIndex();
  const [activeDay, setActiveDay] = useState(todayIdx);
  const [expandedEx, setExpandedEx] = useState<string | null>(null);
  const [done, setDone] = useState<Set<string>>(new Set());
  const [completedSets, setCompletedSets] = useState<Record<string, boolean[]>>({});
  const [weights, setWeights] = useState<Record<string, string>>({});
  const [lastWeights, setLastWeights] = useState<Record<string, string>>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(todayStorageKey());
      if (raw) setDone(new Set(JSON.parse(raw) as string[]));

      const setsRaw = localStorage.getItem(setsStorageKey());
      if (setsRaw) setCompletedSets(JSON.parse(setsRaw) as Record<string, boolean[]>);

      const weightsObj: Record<string, string> = {};
      const lastWeightsObj: Record<string, string> = {};
      exercises.forEach((ex) => {
        const todayW = localStorage.getItem(todayWeightKey(ex.exerciseId));
        if (todayW) weightsObj[ex.exerciseId] = todayW;
        const lastW = localStorage.getItem(lastWeightKey(ex.exerciseId));
        if (lastW) lastWeightsObj[ex.exerciseId] = lastW;
      });
      setWeights(weightsObj);
      setLastWeights(lastWeightsObj);
    } catch {}
  }, [exercises]);

  function toggleDone(planExId: string) {
    setDone((prev) => {
      const next = new Set(prev);
      if (next.has(planExId)) next.delete(planExId);
      else next.add(planExId);
      try { localStorage.setItem(todayStorageKey(), JSON.stringify([...next])); } catch {}
      return next;
    });
  }

  function toggleSet(planExId: string, setIdx: number, totalSets: number) {
    setCompletedSets((prev) => {
      const prevArr = prev[planExId] ?? Array(totalSets).fill(false);
      const newArr = [...prevArr];
      while (newArr.length < totalSets) newArr.push(false);
      newArr[setIdx] = !newArr[setIdx];
      const next = { ...prev, [planExId]: newArr };
      try { localStorage.setItem(setsStorageKey(), JSON.stringify(next)); } catch {}

      const allDone = newArr.slice(0, totalSets).every(Boolean);
      setDone((prevDone) => {
        const newDone = new Set(prevDone);
        if (allDone) newDone.add(planExId);
        else newDone.delete(planExId);
        try { localStorage.setItem(todayStorageKey(), JSON.stringify([...newDone])); } catch {}
        return newDone;
      });

      return next;
    });
  }

  function updateWeight(exerciseId: string, value: string) {
    setWeights((prev) => ({ ...prev, [exerciseId]: value }));
  }

  function saveWeight(exerciseId: string, value: string) {
    if (value.trim()) {
      try {
        localStorage.setItem(todayWeightKey(exerciseId), value);
        localStorage.setItem(lastWeightKey(exerciseId), value);
      } catch {}
      setLastWeights((prev) => ({ ...prev, [exerciseId]: value }));
    }
  }

  const dayExercises = (dayIdx: number) =>
    exercises.filter((e) => e.dayOfWeek === dayIdx);

  const isDayComplete = (dayIdx: number) => {
    const exs = dayExercises(dayIdx);
    return exs.length > 0 && exs.every((e) => done.has(e.planExId));
  };

  const activeDayExs = dayExercises(activeDay);
  const dayMuscles = [
    ...new Set(activeDayExs.map((e) => MUSCLE_LABELS[e.muscleGroup])),
  ].join(" · ");

  return (
    <div>
      {/* Day pills */}
      <div className="mb-6">
        <div className="flex gap-2 pb-2 pt-1">
          {DAYS.map((day, i) => {
            const count = dayExercises(i).length;
            const isToday = i === todayIdx;
            const isActive = i === activeDay;
            const isComplete = isDayComplete(i);
            return (
              <button
                key={day}
                onClick={() => {
                  setActiveDay(i);
                  setExpandedEx(null);
                }}
                className={`flex-1 min-w-0 flex flex-col items-center gap-1 px-1 py-3 rounded-3xl transition-all duration-200 appearance-none ${
                  isActive
                    ? "bg-action text-white"
                    : "bg-neuo-bg text-text-primary shadow-neuo-sm"
                }`}
                style={
                  isActive
                    ? { boxShadow: "inset 4px 4px 8px rgba(0,0,0,0.18), inset -2px -2px 6px rgba(255,255,255,0.2)" }
                    : undefined
                }
              >
                <span className="text-label font-semibold">{DAY_SHORT[i]}</span>
                {isComplete ? (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M5 12L10 17L19 8"
                      stroke={isActive ? "rgba(255,255,255,0.9)" : "#007AFF"}
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  <>
                    {isToday && (
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{
                          backgroundColor: isActive ? "rgba(255,255,255,0.8)" : "#007AFF",
                        }}
                      />
                    )}
                    {count > 0 && (
                      <span
                        className="text-caption"
                        style={{
                          color: isActive
                            ? "rgba(255,255,255,0.65)"
                            : "rgba(44,44,44,0.38)",
                        }}
                      >
                        {count}
                      </span>
                    )}
                  </>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content area */}
      {activeDayExs.length === 0 ? (
        <div
          className="neuo-card p-8 text-center"
          style={{ borderRadius: "2rem" }}
        >
          <p className="text-body font-medium mb-1" style={{ color: "#2c2c2c" }}>
            Rest Day
          </p>
          <p className="text-label text-text-secondary">
            No exercises scheduled for {DAYS[activeDay]}.
          </p>
        </div>
      ) : (
        <div>
          {/* Day header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3
                className="text-heading font-bold"
                style={{ letterSpacing: "-0.02em" }}
              >
                {DAYS[activeDay]}
              </h3>
              {dayMuscles && (
                <p className="text-label text-text-secondary">{dayMuscles}</p>
              )}
            </div>
            <div className="px-4 py-2 rounded-2xl bg-neuo-bg shadow-neuo-sm">
              <span
                className="text-label font-semibold"
                style={{ color: "#007AFF" }}
              >
                {activeDayExs.filter((e) => done.has(e.planExId)).length}
              </span>
              <span className="text-label text-text-secondary">
                /{activeDayExs.length}
              </span>
            </div>
          </div>

          {/* Exercise cards */}
          <div className="space-y-3">
            {activeDayExs.map((ex) => {
              const isDone = done.has(ex.planExId);
              const isExpanded = expandedEx === ex.planExId;
              const exSets = completedSets[ex.planExId] ?? [];
              const exWeight = weights[ex.exerciseId] ?? "";
              const exLastWeight = lastWeights[ex.exerciseId];

              return (
                <div
                  key={ex.planExId}
                  className="neuo-card overflow-hidden"
                  style={{ borderRadius: "1.5rem" }}
                >
                  {/* Main row */}
                  <div className="flex items-center gap-4 px-5 py-4">
                    {/* Completion circle */}
                    <button
                      onClick={() => toggleDone(ex.planExId)}
                      className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 appearance-none ${
                        isDone ? "bg-action" : "bg-neuo-bg shadow-neuo-sm"
                      }`}
                      style={
                        isDone
                          ? { boxShadow: "inset 3px 3px 6px rgba(0,0,0,0.2), inset -1px -1px 4px rgba(255,255,255,0.1)" }
                          : undefined
                      }
                    >
                      {isDone && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                          <path
                            d="M5 12L10 17L19 8"
                            stroke="#fff"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </button>

                    {/* Exercise name + muscle */}
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-body font-medium transition-all duration-200"
                        style={{
                          color: isDone ? "rgba(44,44,44,0.38)" : "#2c2c2c",
                          textDecoration: isDone ? "line-through" : "none",
                          letterSpacing: "0.005em",
                        }}
                      >
                        {ex.name}
                      </p>
                      <p className="text-caption text-text-secondary">
                        {MUSCLE_LABELS[ex.muscleGroup]} · {ex.targetSets}×
                        {ex.targetReps ?? "AMRAP"}
                      </p>
                    </div>

                    {/* Expand chevron */}
                    <button
                      onClick={() =>
                        setExpandedEx(isExpanded ? null : ex.planExId)
                      }
                      className={`flex-shrink-0 w-8 h-8 rounded-2xl flex items-center justify-center transition-all duration-200 appearance-none bg-neuo-bg ${
                        isExpanded ? "" : "shadow-neuo-sm"
                      }`}
                      style={
                        isExpanded
                          ? { boxShadow: "inset 3px 3px 6px #d8d8d8, inset -3px -3px 6px #ffffff" }
                          : undefined
                      }
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        style={{
                          transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                          transition: "transform 0.2s",
                        }}
                      >
                        <path
                          d="M6 9L12 15L18 9"
                          stroke="rgba(44,44,44,0.6)"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </div>

                  {/* Expanded detail panel */}
                  {isExpanded && (
                    <div
                      className="mx-3 mb-3 rounded-2xl overflow-hidden"
                      style={{
                        backgroundColor: "var(--neuo-bg)",
                        boxShadow: "inset 4px 4px 8px var(--neuo-mid), inset -4px -4px 8px var(--neuo-light)",
                      }}
                    >
                      {/* Instructions */}
                      <div className="flex gap-4 p-4">
                        <ExerciseLottie
                          muscleGroup={ex.muscleGroup}
                          className="flex-shrink-0 w-16 h-24"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="section-label mb-2">How to</p>
                          <p
                            className="text-body text-text-secondary"
                            style={{ lineHeight: "1.65", letterSpacing: "0.005em" }}
                          >
                            {ex.instructions ??
                              DEFAULT_INSTRUCTIONS[ex.muscleGroup] ??
                              "Focus on controlled movement and proper form throughout each rep."}
                          </p>
                        </div>
                      </div>

                      {/* Divider */}
                      <div
                        style={{
                          height: "1px",
                          backgroundColor: "var(--neuo-mid)",
                          margin: "0 16px",
                          opacity: 0.6,
                        }}
                      />

                      {/* Sets + weight — Option B: chips row + shared weight */}
                      <div className="p-4 flex flex-col gap-5">
                        {/* Set chips */}
                        <div>
                          <p className="section-label mb-3">Sets</p>
                          <div className="flex gap-3 flex-wrap">
                            {Array.from({ length: ex.targetSets }).map((_, i) => {
                              const setDone = exSets[i] ?? false;
                              return (
                                <button
                                  key={i}
                                  onClick={() => toggleSet(ex.planExId, i, ex.targetSets)}
                                  className="flex flex-col items-center gap-1.5 appearance-none"
                                >
                                  <div
                                    className="w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-200"
                                    style={
                                      setDone
                                        ? {
                                            backgroundColor: "#007AFF",
                                            boxShadow: "inset 3px 3px 7px rgba(0,0,0,0.18), inset -2px -2px 5px rgba(255,255,255,0.12)",
                                          }
                                        : {
                                            backgroundColor: "var(--neuo-bg)",
                                            boxShadow: "4px 4px 10px var(--neuo-mid), -4px -4px 10px var(--neuo-light)",
                                          }
                                    }
                                  >
                                    {setDone ? (
                                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                        <path
                                          d="M5 12L10 17L19 8"
                                          stroke="#fff"
                                          strokeWidth="2.5"
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                        />
                                      </svg>
                                    ) : (
                                      <span
                                        style={{
                                          fontSize: 15,
                                          fontWeight: 500,
                                          color: "rgba(44,44,44,0.45)",
                                          letterSpacing: "-0.01em",
                                        }}
                                      >
                                        {i + 1}
                                      </span>
                                    )}
                                  </div>
                                  {ex.targetReps && (
                                    <span
                                      className="text-caption"
                                      style={{ color: "rgba(44,44,44,0.38)" }}
                                    >
                                      ×{ex.targetReps}
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Shared weight input */}
                        <div>
                          <div className="flex items-center justify-between mb-2.5">
                            <p className="section-label">Weight</p>
                            {exLastWeight && (
                              <p className="text-caption text-text-secondary">
                                Last: {exLastWeight} kg
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            <input
                              type="number"
                              className="input-field text-center"
                              style={{
                                paddingTop: "0.6rem",
                                paddingBottom: "0.6rem",
                                maxWidth: "120px",
                              }}
                              placeholder={exLastWeight ?? "—"}
                              value={exWeight}
                              onChange={(e) => updateWeight(ex.exerciseId, e.target.value)}
                              onBlur={(e) => saveWeight(ex.exerciseId, e.target.value)}
                              min={0}
                              step={0.5}
                              inputMode="decimal"
                            />
                            <span className="text-label text-text-secondary">kg</span>
                            {exLastWeight && exWeight && exWeight !== exLastWeight && (
                              <span
                                className="text-caption"
                                style={{
                                  color:
                                    parseFloat(exWeight) > parseFloat(exLastWeight)
                                      ? "#34C759"
                                      : "rgba(44,44,44,0.45)",
                                }}
                              >
                                {parseFloat(exWeight) > parseFloat(exLastWeight) ? "+" : ""}
                                {(parseFloat(exWeight) - parseFloat(exLastWeight)).toFixed(1)} from last
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Unscheduled exercises note */}
      {exercises.some((e) => e.dayOfWeek === null) && (
        <p
          className="text-label text-text-secondary text-center mt-6"
          style={{ letterSpacing: "0.005em" }}
        >
          {exercises.filter((e) => e.dayOfWeek === null).length} exercise
          {exercises.filter((e) => e.dayOfWeek === null).length !== 1 ? "s" : ""}{" "}
          not assigned to a day
        </p>
      )}
    </div>
  );
}
