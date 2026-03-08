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

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY_LETTERS = ["M", "T", "W", "T", "F", "S", "S"];

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
// Highlight shapes wrapped in <g className="muscle-highlight"> for CSS pulse animation
function MuscleSVG({ group }: { group: string }) {
  const highlightShapes: Record<string, React.ReactNode> = {
    chest: <ellipse cx="40" cy="50" rx="13" ry="9" fill="#007AFF" />,
    back: <rect x="27" y="41" width="26" height="22" rx="5" fill="#007AFF" />,
    shoulders: (
      <>
        <ellipse cx="20" cy="40" rx="7" ry="7" fill="#007AFF" />
        <ellipse cx="60" cy="40" rx="7" ry="7" fill="#007AFF" />
      </>
    ),
    biceps: (
      <>
        <rect x="8"  y="42" width="14" height="15" rx="6" fill="#007AFF" />
        <rect x="58" y="42" width="14" height="15" rx="6" fill="#007AFF" />
      </>
    ),
    triceps: (
      <>
        <rect x="8"  y="47" width="14" height="15" rx="6" fill="#007AFF" />
        <rect x="58" y="47" width="14" height="15" rx="6" fill="#007AFF" />
      </>
    ),
    forearms: (
      <>
        <rect x="8"  y="58" width="14" height="13" rx="6" fill="#007AFF" />
        <rect x="58" y="58" width="14" height="13" rx="6" fill="#007AFF" />
      </>
    ),
    core:       <ellipse cx="40" cy="63" rx="11" ry="11" fill="#007AFF" />,
    glutes:     <ellipse cx="40" cy="83" rx="13" ry="9"  fill="#007AFF" />,
    quads: (
      <>
        <rect x="25" y="78" width="12" height="22" rx="6" fill="#007AFF" />
        <rect x="43" y="78" width="12" height="22" rx="6" fill="#007AFF" />
      </>
    ),
    hamstrings: (
      <>
        <rect x="25" y="80" width="12" height="20" rx="6" fill="#007AFF" />
        <rect x="43" y="80" width="12" height="20" rx="6" fill="#007AFF" />
      </>
    ),
    calves: (
      <>
        <rect x="25" y="104" width="12" height="16" rx="6" fill="#007AFF" />
        <rect x="43" y="104" width="12" height="16" rx="6" fill="#007AFF" />
      </>
    ),
    full_body: <rect x="8" y="28" width="64" height="96" rx="10" fill="#007AFF" opacity="0.3" />,
  };

  // Build highlights map with animated wrapper applied uniformly
  const highlights: Record<string, React.ReactNode> = Object.fromEntries(
    Object.entries(highlightShapes).map(([k, v]) => [
      k,
      <g key={k} className="muscle-highlight">{v}</g>,
    ])
  );

  return (
    <svg viewBox="0 0 80 132" fill="none" className="w-full h-full">
      {/* Head */}
      <circle cx="40" cy="15" r="11" fill="var(--neuo-mid)" />
      {/* Neck */}
      <rect x="35" y="24" width="10" height="7" rx="3" fill="var(--neuo-mid)" />
      {/* Torso */}
      <rect
        x="24"
        y="31"
        width="32"
        height="40"
        rx="7"
        fill="var(--neuo-mid)"
      />
      {/* Left arm */}
      <rect
        x="7"
        y="31"
        width="15"
        height="40"
        rx="7"
        fill="var(--neuo-mid)"
      />
      {/* Right arm */}
      <rect
        x="58"
        y="31"
        width="15"
        height="40"
        rx="7"
        fill="var(--neuo-mid)"
      />
      {/* Left leg */}
      <rect
        x="25"
        y="73"
        width="12"
        height="52"
        rx="6"
        fill="var(--neuo-mid)"
      />
      {/* Right leg */}
      <rect
        x="43"
        y="73"
        width="12"
        height="52"
        rx="6"
        fill="var(--neuo-mid)"
      />
      {/* Muscle highlight */}
      {highlights[group] ?? null}
    </svg>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getTodayIndex() {
  const js = new Date().getDay(); // 0=Sun
  return js === 0 ? 6 : js - 1; // → 0=Mon…6=Sun
}

function todayStorageKey() {
  const d = new Date();
  return `forma-done-${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function WeeklyPlanView({ exercises, planName }: Props) {
  const todayIdx = getTodayIndex();
  const [activeDay, setActiveDay] = useState(todayIdx);
  const [expandedEx, setExpandedEx] = useState<string | null>(null);
  const [done, setDone] = useState<Set<string>>(new Set());

  // Load completion state from localStorage (today only)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(todayStorageKey());
      if (raw) setDone(new Set(JSON.parse(raw) as string[]));
    } catch {}
  }, []);

  function toggleDone(planExId: string) {
    setDone((prev) => {
      const next = new Set(prev);
      if (next.has(planExId)) {
        next.delete(planExId);
      } else {
        next.add(planExId);
      }
      try {
        localStorage.setItem(todayStorageKey(), JSON.stringify([...next]));
      } catch {}
      return next;
    });
  }

  const dayExercises = (dayIdx: number) =>
    exercises.filter((e) => e.dayOfWeek === dayIdx);

  const activeDayExs = dayExercises(activeDay);
  const dayMuscles = [
    ...new Set(activeDayExs.map((e) => MUSCLE_LABELS[e.muscleGroup])),
  ].join(" · ");

  return (
    <div>
      {/* Plan name */}
      <div className="mb-6">
        <p className="section-label mb-1">Active Plan</p>
        <h2
          className="text-heading font-bold"
          style={{ letterSpacing: "-0.02em" }}
        >
          {planName}
        </h2>
      </div>

      {/* Day pills — equal-width, fills container to align with cards below */}
      <div className="mb-6">
        <div className="flex gap-2 pb-2 pt-1">
        {DAYS.map((day, i) => {
          const count = dayExercises(i).length;
          const isToday = i === todayIdx;
          const isActive = i === activeDay;
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
              <span className="text-label font-semibold">{day}</span>
              {/* Today dot */}
              {isToday && (
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    backgroundColor: isActive
                      ? "rgba(255,255,255,0.8)"
                      : "#007AFF",
                  }}
                />
              )}
              {/* Exercise count badge (non-today days) */}
              {!isToday && count > 0 && (
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
              {/* Today's count */}
              {isToday && count > 0 && (
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
            {/* Progress count */}
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
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
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
                          transform: isExpanded
                            ? "rotate(180deg)"
                            : "rotate(0deg)",
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
                      className="mx-3 mb-3 p-4 rounded-2xl flex gap-4 bg-neuo-bg shadow-neuo-inset-sm"
                    >
                      {/* Muscle diagram SVG */}
                      <ExerciseLottie
                        muscleGroup={ex.muscleGroup}
                        className="flex-shrink-0 w-16 h-24"
                      />

                      {/* Instructions */}
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
          {exercises.filter((e) => e.dayOfWeek === null).length !== 1
            ? "s"
            : ""}{" "}
          not assigned to a day
        </p>
      )}
    </div>
  );
}
