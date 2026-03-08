import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { signOutAction } from "@/lib/auth-actions";
import GymLocationButton from "@/components/profile/GymLocationButton";

const GOAL_LABELS: Record<string, string> = {
  lose_fat: "Lose Fat",
  build_muscle: "Build Muscle",
  maintain: "Maintain",
  improve_endurance: "Improve Endurance",
};

const ACTIVITY_LABELS: Record<string, string> = {
  sedentary: "Sedentary",
  lightly_active: "Lightly Active",
  moderately_active: "Moderately Active",
  very_active: "Very Active",
};

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  const email = session.user.email ?? "";
  const name = user?.name ?? session.user.name ?? email.split("@")[0];
  const initials = name
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="px-5 pt-8 pb-10 max-w-md mx-auto space-y-5">
      {/* Header */}
      <h1
        className="text-2xl font-bold"
        style={{ color: "#2c2c2c", letterSpacing: "-0.03em" }}
      >
        Profile
      </h1>

      {/* Avatar + Identity */}
      <div
        className="neuo-card rounded-4xl p-6 flex items-center gap-5"
      >
        <div
          className="rounded-2xl flex items-center justify-center shrink-0"
          style={{
            width: 64,
            height: 64,
            background: "var(--neuo-bg)",
            boxShadow: "4px 4px 10px var(--neuo-mid), -4px -4px 10px var(--neuo-light)",
            color: "#007AFF",
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: "-0.02em",
          }}
        >
          {initials}
        </div>
        <div className="min-w-0">
          <p
            className="font-bold text-lg truncate"
            style={{ color: "#2c2c2c", letterSpacing: "-0.02em" }}
          >
            {name}
          </p>
          <p
            className="text-sm truncate mt-0.5"
            style={{ color: "rgba(44,44,44,0.5)", letterSpacing: "0.005em" }}
          >
            {email}
          </p>
        </div>
      </div>

      {/* Stats */}
      {user && (
        <div className="neuo-card rounded-4xl p-5 space-y-4">
          <p
            className="section-label"
            style={{ fontSize: 11, color: "rgba(44,44,44,0.45)" }}
          >
            About You
          </p>

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Goal", value: user.goal ? GOAL_LABELS[user.goal] : "n/a" },
              {
                label: "Activity",
                value: user.activityLevel ? ACTIVITY_LABELS[user.activityLevel] : "n/a",
              },
              {
                label: "Weight",
                value: user.weightKg ? `${user.weightKg} kg` : "n/a",
              },
              {
                label: "Height",
                value: user.heightCm ? `${user.heightCm} cm` : "n/a",
              },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="rounded-3xl px-4 py-3"
                style={{
                  background: "var(--neuo-bg)",
                  boxShadow:
                    "inset 4px 4px 8px var(--neuo-mid), inset -4px -4px 8px var(--neuo-light)",
                }}
              >
                <p
                  style={{
                    fontSize: 10,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    color: "rgba(44,44,44,0.4)",
                  }}
                >
                  {label}
                </p>
                <p
                  className="font-semibold mt-0.5"
                  style={{ color: "#2c2c2c", fontSize: 14, letterSpacing: "-0.01em" }}
                >
                  {value}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Nutrition Targets */}
      {user && user.targetCalories && (
        <div className="neuo-card rounded-4xl p-5 space-y-3">
          <p
            className="section-label"
            style={{ fontSize: 11, color: "rgba(44,44,44,0.45)" }}
          >
            Daily Targets
          </p>
          <div className="flex gap-2">
            {[
              { label: "Cal", value: user.targetCalories },
              { label: "Protein", value: `${user.targetProteinG}g` },
              { label: "Carbs", value: `${user.targetCarbsG}g` },
              { label: "Fat", value: `${user.targetFatG}g` },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="flex-1 rounded-3xl px-2 py-3 flex flex-col items-center"
                style={{
                  background: "var(--neuo-bg)",
                  boxShadow:
                    "inset 4px 4px 8px var(--neuo-mid), inset -4px -4px 8px var(--neuo-light)",
                }}
              >
                <p
                  className="font-bold"
                  style={{ color: "#007AFF", fontSize: 15, letterSpacing: "-0.01em" }}
                >
                  {value}
                </p>
                <p
                  style={{
                    fontSize: 10,
                    color: "rgba(44,44,44,0.4)",
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                  }}
                >
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Settings */}
      <div className="neuo-card rounded-4xl p-5 space-y-3">
        <p
          className="section-label"
          style={{ fontSize: 11, color: "rgba(44,44,44,0.45)" }}
        >
          Settings
        </p>
        <GymLocationButton />
      </div>

      {/* Sign Out */}
      <form action={signOutAction}>
        <button
          type="submit"
          className="w-full rounded-3xl py-4 font-semibold transition-all duration-200"
          style={{
            background: "var(--neuo-bg)",
            color: "#e53e3e",
            fontSize: 15,
            letterSpacing: "0.005em",
            boxShadow:
              "8px 8px 16px var(--neuo-dark), -8px -8px 16px var(--neuo-light)",
          }}
        >
          Sign Out
        </button>
      </form>
    </div>
  );
}
