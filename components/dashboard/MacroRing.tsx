"use client";

const SIZE = 220;
const STROKE = 14;
const R = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * R;

interface MacroRingProps {
  consumed: number;
  target: number;
  proteinG: number;
  proteinTargetG: number;
}

export default function MacroRing({ consumed, target, proteinG, proteinTargetG }: MacroRingProps) {
  const pct = Math.min(consumed / Math.max(target, 1), 1);
  const dash = pct * CIRCUMFERENCE;

  return (
    <div className="flex flex-col items-center mb-8">
      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} className="-rotate-90">
          {/* Track */}
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={STROKE}
          />
          {/* Progress */}
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            fill="none"
            stroke="#007AFF"
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${CIRCUMFERENCE}`}
            style={{ transition: "stroke-dasharray 0.6s cubic-bezier(0.4,0,0.2,1)" }}
          />
        </svg>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-display font-bold leading-none">{consumed}</p>
          <p className="text-label text-text-secondary mt-1">of {target} kcal</p>
        </div>
      </div>

      {/* Protein bar */}
      <div className="w-full max-w-xs mt-2">
        <div className="flex justify-between mb-2">
          <span className="text-label text-text-secondary">Protein</span>
          <span className="text-label text-text-primary font-medium">{proteinG}g / {proteinTargetG}g</span>
        </div>
        <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
          <div
            className="h-full bg-action rounded-full transition-all duration-500"
            style={{ width: `${Math.min((proteinG / Math.max(proteinTargetG, 1)) * 100, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
