"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useWorkoutSession } from "@/contexts/WorkoutSessionContext";

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function WorkoutIsland() {
  const { isActive, sessionId, exerciseName, setNumber, targetSets, restTimeLeft } =
    useWorkoutSession();
  const [expanded, setExpanded] = useState(false);

  return (
    <AnimatePresence>
      {isActive && sessionId && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -16, scale: 0.92 }}
          transition={{ type: "spring", stiffness: 400, damping: 32 }}
          style={{
            position: "fixed",
            top: "calc(env(safe-area-inset-top) + 10px)",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 200,
            transformOrigin: "top center",
          }}
        >
          <motion.button
            layout
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            aria-label={`Active workout: ${exerciseName ?? "Loading"}, set ${setNumber} of ${targetSets}. Tap to ${expanded ? "collapse" : "expand"}.`}
            style={{
              backgroundColor: "var(--neuo-bg)",
              boxShadow:
                "6px 6px 18px var(--neuo-dark), -6px -6px 18px var(--neuo-light), 0 4px 12px rgba(0,0,0,0.08)",
              borderRadius: 9999,
              padding: expanded ? "14px 20px" : "10px 18px",
              display: "flex",
              flexDirection: expanded ? "column" : "row",
              alignItems: "center",
              gap: expanded ? 12 : 10,
              cursor: "pointer",
              border: "none",
              minWidth: expanded ? 240 : "auto",
              transition: "padding 0.2s ease",
            }}
          >
            {/* Active indicator dot */}
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [1, 0.6, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: "#007AFF",
                flexShrink: 0,
              }}
            />

            {/* Collapsed: exercise name + set dots */}
            {!expanded && (
              <>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#2c2c2c",
                    letterSpacing: "-0.01em",
                    maxWidth: 120,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {exerciseName ?? "Workout"}
                </span>

                {/* Set progress dots */}
                <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                  {Array.from({ length: targetSets }).map((_, i) => (
                    <div
                      key={i}
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        backgroundColor: i < setNumber - 1 ? "#007AFF" : "var(--neuo-mid)",
                        boxShadow:
                          i < setNumber - 1
                            ? "0 0 4px rgba(0,122,255,0.5)"
                            : "inset 1px 1px 2px var(--neuo-dark), inset -1px -1px 2px var(--neuo-light)",
                      }}
                    />
                  ))}
                </div>

                {/* Rest timer badge if active */}
                {restTimeLeft > 0 && (
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: restTimeLeft <= 10 ? "#FF3B30" : "#007AFF",
                      fontVariantNumeric: "tabular-nums",
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {formatTime(restTimeLeft)}
                  </span>
                )}
              </>
            )}

            {/* Expanded: full rest timer + link */}
            {expanded && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                style={{ textAlign: "center", width: "100%" }}
              >
                <p
                  style={{
                    fontSize: 12,
                    color: "rgba(44,44,44,0.55)",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    marginBottom: 4,
                  }}
                >
                  {exerciseName}
                </p>

                {restTimeLeft > 0 ? (
                  <>
                    <p
                      style={{
                        fontSize: "2.25rem",
                        fontWeight: 700,
                        letterSpacing: "-0.04em",
                        color: restTimeLeft <= 10 ? "#FF3B30" : "#007AFF",
                        fontVariantNumeric: "tabular-nums",
                        marginBottom: 4,
                      }}
                    >
                      {formatTime(restTimeLeft)}
                    </p>
                    <p style={{ fontSize: 12, color: "rgba(44,44,44,0.45)" }}>Rest</p>
                  </>
                ) : (
                  <p
                    style={{
                      fontSize: 15,
                      fontWeight: 600,
                      color: "#2c2c2c",
                      marginBottom: 4,
                    }}
                  >
                    Set {setNumber} of {targetSets}
                  </p>
                )}

                <Link
                  href={`/workout/active?sessionId=${sessionId}`}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    display: "inline-block",
                    marginTop: 8,
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#007AFF",
                    textDecoration: "none",
                    letterSpacing: "0.01em",
                  }}
                >
                  Open workout →
                </Link>
              </motion.div>
            )}
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
