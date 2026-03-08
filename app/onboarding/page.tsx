"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { cn } from "@/lib/utils";

type Goal = "lose_fat" | "build_muscle" | "maintain" | "improve_endurance";
type ActivityLevel = "sedentary" | "lightly_active" | "moderately_active" | "very_active";

interface OnboardingData {
  name: string;
  ageYears: string;
  heightCm: string;
  weightKg: string;
  goal: Goal | null;
  activityLevel: ActivityLevel | null;
}

const GOALS: { value: Goal; label: string; description: string }[] = [
  { value: "lose_fat",          label: "Lose Fat",           description: "Reduce body fat while preserving muscle" },
  { value: "build_muscle",      label: "Build Muscle",       description: "Increase lean mass and strength" },
  { value: "maintain",          label: "Maintain",           description: "Hold current composition and performance" },
  { value: "improve_endurance", label: "Endurance",          description: "Improve cardiovascular capacity and stamina" },
];

const ACTIVITY_LEVELS: { value: ActivityLevel; label: string; description: string }[] = [
  { value: "sedentary",          label: "Sedentary",         description: "Desk job, little to no exercise" },
  { value: "lightly_active",     label: "Lightly Active",    description: "Light exercise 1–3 days/week" },
  { value: "moderately_active",  label: "Moderate",          description: "Moderate exercise 3–5 days/week" },
  { value: "very_active",        label: "Very Active",       description: "Hard training 6–7 days/week" },
];

const TOTAL_STEPS = 4;

export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useUser();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  const [data, setData] = useState<OnboardingData>({
    name:          user?.firstName ?? "",
    ageYears:      "",
    heightCm:      "",
    weightKg:      "",
    goal:          null,
    activityLevel: null,
  });

  function update<K extends keyof OnboardingData>(key: K, value: OnboardingData[K]) {
    setData((prev) => ({ ...prev, [key]: value }));
  }

  function canAdvance() {
    if (step === 1) return data.name.trim().length > 0;
    if (step === 2) return data.ageYears !== "" && data.heightCm !== "" && data.weightKg !== "";
    if (step === 3) return data.goal !== null;
    if (step === 4) return data.activityLevel !== null;
    return false;
  }

  async function handleFinish() {
    if (!canAdvance()) return;
    setSaving(true);

    await fetch("/api/user/onboard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name:          data.name,
        ageYears:      Number(data.ageYears),
        heightCm:      Number(data.heightCm),
        weightKg:      Number(data.weightKg),
        goal:          data.goal,
        activityLevel: data.activityLevel,
      }),
    });

    router.push("/");
  }

  return (
    <main className="min-h-screen flex flex-col px-6 pt-safe">
      {/* Progress bar */}
      <div className="pt-12 pb-8">
        <div className="flex gap-1.5 mb-6">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1 flex-1 rounded-full transition-all duration-300",
                i < step ? "bg-action" : "bg-white/10"
              )}
            />
          ))}
        </div>

        <p className="section-label mb-1">Step {step} of {TOTAL_STEPS}</p>
      </div>

      {/* Step content */}
      <div className="flex-1 animate-slide-up">
        {step === 1 && (
          <StepName value={data.name} onChange={(v) => update("name", v)} />
        )}
        {step === 2 && (
          <StepBiometrics
            age={data.ageYears}
            height={data.heightCm}
            weight={data.weightKg}
            onChangeAge={(v) => update("ageYears", v)}
            onChangeHeight={(v) => update("heightCm", v)}
            onChangeWeight={(v) => update("weightKg", v)}
          />
        )}
        {step === 3 && (
          <StepGoal value={data.goal} onChange={(v) => update("goal", v)} />
        )}
        {step === 4 && (
          <StepActivity value={data.activityLevel} onChange={(v) => update("activityLevel", v)} />
        )}
      </div>

      {/* CTA */}
      <div className="pb-safe pt-6 pb-10">
        <button
          onClick={step < TOTAL_STEPS ? () => setStep((s) => s + 1) : handleFinish}
          disabled={!canAdvance() || saving}
          className="btn-primary w-full"
        >
          {saving ? "Saving..." : step < TOTAL_STEPS ? "Continue" : "Start Training"}
        </button>
      </div>
    </main>
  );
}

// ─── Step 1: Name ─────────────────────────────────────────
function StepName({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <h1 className="text-title mb-2">What should we call you?</h1>
      <p className="text-body text-text-secondary mb-8">This personalises your coaching experience.</p>
      <input
        className="input-field"
        placeholder="Your name"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoFocus
      />
    </div>
  );
}

// ─── Step 2: Biometrics ───────────────────────────────────
function StepBiometrics({
  age, height, weight,
  onChangeAge, onChangeHeight, onChangeWeight,
}: {
  age: string; height: string; weight: string;
  onChangeAge: (v: string) => void;
  onChangeHeight: (v: string) => void;
  onChangeWeight: (v: string) => void;
}) {
  return (
    <div>
      <h1 className="text-title mb-2">Your baseline</h1>
      <p className="text-body text-text-secondary mb-8">Used to calculate your daily targets. Never shared.</p>
      <div className="flex flex-col gap-4">
        <div>
          <p className="section-label mb-2">Age</p>
          <input className="input-field" type="number" placeholder="Years" value={age} onChange={(e) => onChangeAge(e.target.value)} />
        </div>
        <div>
          <p className="section-label mb-2">Height</p>
          <input className="input-field" type="number" placeholder="Centimetres" value={height} onChange={(e) => onChangeHeight(e.target.value)} />
        </div>
        <div>
          <p className="section-label mb-2">Weight</p>
          <input className="input-field" type="number" placeholder="Kilograms" value={weight} onChange={(e) => onChangeWeight(e.target.value)} />
        </div>
      </div>
    </div>
  );
}

// ─── Step 3: Goal ─────────────────────────────────────────
function StepGoal({ value, onChange }: { value: Goal | null; onChange: (v: Goal) => void }) {
  return (
    <div>
      <h1 className="text-title mb-2">Primary goal</h1>
      <p className="text-body text-text-secondary mb-8">Your plan and nutrition targets will be built around this.</p>
      <div className="flex flex-col gap-3">
        {GOALS.map((g) => (
          <button
            key={g.value}
            onClick={() => onChange(g.value)}
            className={cn(
              "w-full text-left p-4 rounded-2xl border transition-all duration-150",
              value === g.value
                ? "border-action bg-action-dim"
                : "border-border bg-surface-tertiary active:bg-white/8"
            )}
          >
            <p className="text-body font-semibold text-text-primary">{g.label}</p>
            <p className="text-label text-text-secondary mt-0.5">{g.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Step 4: Activity Level ───────────────────────────────
function StepActivity({ value, onChange }: { value: ActivityLevel | null; onChange: (v: ActivityLevel) => void }) {
  return (
    <div>
      <h1 className="text-title mb-2">Activity level</h1>
      <p className="text-body text-text-secondary mb-8">Outside of dedicated training sessions.</p>
      <div className="flex flex-col gap-3">
        {ACTIVITY_LEVELS.map((a) => (
          <button
            key={a.value}
            onClick={() => onChange(a.value)}
            className={cn(
              "w-full text-left p-4 rounded-2xl border transition-all duration-150",
              value === a.value
                ? "border-action bg-action-dim"
                : "border-border bg-surface-tertiary active:bg-white/8"
            )}
          >
            <p className="text-body font-semibold text-text-primary">{a.label}</p>
            <p className="text-label text-text-secondary mt-0.5">{a.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
