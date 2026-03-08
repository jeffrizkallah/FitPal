interface MealCardProps {
  name: string;
  mealType: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  loggedAt: Date | string;
}

const mealTypeLabels: Record<string, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
};

function formatTime(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export default function MealCard({
  name,
  mealType,
  calories,
  proteinG,
  carbsG,
  fatG,
  loggedAt,
}: MealCardProps) {
  return (
    <div
      className="neuo-card px-5 py-4"
      style={{ borderRadius: "1.5rem" }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div>
            <p
              className="text-body font-semibold"
              style={{ letterSpacing: "-0.01em" }}
            >
              {name}
            </p>
            <p className="text-label text-text-secondary mt-0.5">
              {mealTypeLabels[mealType] ?? mealType} · {formatTime(loggedAt)}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p
            className="text-body font-bold"
            style={{ color: "#007AFF", letterSpacing: "-0.01em" }}
          >
            {calories}
          </p>
          <p className="text-label text-text-secondary">kcal</p>
        </div>
      </div>

      {/* Macro pills */}
      <div className="flex gap-2 mt-2">
        <MacroPill label="P" value={Math.round(proteinG)} color="#007AFF" />
        <MacroPill label="C" value={Math.round(carbsG)} color="#34C759" />
        <MacroPill label="F" value={Math.round(fatG)} color="#FF9500" />
      </div>
    </div>
  );
}

function MacroPill({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div
      className="flex items-center gap-1 px-3 py-1 rounded-2xl"
      style={{
        backgroundColor: "var(--neuo-bg)",
        boxShadow:
          "inset 2px 2px 4px var(--neuo-mid), inset -2px -2px 4px var(--neuo-light)",
      }}
    >
      <span className="text-caption font-semibold" style={{ color }}>
        {label}
      </span>
      <span className="text-caption text-text-secondary">{value}g</span>
    </div>
  );
}
