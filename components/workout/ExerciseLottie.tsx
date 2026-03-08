"use client";

const HIGHLIGHT_SHAPES: Record<string, React.ReactNode> = {
  chest:      <ellipse cx="40" cy="50" rx="13" ry="9"  fill="#007AFF" />,
  back:       <rect x="27" y="41" width="26" height="22" rx="5" fill="#007AFF" />,
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

interface ExerciseLottieProps {
  muscleGroup: string;
  className?: string;
}

export default function ExerciseLottie({ muscleGroup, className }: ExerciseLottieProps) {
  const highlight = HIGHLIGHT_SHAPES[muscleGroup] ?? null;
  return (
    <div className={className}>
      <svg viewBox="0 0 80 132" fill="none" className="w-full h-full" role="img" aria-label={`${muscleGroup} muscle diagram`}>
        <circle cx="40" cy="15" r="11" fill="var(--neuo-mid)" />
        <rect x="35" y="24" width="10" height="7" rx="3" fill="var(--neuo-mid)" />
        <rect x="24" y="31" width="32" height="40" rx="7" fill="var(--neuo-mid)" />
        <rect x="7"  y="31" width="15" height="40" rx="7" fill="var(--neuo-mid)" />
        <rect x="58" y="31" width="15" height="40" rx="7" fill="var(--neuo-mid)" />
        <rect x="25" y="73" width="12" height="52" rx="6" fill="var(--neuo-mid)" />
        <rect x="43" y="73" width="12" height="52" rx="6" fill="var(--neuo-mid)" />
        {highlight && <g className="muscle-highlight">{highlight}</g>}
      </svg>
    </div>
  );
}
