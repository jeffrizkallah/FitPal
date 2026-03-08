import Link from "next/link";

interface Props {
  user: { targetCalories: number | null; targetProteinG: number | null } | null;
  summary: {
    totalCalories: number | null;
    totalProteinG: number | null;
    workoutDoneMin: number | null;
  } | null;
  lastSession: { completedAt: Date | null; durationMin: number | null } | null;
}

export default function DailySnapshot({ summary, lastSession }: Props) {
  const worked = lastSession?.durationMin ?? 0;
  const meals  = summary?.totalCalories ? "Logged" : "Not logged";

  return (
    <div className="flex flex-col gap-3 mt-2">
      {/* Quick actions */}
      <p className="section-label mt-4 mb-1">Quick Start</p>

      <Link
        href="/workout"
        className="glass flex items-center justify-between px-5 py-4 active:scale-95 transition-transform duration-150"
      >
        <div>
          <p className="text-body font-semibold">Start Workout</p>
          <p className="text-label text-text-secondary mt-0.5">
            {worked > 0 ? `Last session: ${worked} min` : "No session today"}
          </p>
        </div>
        <div className="w-10 h-10 rounded-full bg-action/15 flex items-center justify-center">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M8 5L19 12L8 19V5Z" fill="#007AFF" />
          </svg>
        </div>
      </Link>

      <Link
        href="/nutrition"
        className="glass flex items-center justify-between px-5 py-4 active:scale-95 transition-transform duration-150"
      >
        <div>
          <p className="text-body font-semibold">Log a Meal</p>
          <p className="text-label text-text-secondary mt-0.5">Today: {meals}</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-action/15 flex items-center justify-center">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9" stroke="#007AFF" strokeWidth="1.75" />
            <path d="M12 8V12L15 14" stroke="#007AFF" strokeWidth="1.75" strokeLinecap="round" />
          </svg>
        </div>
      </Link>

      <Link
        href="/advisor"
        className="glass flex items-center justify-between px-5 py-4 active:scale-95 transition-transform duration-150"
      >
        <div>
          <p className="text-body font-semibold">Ask Advisor</p>
          <p className="text-label text-text-secondary mt-0.5">How are you feeling today?</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-action/15 flex items-center justify-center">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d="M20 2H4C2.9 2 2 2.9 2 4V16C2 17.1 2.9 18 4 18H8L12 22L16 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z"
              stroke="#007AFF"
              strokeWidth="1.75"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </Link>
    </div>
  );
}
