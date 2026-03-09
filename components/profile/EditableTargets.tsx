"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  targetCalories: number;
  targetProteinG: number;
  targetCarbsG: number;
  targetFatG: number;
}

export default function EditableTargets({
  targetCalories,
  targetProteinG,
  targetCarbsG,
  targetFatG,
}: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [values, setValues] = useState({
    targetCalories: String(targetCalories),
    targetProteinG: String(targetProteinG),
    targetCarbsG: String(targetCarbsG),
    targetFatG: String(targetFatG),
  });

  async function save() {
    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/profile/targets", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetCalories: Number(values.targetCalories),
          targetProteinG: Number(values.targetProteinG),
          targetCarbsG: Number(values.targetCarbsG),
          targetFatG: Number(values.targetFatG),
        }),
      });

      if (!res.ok) throw new Error("Failed to save");

      setEditing(false);
      router.refresh();
    } catch {
      setError("Could not save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function cancel() {
    setValues({
      targetCalories: String(targetCalories),
      targetProteinG: String(targetProteinG),
      targetCarbsG: String(targetCarbsG),
      targetFatG: String(targetFatG),
    });
    setEditing(false);
    setError(null);
  }

  const fields = [
    { key: "targetCalories" as const, label: "Cal", unit: "kcal" },
    { key: "targetProteinG" as const, label: "Protein", unit: "g" },
    { key: "targetCarbsG" as const, label: "Carbs", unit: "g" },
    { key: "targetFatG" as const, label: "Fat", unit: "g" },
  ];

  return (
    <div className="neuo-card rounded-4xl p-5 space-y-3">
      <div className="flex items-center justify-between">
        <p
          className="section-label"
          style={{ fontSize: 11, color: "rgba(44,44,44,0.45)" }}
        >
          Daily Targets
        </p>
        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            style={{
              fontSize: 12,
              color: "#007AFF",
              fontWeight: 500,
              letterSpacing: "0.01em",
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
          >
            Edit
          </button>
        ) : (
          <div style={{ display: "flex", gap: 12 }}>
            <button
              onClick={cancel}
              style={{
                fontSize: 12,
                color: "rgba(44,44,44,0.5)",
                fontWeight: 500,
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              onClick={save}
              disabled={saving}
              style={{
                fontSize: 12,
                color: "#007AFF",
                fontWeight: 600,
                background: "none",
                border: "none",
                cursor: saving ? "default" : "pointer",
                opacity: saving ? 0.5 : 1,
              }}
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        )}
      </div>

      {editing ? (
        <>
          <div className="grid grid-cols-2 gap-3">
            {fields.map(({ key, label, unit }) => (
              <div key={key}>
                <p
                  style={{
                    fontSize: 10,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    color: "rgba(44,44,44,0.4)",
                    marginBottom: 4,
                  }}
                >
                  {label} ({unit})
                </p>
                <input
                  type="number"
                  inputMode="numeric"
                  value={values[key]}
                  onChange={(e) =>
                    setValues((prev) => ({ ...prev, [key]: e.target.value }))
                  }
                  className="input-field"
                  style={{ padding: "10px 14px", fontSize: 14 }}
                  min="0"
                />
              </div>
            ))}
          </div>
          {error && (
            <p style={{ fontSize: 12, color: "#FF3B30", textAlign: "center" }}>
              {error}
            </p>
          )}
        </>
      ) : (
        <div className="flex gap-2">
          {fields.map(({ key, label }) => (
            <div
              key={key}
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
                {key === "targetCalories"
                  ? values.targetCalories
                  : `${values[key]}g`}
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
      )}
    </div>
  );
}
