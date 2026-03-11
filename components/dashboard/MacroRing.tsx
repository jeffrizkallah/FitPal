"use client";

const SIZE = 220;
const CX = SIZE / 2;
const CY = SIZE / 2;
const GROOVE = 12;         // Groove channel width (px)
const ARC_W  = GROOVE - 4; // Progress arc (8px) — sits inside the groove

// Three rings: outer → calories, middle → protein, inner → carbs
// Radii spaced so grooves have ~7px gaps between each other
const RINGS = [
  { macro: "calories", color: "#007AFF", r: 100 },
  { macro: "protein",  color: "#34C759", r: 81  },
  { macro: "carbs",    color: "#FF9500", r: 62  },
] as const;

function arc(r: number, pct: number) {
  const circumference = 2 * Math.PI * r;
  const dash = Math.min(pct, 1) * circumference;
  return { circumference, dash };
}

interface MacroRingProps {
  consumed: number;
  target: number;
  proteinG: number;
  proteinTargetG: number;
  carbsG: number;
  carbsTargetG: number;
}

export default function MacroRing({
  consumed,
  target,
  proteinG,
  proteinTargetG,
  carbsG,
  carbsTargetG,
}: MacroRingProps) {
  const calPct     = consumed / Math.max(target, 1);
  const proteinPct = proteinG / Math.max(proteinTargetG, 1);
  const carbsPct   = carbsG   / Math.max(carbsTargetG, 1);
  const pcts = { calories: calPct, protein: proteinPct, carbs: carbsPct };

  const legend = [
    { label: "Cal",     color: "#007AFF", value: consumed,  total: target,          unit: ""  },
    { label: "Protein", color: "#34C759", value: proteinG,  total: proteinTargetG,   unit: "g" },
    { label: "Carbs",   color: "#FF9500", value: carbsG,    total: carbsTargetG,     unit: "g" },
  ];

  return (
    <div
      className="flex flex-col items-center mb-8 rounded-4xl px-6 py-8 mx-auto"
      style={{
        backgroundColor: "var(--neuo-bg)",
        boxShadow: "8px 8px 16px var(--neuo-dark), -8px -8px 16px var(--neuo-light)",
        maxWidth: "300px",
        width: "100%",
      }}
    >
      <div className="relative" style={{ width: SIZE, height: SIZE }}>

        {/* ── Groove tracks (CSS divs) ───────────────────────────
            Each ring uses two nested divs:
            • Outer disk  → inset box-shadow carves the outer groove wall
            • Inner hole  → raised box-shadow casts shadow INTO the groove
                            from the inner wall, then covers the center
            The visible annular gap between them IS the groove.
        ─────────────────────────────────────────────────────── */}
        {RINGS.map(({ macro, r }) => {
          const outerD = (r + GROOVE / 2) * 2;
          const innerD = (r - GROOVE / 2) * 2;
          return (
            <div
              key={`track-${macro}`}
              style={{
                position: "absolute",
                width: outerD,
                height: outerD,
                borderRadius: "50%",
                background: "var(--neuo-bg)",
                boxShadow:
                  "inset 2px 2px 5px var(--neuo-dark), inset -2px -2px 5px var(--neuo-light)",
                top:  CY - outerD / 2,
                left: CX - outerD / 2,
              }}
            >
              {/* Inner hole — raised shadow bleeds outward into the groove */}
              <div
                style={{
                  position: "absolute",
                  width: innerD,
                  height: innerD,
                  borderRadius: "50%",
                  background: "var(--neuo-bg)",
                  boxShadow:
                    "2px 2px 5px var(--neuo-dark), -2px -2px 5px var(--neuo-light)",
                  // GROOVE offsets on each side to center the hole
                  top:  GROOVE,
                  left: GROOVE,
                }}
              />
            </div>
          );
        })}

        {/* ── Progress arcs (SVG, floats above CSS tracks) ─── */}
        <svg
          width={SIZE}
          height={SIZE}
          className="-rotate-90"
          style={{ position: "absolute", inset: 0, zIndex: 1 }}
          role="img"
          aria-label={`${consumed} of ${target} calories consumed`}
        >
          {RINGS.map(({ macro, color, r }) => {
            const { circumference, dash } = arc(r, pcts[macro]);
            return (
              <circle
                key={macro}
                cx={CX} cy={CY} r={r}
                fill="none"
                stroke={color}
                strokeWidth={ARC_W}
                strokeLinecap="round"
                strokeDasharray={`${dash} ${circumference}`}
                style={{
                  transition: "stroke-dasharray 0.6s cubic-bezier(0.4,0,0.2,1)",
                }}
              />
            );
          })}
        </svg>

        {/* ── Center text ───────────────────────────────────── */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center"
          style={{ zIndex: 2 }}
        >
          <div style={{ maxWidth: 96, textAlign: "center" }}>
            <p
              style={{
                fontSize: 30,
                fontWeight: 700,
                letterSpacing: "-0.02em",
                lineHeight: 1,
                color: "#2c2c2c",
              }}
            >
              {consumed}
            </p>
            <p
              style={{
                fontSize: 10,
                color: "rgba(44,44,44,0.55)",
                marginTop: 5,
                letterSpacing: "0.02em",
                lineHeight: 1.3,
              }}
            >
              / {target} kcal
            </p>
          </div>
        </div>
      </div>

      {/* ── Legend — inset stat chips ─────────────────────── */}
      <div className="grid grid-cols-3 mt-4 w-full" style={{ gap: 8 }}>
        {legend.map(({ label, color, value, total, unit }) => (
          <div
            key={label}
            className="flex flex-col items-center py-3 rounded-3xl"
            style={{
              background: "var(--neuo-bg)",
              boxShadow:
                "inset 4px 4px 8px var(--neuo-mid), inset -4px -4px 8px var(--neuo-light)",
              gap: 4,
            }}
          >
            <div className="flex items-center gap-1">
              <span
                style={{
                  display: "inline-block",
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  backgroundColor: color,
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 600,
                  color: "rgba(44,44,44,0.45)",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                }}
              >
                {label}
              </span>
            </div>
            <span
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "#2c2c2c",
                letterSpacing: "-0.01em",
                lineHeight: 1,
              }}
            >
              {value}{unit}
            </span>
            <span
              style={{
                fontSize: 10,
                color: "rgba(44,44,44,0.35)",
                letterSpacing: "0.005em",
                lineHeight: 1,
              }}
            >
              / {total}{unit}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
