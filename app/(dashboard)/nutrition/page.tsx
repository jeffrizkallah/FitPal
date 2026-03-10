import { auth } from "@/auth";
import { db } from "@/db";
import { users, mealLogs, dailySummaries } from "@/db/schema";
import { and, asc, eq, gte, lt } from "drizzle-orm";
import Link from "next/link";
import MealList from "@/components/nutrition/MealList";
import PageRefresher from "@/components/PageRefresher";

export default async function NutritionPage() {
  const session = await auth();
  const userId = session!.user!.id!;

  // Always use UTC date string so it matches what the log/delete routes store
  const todayStr = new Date().toISOString().split("T")[0]; // "YYYY-MM-DD" UTC
  const today = new Date(todayStr + "T00:00:00.000Z");
  const tomorrow = new Date(today.getTime() + 86400000);

  const [user, meals, summary] = await Promise.all([
    db.select().from(users).where(eq(users.id, userId)).limit(1),
    db
      .select()
      .from(mealLogs)
      .where(
        and(
          eq(mealLogs.userId, userId),
          gte(mealLogs.loggedAt, today),
          lt(mealLogs.loggedAt, tomorrow)
        )
      )
      .orderBy(asc(mealLogs.loggedAt)),
    db
      .select()
      .from(dailySummaries)
      .where(
        and(
          eq(dailySummaries.userId, userId),
          eq(dailySummaries.date, todayStr)
        )
      )
      .limit(1),
  ]);

  const profile = user[0];
  const totals = summary[0];

  const consumed = {
    calories: totals?.totalCalories ?? 0,
    protein: totals?.totalProteinG ?? 0,
    carbs: totals?.totalCarbsG ?? 0,
    fat: totals?.totalFatG ?? 0,
  };

  const targets = {
    calories: profile?.targetCalories ?? 2000,
    protein: profile?.targetProteinG ?? 150,
    carbs: profile?.targetCarbsG ?? 200,
    fat: profile?.targetFatG ?? 65,
  };

  const proteinPct = Math.min(
    Math.round((consumed.protein / targets.protein) * 100),
    100
  );
  const calPct = Math.min(
    Math.round((consumed.calories / targets.calories) * 100),
    100
  );
  const carbsPct = Math.min(
    Math.round((consumed.carbs / targets.carbs) * 100),
    100
  );
  const fatPct = Math.min(
    Math.round((consumed.fat / targets.fat) * 100),
    100
  );

  // Macro gap alerts — significant deficits
  const calRemaining = targets.calories - consumed.calories;
  const proteinRemaining = targets.protein - consumed.protein;
  const showProteinAlert = proteinRemaining > 30;
  const showCalAlert = calRemaining > 400 && meals.length > 0;

  return (
    <div className="px-6 pt-12 pb-32 animate-fade-in">
      <PageRefresher />
      {/* Header */}
      <div className="mb-8">
        <p className="section-label mb-1">Fuel</p>
        <h1 className="text-title">Today</h1>
      </div>

      {/* Macro progress card */}
      <div
        className="neuo-card p-5 mb-6"
        style={{ borderRadius: "2rem" }}
      >
        <p className="section-label mb-4">Nutrition</p>

        <MacroBar
          label="Calories"
          consumed={consumed.calories}
          target={targets.calories}
          pct={calPct}
          unit="kcal"
          color="#007AFF"
        />
        <MacroBar
          label="Protein"
          consumed={Math.round(consumed.protein)}
          target={targets.protein}
          pct={proteinPct}
          unit="g"
          color="#007AFF"
        />
        <MacroBar
          label="Carbs"
          consumed={Math.round(consumed.carbs)}
          target={targets.carbs}
          pct={carbsPct}
          unit="g"
          color="#34C759"
        />
        <MacroBar
          label="Fat"
          consumed={Math.round(consumed.fat)}
          target={targets.fat}
          pct={fatPct}
          unit="g"
          color="#FF9500"
        />
      </div>

      {/* Macro gap alerts */}
      {(showProteinAlert || showCalAlert) && (
        <div className="flex flex-col gap-3 mb-6">
          {showProteinAlert && (
            <div
              className="flex items-center gap-3 px-4 py-3 rounded-3xl"
              style={{
                backgroundColor: "var(--neuo-bg)",
                boxShadow:
                  "inset 4px 4px 8px var(--neuo-mid), inset -4px -4px 8px var(--neuo-light)",
              }}
            >
              <div
                className="w-8 h-8 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{
                  backgroundColor: "rgba(0, 122, 255, 0.08)",
                  boxShadow: "none",
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 9V13M12 17H12.01M10.29 3.86L1.82 18C1.64 18.31 1.55 18.65 1.55 19C1.55 20.1 2.45 21 3.55 21H20.45C21.55 21 22.45 20.1 22.45 19C22.45 18.65 22.36 18.31 22.18 18L13.71 3.86C13.32 3.22 12.69 2.86 12 2.86C11.31 2.86 10.68 3.22 10.29 3.86Z"
                    stroke="#007AFF"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <p className="text-label text-text-secondary">
                {Math.round(proteinRemaining)}g protein to go. Consider chicken,
                Greek yogurt, or eggs.
              </p>
            </div>
          )}
          {showCalAlert && (
            <div
              className="flex items-center gap-3 px-4 py-3 rounded-3xl"
              style={{
                backgroundColor: "var(--neuo-bg)",
                boxShadow:
                  "inset 4px 4px 8px var(--neuo-mid), inset -4px -4px 8px var(--neuo-light)",
              }}
            >
              <div
                className="w-8 h-8 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{
                  backgroundColor: "rgba(255, 149, 0, 0.08)",
                  boxShadow: "none",
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 9V13M12 17H12.01M10.29 3.86L1.82 18C1.64 18.31 1.55 18.65 1.55 19C1.55 20.1 2.45 21 3.55 21H20.45C21.55 21 22.45 20.1 22.45 19C22.45 18.65 22.36 18.31 22.18 18L13.71 3.86C13.32 3.22 12.69 2.86 12 2.86C11.31 2.86 10.68 3.22 10.29 3.86Z"
                    stroke="#FF9500"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <p className="text-label text-text-secondary">
                {Math.round(calRemaining)} kcal below target. Log your next meal
                to stay on track.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Log a Meal CTA */}
      <Link href="/nutrition/log" className="btn-primary w-full text-center block mb-8">
        Log a Meal
      </Link>

      {/* Meal list */}
      {meals.length > 0 ? (
        <>
          <p className="section-label mb-4">Logged Today</p>
          <MealList meals={meals} />
        </>
      ) : (
        <div
          className="neuo-card p-10 text-center"
          style={{ borderRadius: "2rem" }}
        >
          <div
            className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center"
            style={{
              backgroundColor: "var(--neuo-bg)",
              boxShadow:
                "inset 4px 4px 8px var(--neuo-mid), inset -4px -4px 8px var(--neuo-light)",
            }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path
                d="M3 11H21M9 11V20M15 11V20M5 11C5 7.13 8.13 4 12 4C15.87 4 19 7.13 19 11"
                stroke="#007AFF"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h2
            className="text-heading font-bold mb-2"
            style={{ letterSpacing: "-0.02em" }}
          >
            Nothing logged yet
          </h2>
          <p className="text-body text-text-secondary">
            Take a photo of your meal and the AI handles the rest.
          </p>
        </div>
      )}
    </div>
  );
}

function MacroBar({
  label,
  consumed,
  target,
  pct,
  unit,
  color,
}: {
  label: string;
  consumed: number;
  target: number;
  pct: number;
  unit: string;
  color: string;
}) {
  return (
    <div className="mb-4 last:mb-0">
      <div className="flex justify-between items-baseline mb-2">
        <p className="text-label font-medium text-text-secondary">{label}</p>
        <p className="text-label text-text-secondary">
          <span className="font-semibold text-text-primary">{consumed}</span>
          {" / "}
          {target}
          {unit}
        </p>
      </div>
      <div
        className="h-2 w-full rounded-full"
        style={{
          backgroundColor: "var(--neuo-bg)",
          boxShadow:
            "inset 2px 2px 4px var(--neuo-mid), inset -2px -2px 4px var(--neuo-light)",
        }}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            backgroundColor: color,
            opacity: 0.85,
          }}
        />
      </div>
    </div>
  );
}
