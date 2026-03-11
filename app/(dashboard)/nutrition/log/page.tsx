"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Step = "camera" | "analyzing" | "confirm" | "saving";
type Mode = "photo" | "text";

interface MealForm {
  name: string;
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
  calories: string;
  proteinG: string;
  carbsG: string;
  fatG: string;
  refinement: string;
}

interface SavedMeal {
  id: string;
  name: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
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

  const [mode, setMode] = useState<Mode>("photo");
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
  const [textDescription, setTextDescription] = useState("");
  const [isEstimating, setIsEstimating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveAsFavorite, setSaveAsFavorite] = useState(false);
  const [savedMeals, setSavedMeals] = useState<SavedMeal[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ── Load saved meals ───────────────────────────────────────
  useEffect(() => {
    fetch("/api/nutrition/saved")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setSavedMeals(data);
      })
      .catch(() => {});
  }, []);

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

  // ── Analyze image ─────────────────────────────────────────
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

  // ── Estimate from text ────────────────────────────────────
  async function estimateFromText() {
    if (!textDescription.trim()) return;
    setIsEstimating(true);
    setError(null);

    try {
      const res = await fetch("/api/nutrition/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: textDescription }),
      });

      if (!res.ok) throw new Error("Estimation failed");

      const data = await res.json();
      setForm({
        name: data.name ?? textDescription,
        mealType: data.mealType ?? "lunch",
        calories: String(data.calories ?? ""),
        proteinG: String(data.proteinG ?? ""),
        carbsG: String(data.carbsG ?? ""),
        fatG: String(data.fatG ?? ""),
        refinement: "",
      });
      setStep("confirm");
    } catch {
      setError("Could not estimate macros. You can fill them in manually.");
      setForm((f) => ({ ...f, name: textDescription }));
      setStep("confirm");
    } finally {
      setIsEstimating(false);
    }
  }

  // ── Quick-select a saved meal ─────────────────────────────
  function selectSavedMeal(meal: SavedMeal) {
    setForm({
      name: meal.name,
      mealType: "lunch",
      calories: String(meal.calories),
      proteinG: String(meal.proteinG),
      carbsG: String(meal.carbsG),
      fatG: String(meal.fatG),
      refinement: "",
    });
    setStep("confirm");
  }

  // ── Delete a saved meal ───────────────────────────────────
  async function deleteSavedMeal(id: string) {
    setDeletingId(id);
    try {
      await fetch(`/api/nutrition/saved/${id}`, { method: "DELETE" });
      setSavedMeals((prev) => prev.filter((m) => m.id !== id));
    } catch {
      // ignore
    } finally {
      setDeletingId(null);
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

      // Save as frequent meal if toggled
      if (saveAsFavorite && form.name) {
        fetch("/api/nutrition/saved", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name,
            calories: Number(form.calories),
            proteinG: Number(form.proteinG),
            carbsG: Number(form.carbsG),
            fatG: Number(form.fatG),
          }),
        }).catch(() => {});
      }

      router.refresh();
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
            setMode("photo");
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

      {/* ── MODE SELECTOR (only on camera/text step) ── */}
      {(step === "camera" || step === "analyzing") && (
        <>
          <div className="mb-6">
            <p className="section-label mb-1">Fuel</p>
            <h1 className="text-title">
              {step === "analyzing" ? "Analyzing..." : "Log a Meal"}
            </h1>
          </div>

          {/* Photo / Text toggle */}
          <div
            className="flex rounded-3xl p-1 mb-5"
            style={{
              background: "var(--neuo-bg)",
              boxShadow:
                "inset 4px 4px 8px var(--neuo-mid), inset -4px -4px 8px var(--neuo-light)",
            }}
          >
            {(["photo", "text"] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(null); }}
                className="flex-1 py-2.5 rounded-3xl font-medium transition-all duration-200"
                style={{
                  fontSize: 14,
                  color: mode === m ? "#007AFF" : "rgba(44,44,44,0.45)",
                  background: mode === m ? "var(--neuo-bg)" : "transparent",
                  boxShadow:
                    mode === m
                      ? "4px 4px 10px var(--neuo-mid), -4px -4px 10px var(--neuo-light)"
                      : "none",
                  fontWeight: mode === m ? 600 : 500,
                  letterSpacing: "0.01em",
                }}
              >
                {m === "photo" ? "Photo" : "Type it"}
              </button>
            ))}
          </div>

          {/* ── PHOTO MODE ── */}
          {mode === "photo" && (
            <>
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

              {/* Scanning progress bar */}
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

              {/* Hidden file inputs */}
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

          {/* ── TEXT MODE ── */}
          {mode === "text" && step !== "analyzing" && (
            <>
              <div
                className="rounded-3xl p-5 mb-5"
                style={{
                  background: "var(--neuo-bg)",
                  boxShadow:
                    "inset 6px 6px 12px var(--neuo-dark), inset -6px -6px 12px var(--neuo-light)",
                }}
              >
                <textarea
                  className="w-full bg-transparent resize-none outline-none"
                  style={{
                    fontSize: 16,
                    color: "#2c2c2c",
                    lineHeight: 1.6,
                    letterSpacing: "0.005em",
                    minHeight: 100,
                    fontFamily: "inherit",
                  }}
                  placeholder="e.g. grilled chicken breast with rice and broccoli, medium portion"
                  value={textDescription}
                  onChange={(e) => setTextDescription(e.target.value)}
                  rows={4}
                  autoFocus
                />
              </div>

              {error && (
                <p className="text-label text-center mb-4" style={{ color: "#FF3B30" }}>
                  {error}
                </p>
              )}

              <div className="flex flex-col gap-3">
                <button
                  onClick={estimateFromText}
                  disabled={!textDescription.trim() || isEstimating}
                  className="btn-primary w-full"
                  style={{ opacity: isEstimating ? 0.6 : 1 }}
                >
                  {isEstimating ? "Estimating..." : "Estimate Macros"}
                </button>

                <button
                  onClick={() => {
                    setForm((f) => ({ ...f, name: textDescription }));
                    setStep("confirm");
                  }}
                  disabled={!textDescription.trim()}
                  className="btn-ghost w-full"
                >
                  Enter Manually
                </button>
              </div>
            </>
          )}

          {/* ── SAVED MEALS ── */}
          {step !== "analyzing" && savedMeals.length > 0 && (
            <div className="mt-8">
              <p className="section-label mb-3">Frequent Meals</p>
              <div className="flex flex-col gap-2">
                {savedMeals.map((meal) => (
                  <div
                    key={meal.id}
                    className="flex items-center justify-between rounded-3xl px-4 py-3"
                    style={{
                      background: "var(--neuo-bg)",
                      boxShadow:
                        "4px 4px 10px var(--neuo-mid), -4px -4px 10px var(--neuo-light)",
                    }}
                  >
                    <button
                      onClick={() => selectSavedMeal(meal)}
                      className="flex-1 flex items-center gap-3 text-left"
                    >
                      <div
                        className="w-8 h-8 rounded-2xl flex items-center justify-center flex-shrink-0"
                        style={{
                          backgroundColor: "rgba(0,122,255,0.08)",
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                          <path
                            d="M3 11H21M9 11V20M15 11V20M5 11C5 7.13 8.13 4 12 4C15.87 4 19 7.13 19 11"
                            stroke="#007AFF"
                            strokeWidth="1.75"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                      <div>
                        <p
                          style={{
                            fontSize: 14,
                            fontWeight: 600,
                            color: "#2c2c2c",
                            letterSpacing: "-0.01em",
                          }}
                        >
                          {meal.name}
                        </p>
                        <p
                          style={{
                            fontSize: 11,
                            color: "rgba(44,44,44,0.45)",
                            letterSpacing: "0.02em",
                          }}
                        >
                          {meal.calories} kcal · {Math.round(meal.proteinG)}g protein
                        </p>
                      </div>
                    </button>
                    <button
                      onClick={() => deleteSavedMeal(meal.id)}
                      disabled={deletingId === meal.id}
                      className="ml-3 flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-2xl transition-all duration-200"
                      style={{
                        opacity: deletingId === meal.id ? 0.4 : 0.35,
                      }}
                      aria-label="Remove saved meal"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M18 6L6 18M6 6L18 18"
                          stroke="#2c2c2c"
                          strokeWidth="1.75"
                          strokeLinecap="round"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
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

          {/* Image thumbnail (photo mode only) */}
          {imagePreview && mode === "photo" && (
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

          {/* Refinement (photo mode only) */}
          {mode === "photo" && (
            <div className="mb-4">
              <p className="section-label mb-2">Refine (optional)</p>
              <input
                className="input-field"
                value={form.refinement}
                onChange={(e) => setForm({ ...form, refinement: e.target.value })}
                placeholder="e.g. Add a side of ranch dressing"
              />
            </div>
          )}

          {/* Save as frequent meal toggle */}
          <button
            onClick={() => setSaveAsFavorite((v) => !v)}
            className="flex items-center gap-3 w-full mb-6 px-4 py-3 rounded-3xl transition-all duration-200"
            style={{
              background: "var(--neuo-bg)",
              boxShadow: saveAsFavorite
                ? "inset 4px 4px 8px var(--neuo-mid), inset -4px -4px 8px var(--neuo-light)"
                : "4px 4px 10px var(--neuo-mid), -4px -4px 10px var(--neuo-light)",
            }}
          >
            <div
              className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-all duration-200"
              style={{
                backgroundColor: saveAsFavorite ? "#007AFF" : "transparent",
                boxShadow: saveAsFavorite
                  ? "none"
                  : "inset 2px 2px 4px var(--neuo-mid), inset -2px -2px 4px var(--neuo-light)",
              }}
            >
              {saveAsFavorite && (
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                  <path
                    d="M2 6L5 9L10 3"
                    stroke="white"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>
            <span
              style={{
                fontSize: 14,
                fontWeight: 500,
                color: saveAsFavorite ? "#007AFF" : "rgba(44,44,44,0.6)",
                letterSpacing: "0.005em",
              }}
            >
              Save as frequent meal
            </span>
          </button>

          {/* Actions */}
          <div className="flex flex-col gap-3" style={{ marginTop: mode === "text" ? "0" : 0 }}>
            {mode === "photo" && form.refinement && (
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
