"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Nudge = {
  type: "protein" | "calories" | "workout" | "streak";
  message: string;
  severity: "info" | "warning";
};

const NUDGE_ICONS: Record<string, string> = {
  protein: "🥩",
  calories: "🔥",
  workout: "🏋️",
  streak: "📈",
};

export default function NudgesSection() {
  const [nudges, setNudges] = useState<Nudge[]>([]);

  useEffect(() => {
    fetch("/api/advisor/nudges")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setNudges(data);
      })
      .catch(() => {});
  }, []);

  if (nudges.length === 0) return null;

  return (
    <div style={{ marginTop: 32, marginBottom: 24 }} aria-live="polite">
      <p className="section-label" style={{ marginBottom: 12, paddingLeft: 2 }}>
        Advisor
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {nudges.map((nudge, i) => (
          <Link
            key={i}
            href="/advisor"
            aria-label={`${nudge.type} nudge: ${nudge.message}`}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 14,
              padding: "14px 16px",
              borderRadius: 24,
              boxShadow:
                nudge.severity === "warning"
                  ? "6px 6px 14px var(--neuo-dark), -6px -6px 14px var(--neuo-light)"
                  : "6px 6px 12px var(--neuo-dark), -6px -6px 12px var(--neuo-light)",
              background: "var(--neuo-bg)",
              textDecoration: "none",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {nudge.severity === "warning" && (
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: 3,
                  background: "#FF9500",
                  borderRadius: "24px 0 0 24px",
                }}
              />
            )}

            <div
              aria-hidden="true"
              style={{
                width: 36,
                height: 36,
                borderRadius: 14,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "4px 4px 8px var(--neuo-mid), -4px -4px 8px var(--neuo-light)",
                flexShrink: 0,
                fontSize: 16,
              }}
            >
              {NUDGE_ICONS[nudge.type] ?? "💡"}
            </div>

            <p
              style={{
                margin: 0,
                fontSize: 14,
                color: "#2c2c2c",
                lineHeight: 1.55,
                letterSpacing: "0.005em",
                paddingTop: 2,
              }}
            >
              {nudge.message}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
