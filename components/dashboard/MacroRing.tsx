"use client";

const SIZE = 220;
const CX = SIZE / 2;
const CY = SIZE / 2;
const STROKE = 11;

// Three rings: outer → calories, middle → protein, inner → carbs
const RINGS = [
  { macro: "calories", color: "#007AFF", r: 103 },
  { macro: "protein",  color: "#34C759", r: 85  },
  { macro: "carbs",    color: "#FF9500", r: 67  },
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
  const carbsPct   = carbsG / Math.max(carbsTargetG, 1);
  const pcts = { calories: calPct, protein: proteinPct, carbs: carbsPct };

  const legend = [
    { label: "Cal",     color: "#007AFF", value: consumed,  total: target,        unit: ""  },
    { label: "Protein", color: "#34C759", value: proteinG,  total: proteinTargetG, unit: "g" },
    { label: "Carbs",   color: "#FF9500", value: carbsG,    total: carbsTargetG,   unit: "g" },
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
        <svg
          width={SIZE}
          height={SIZE}
          className="-rotate-90"
          role="img"
          aria-label={`${consumed} of ${target} calories consumed`}
        >
          {RINGS.map(({ macro, color, r }) => {
            const { circumference, dash } = arc(r, pcts[macro]);
            return (
              <g key={macro}>
                {/* Track */}
                <circle
                  cx={CX} cy={CY} r={r}
                  fill="none"
                  stroke="#e4e4e4"
                  strokeWidth={STROKE}
                />
                {/* Progress */}
                <circle
                  cx={CX} cy={CY} r={r}
                  fill="none"
                  stroke={color}
                  strokeWidth={STROKE}
                  strokeLinecap="round"
                  strokeDasharray={`${dash} ${circumference}`}
                  style={{ transition: "stroke-dasharray 0.6s cubic-bezier(0.4,0,0.2,1)" }}
                />
              </g>
            );
          })}
        </svg>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-display font-bold leading-none">{consumed}</p>
          <p className="text-label text-text-secondary mt-1">of {target} kcal</p>
        </div>
      </div>

      {/* Legend — inset stat chips */}
      <div className="grid grid-cols-3 mt-4 w-full" style={{ gap: 8 }}>
        {legend.map(({ label, color, value, total, unit }) => (
          <div
            key={label}
            className="flex flex-col items-center py-3 rounded-3xl"
            style={{
              background: "var(--neuo-bg)",
              boxShadow: "inset 4px 4px 8px var(--neuo-mid), inset -4px -4px 8px var(--neuo-light)",
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
