"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Step = "camera" | "analyzing" | "confirm" | "saving";

interface MealForm {
  name: string;
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
  calories: string;
  proteinG: string;
  carbsG: string;
  fatG: string;
  refinement: string;
}

const mealTypes = ["breakfast", "lunch", "dinner", "snack"] as const;
const mealTypeLabels: Record<string, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
};

const iconWellStyle = {
  backgroundColor: "var(--neuo-bg)",
  boxShadow:
    "inset 3px 3px 7px var(--neuo-dark), inset -3px -3px 7px var(--neuo-light)",
} as React.CSSProperties;

export default function NutritionLogPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("camera");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageMediaType, setImageMediaType] = useState<
    "image/jpeg" | "image/png" | "image/gif" | "image/webp"
  >("image/jpeg");
  const [aiItems, setAiItems] = useState<
    { name: string; calories: number; proteinG: number; carbsG: number; fatG: number }[]
  >([]);
  const [form, setForm] = useState<MealForm>({
    name: "",
    mealType: "lunch",
    calories: "",
    proteinG: "",
    carbsG: "",
    fatG: "",
    refinement: "",
  });
  const [error, setError] = useState<string | null>(null);

  // ── File selection ────────────────────────────────────────
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const preview = URL.createObjectURL(file);
    setImagePreview(preview);
    setError(null);

    const mediaType = file.type as typeof imageMediaType;
    setImageMediaType(mediaType || "image/jpeg");

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setImageBase64(result.split(",")[1]);
    };
    reader.readAsDataURL(file);
  }

  // ── Analyze (initial or refinement) ──────────────────────
  async function analyze(refinement?: string) {
    if (!imageBase64) return;
    setError(null);
    setStep("analyzing");

    try {
      const res = await fetch("/api/nutrition/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: imageBase64,
          mediaType: imageMediaType,
          refinement,
        }),
      });

      if (!res.ok) throw new Error("Analysis failed");

      const data = await res.json();
      setAiItems(data.items ?? []);
      setForm({
        name: data.name ?? "",
        mealType: data.mealType ?? "lunch",
        calories: String(data.calories ?? ""),
        proteinG: String(data.proteinG ?? ""),
        carbsG: String(data.carbsG ?? ""),
        fatG: String(data.fatG ?? ""),
        refinement: "",
      });
      setStep("confirm");
    } catch {
      setError("Could not analyze the image. Please try again.");
      setStep(imageBase64 ? "confirm" : "camera");
    }
  }

  // ── Save meal ─────────────────────────────────────────────
  async function saveMeal() {
    setStep("saving");
    setError(null);

    try {
      const res = await fetch("/api/nutrition/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          mealType: form.mealType,
          calories: Number(form.calories),
          proteinG: Number(form.proteinG),
          carbsG: Number(form.carbsG),
          fatG: Number(form.fatG),
          aiRawData: aiItems.length > 0 ? { items: aiItems } : undefined,
        }),
      });

      if (!res.ok) throw new Error("Failed to save");

      router.push("/nutrition");
    } catch {
      setError("Could not save the meal. Please try again.");
      setStep("confirm");
    }
  }

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="min-h-screen px-6 pt-12 pb-32 animate-fade-in">
      {/* Back button */}
      <button
        onClick={() => {
          if (step === "confirm") {
            setStep("camera");
          } else {
            router.back();
          }
        }}
        className="flex items-center gap-2 mb-8"
        style={{ color: "#007AFF" }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path
            d="M19 12H5M12 5L5 12L12 19"
            stroke="#007AFF"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="text-body font-medium">Back</span>
      </button>

      {/* ── CAMERA STEP ── */}
      {(step === "camera" || step === "analyzing") && (
        <>
          <div className="mb-6">
            <p className="section-label mb-1">Fuel</p>
            <h1 className="text-title">
              {step === "analyzing" ? "Analyzing..." : "Log a Meal"}
            </h1>
          </div>

          {/* Preview / placeholder */}
          <div
            className="w-full"
            style={{
              aspectRatio: "4/3",
              borderRadius: "2rem",
              backgroundColor: "var(--neuo-bg)",
              boxShadow:
                "inset 8px 8px 16px var(--neuo-dark), inset -8px -8px 16px var(--neuo-light)",
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {imagePreview ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={imagePreview}
                alt="Food preview"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center"
                  style={iconWellStyle}
                >
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M23 19C23 19.53 22.79 20.04 22.41 20.41C22.04 20.79 21.53 21 21 21H3C2.47 21 1.96 20.79 1.59 20.41C1.21 20.04 1 19.53 1 19V8C1 7.47 1.21 6.96 1.59 6.59C1.96 6.21 2.47 6 3 6H7L9 3H15L17 6H21C21.53 6 22.04 6.21 22.41 6.59C22.79 6.96 23 7.47 23 8V19Z"
                      stroke="#007AFF"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <circle
                      cx="12"
                      cy="13"
                      r="4"
                      stroke="#007AFF"
                      strokeWidth="1.75"
                    />
                  </svg>
                </div>
                <p className="text-label text-text-secondary">
                  Take or upload a photo
                </p>
              </div>
            )}
          </div>

          {/* Scanning progress bar — shown only while analyzing */}
          {step === "analyzing" ? (
            <div className="mt-4 mb-6">
              <div
                className="w-full h-1.5 rounded-full overflow-hidden"
                style={{
                  backgroundColor: "var(--neuo-bg)",
                  boxShadow:
                    "inset 2px 2px 4px var(--neuo-mid), inset -2px -2px 4px var(--neuo-light)",
                }}
              >
                <style>{`
                  @keyframes scan {
                    0%   { transform: translateX(-100%); }
                    100% { transform: translateX(500%); }
                  }
                `}</style>
                <div
                  style={{
                    width: "20%",
                    height: "100%",
                    borderRadius: "9999px",
                    backgroundColor: "#007AFF",
                    animation: "scan 1.4s ease-in-out infinite",
                  }}
                />
              </div>
              <p
                className="text-label text-text-secondary mt-2 text-center"
                style={{ letterSpacing: "0.02em" }}
              >
                Identifying food
              </p>
            </div>
          ) : (
            <div className="mb-6" />
          )}

          {error && (
            <p className="text-label text-center mb-4" style={{ color: "#FF3B30" }}>
              {error}
            </p>
          )}

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileChange}
          />

          {/* Actions */}
          {step !== "analyzing" && (
            <div className="flex flex-col gap-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="btn-primary w-full"
              >
                {imagePreview ? "Retake Photo" : "Take Photo"}
              </button>

              {imagePreview && (
                <button
                  onClick={() => analyze()}
                  className="btn-primary w-full"
                >
                  Analyze Meal
                </button>
              )}

              <button
                onClick={() => {
                  if (fileInputRef.current) {
                    fileInputRef.current.removeAttribute("capture");
                    fileInputRef.current.click();
                    // restore after
                    setTimeout(
                      () =>
                        fileInputRef.current?.setAttribute(
                          "capture",
                          "environment"
                        ),
                      500
                    );
                  }
                }}
                className="btn-ghost w-full"
              >
                Upload from Library
              </button>
            </div>
          )}
        </>
      )}

      {/* ── CONFIRM STEP ── */}
      {(step === "confirm" || step === "saving") && (
        <>
          <div className="mb-6">
            <p className="section-label mb-1">Fuel</p>
            <h1 className="text-title">Confirm Meal</h1>
          </div>

          {/* Image thumbnail */}
          {imagePreview && (
            <div
              className="w-full mb-6"
              style={{
                height: "160px",
                borderRadius: "1.5rem",
                overflow: "hidden",
                boxShadow:
                  "4px 4px 10px var(--neuo-mid), -4px -4px 10px var(--neuo-light)",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imagePreview}
                alt="Food"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
          )}

          {error && (
            <p className="text-label text-center mb-4" style={{ color: "#FF3B30" }}>
              {error}
            </p>
          )}

          {/* Meal name */}
          <div className="mb-4">
            <p className="section-label mb-2">Meal Name</p>
            <input
              className="input-field"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Grilled chicken with rice"
            />
          </div>

          {/* Meal type */}
          <div className="mb-4">
            <p className="section-label mb-2">Meal Type</p>
            <div className="grid grid-cols-4 gap-2">
              {mealTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => setForm({ ...form, mealType: type })}
                  className={
                    form.mealType === type
                      ? "neuo-option-selected text-center py-3"
                      : "neuo-option text-center py-3"
                  }
                  style={{ borderRadius: "1rem", padding: "10px 4px" }}
                >
                  <span className="text-label font-medium">
                    {mealTypeLabels[type]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Macros */}
          <div className="mb-4">
            <p className="section-label mb-2">Nutrition</p>
            <div className="grid grid-cols-2 gap-3">
              <MacroInput
                label="Calories"
                value={form.calories}
                unit="kcal"
                onChange={(v) => setForm({ ...form, calories: v })}
              />
              <MacroInput
                label="Protein"
                value={form.proteinG}
                unit="g"
                onChange={(v) => setForm({ ...form, proteinG: v })}
              />
              <MacroInput
                label="Carbs"
                value={form.carbsG}
                unit="g"
                onChange={(v) => setForm({ ...form, carbsG: v })}
              />
              <MacroInput
                label="Fat"
                value={form.fatG}
                unit="g"
                onChange={(v) => setForm({ ...form, fatG: v })}
              />
            </div>
          </div>

          {/* Semantic refinement */}
          <div className="mb-6">
            <p className="section-label mb-2">Refine (optional)</p>
            <input
              className="input-field"
              value={form.refinement}
              onChange={(e) => setForm({ ...form, refinement: e.target.value })}
              placeholder="e.g. Add a side of ranch dressing"
            />
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            {form.refinement && (
              <button
                onClick={() => analyze(form.refinement)}
                className="btn-ghost w-full"
                disabled={step === "saving"}
              >
                Re-analyze with Context
              </button>
            )}

            <button
              onClick={saveMeal}
              className="btn-primary w-full"
              disabled={
                step === "saving" ||
                !form.name ||
                !form.calories
              }
            >
              {step === "saving" ? "Saving..." : "Log Meal"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function MacroInput({
  label,
  value,
  unit,
  onChange,
}: {
  label: string;
  value: string;
  unit: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <p className="text-label text-text-secondary mb-1.5">
        {label}
        <span className="ml-1 text-text-tertiary">({unit})</span>
      </p>
      <input
        type="number"
        inputMode="numeric"
        className="input-field"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        min="0"
        style={{ padding: "12px 16px" }}
      />
    </div>
  );
}
