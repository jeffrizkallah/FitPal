"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

type EquipmentItem = {
  id: string;
  name: string;
  category: string | null;
  notes: string | null;
  createdAt: string;
};

type ScannedItem = {
  name: string;
  category: string;
  selected: boolean;
};

type Step = "list" | "scan" | "confirm";

const CATEGORY_LABELS: Record<string, string> = {
  free_weights: "Free Weights",
  machines: "Machines",
  cables: "Cables",
  cardio: "Cardio",
  bodyweight: "Bodyweight",
  resistance_bands: "Resistance Bands",
};

export default function EquipmentPage() {
  const [step, setStep] = useState<Step>("list");
  const [equipment, setEquipment] = useState<EquipmentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Scan state
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageData, setImageData] = useState<{ base64: string; mediaType: string } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/advisor/equipment")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setEquipment(data);
      })
      .finally(() => setIsLoading(false));
  }, []);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setImagePreview(dataUrl);
      const base64 = dataUrl.split(",")[1];
      setImageData({ base64, mediaType: file.type });
    };
    reader.readAsDataURL(file);
  }

  async function analyzeImage() {
    if (!imageData) return;
    setIsAnalyzing(true);

    try {
      const res = await fetch("/api/advisor/equipment/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageData.base64, mediaType: imageData.mediaType }),
      });
      const items: Array<{ name: string; category: string }> = await res.json();
      setScannedItems(items.map((i) => ({ ...i, selected: true })));
      setStep("confirm");
    } catch {
      setScannedItems([]);
      setStep("confirm");
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function saveSelected() {
    const toSave = scannedItems.filter((i) => i.selected);
    if (!toSave.length) {
      setStep("list");
      return;
    }

    setIsSaving(true);
    try {
      await Promise.all(
        toSave.map((item) =>
          fetch("/api/advisor/equipment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: item.name, category: item.category }),
          })
        )
      );

      // Refresh list
      const res = await fetch("/api/advisor/equipment");
      const data = await res.json();
      if (Array.isArray(data)) setEquipment(data);
      resetScan();
      setStep("list");
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteItem(id: string) {
    await fetch(`/api/advisor/equipment/${id}`, { method: "DELETE" });
    setEquipment((prev) => prev.filter((e) => e.id !== id));
  }

  function resetScan() {
    setImagePreview(null);
    setImageData(null);
    setScannedItems([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  // ── Group equipment by category ──────────────────────────
  const grouped = equipment.reduce<Record<string, EquipmentItem[]>>((acc, item) => {
    const cat = item.category ?? "other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  // ── LIST view ────────────────────────────────────────────
  if (step === "list") {
    return (
      <div style={{ padding: "24px 20px 100px", background: "var(--neuo-bg)", minHeight: "100%" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <Link
            href="/advisor"
            style={{
              width: 38,
              height: 38,
              borderRadius: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "4px 4px 10px var(--neuo-mid), -4px -4px 10px var(--neuo-light)",
              background: "var(--neuo-bg)",
              flexShrink: 0,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M19 12H5M12 5l-7 7 7 7"
                stroke="#2c2c2c"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
          <div>
            <h1
              style={{
                fontSize: 24,
                fontWeight: 700,
                color: "#2c2c2c",
                letterSpacing: "-0.02em",
                margin: 0,
              }}
            >
              Equipment
            </h1>
            <p
              style={{
                fontSize: 12,
                color: "rgba(44,44,44,0.5)",
                margin: "3px 0 0",
                letterSpacing: "0.02em",
                textTransform: "uppercase",
              }}
            >
              Gym inventory
            </p>
          </div>
        </div>

        {/* Scan button */}
        <button
          onClick={() => { resetScan(); setStep("scan"); }}
          className="btn-primary"
          style={{ width: "100%", marginBottom: 24 }}
        >
          Scan Equipment
        </button>

        {/* Equipment list */}
        {isLoading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  height: 52,
                  borderRadius: 20,
                  background: "var(--neuo-mid)",
                  opacity: 0.4,
                }}
              />
            ))}
          </div>
        ) : equipment.length === 0 ? (
          <div
            style={{
              padding: "24px",
              borderRadius: 24,
              boxShadow: "8px 8px 16px var(--neuo-dark), -8px -8px 16px var(--neuo-light)",
              textAlign: "center",
            }}
          >
            <p style={{ fontSize: 15, color: "rgba(44,44,44,0.6)", margin: 0 }}>
              No equipment logged. Scan your gym to get started.
            </p>
          </div>
        ) : (
          Object.entries(grouped).map(([cat, items]) => (
            <div key={cat} style={{ marginBottom: 20 }}>
              <p
                className="section-label"
                style={{ marginBottom: 10, paddingLeft: 4 }}
              >
                {CATEGORY_LABELS[cat] ?? cat}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {items.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "14px 16px",
                      borderRadius: 20,
                      boxShadow:
                        "6px 6px 12px var(--neuo-dark), -6px -6px 12px var(--neuo-light)",
                      background: "var(--neuo-bg)",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 15,
                        color: "#2c2c2c",
                        fontWeight: 500,
                        letterSpacing: "0.005em",
                      }}
                    >
                      {item.name}
                    </span>
                    <button
                      onClick={() => deleteItem(item.id)}
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: 12,
                        border: "none",
                        background: "var(--neuo-bg)",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow:
                          "3px 3px 6px var(--neuo-mid), -3px -3px 6px var(--neuo-light)",
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M18 6L6 18M6 6l12 12"
                          stroke="rgba(44,44,44,0.5)"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    );
  }

  // ── SCAN view ────────────────────────────────────────────
  if (step === "scan") {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          background: "var(--neuo-bg)",
          padding: "24px 20px 40px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
          <button
            onClick={() => setStep("list")}
            style={{
              width: 38,
              height: 38,
              borderRadius: 16,
              border: "none",
              background: "var(--neuo-bg)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "4px 4px 10px var(--neuo-mid), -4px -4px 10px var(--neuo-light)",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M19 12H5M12 5l-7 7 7 7"
                stroke="#2c2c2c"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <h1
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: "#2c2c2c",
              letterSpacing: "-0.02em",
              margin: 0,
            }}
          >
            Scan Equipment
          </h1>
        </div>

        {/* Image well */}
        <div
          onClick={() => fileInputRef.current?.click()}
          style={{
            flex: 1,
            borderRadius: 28,
            boxShadow: "inset 8px 8px 16px var(--neuo-dark), inset -8px -8px 16px var(--neuo-light)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            overflow: "hidden",
            marginBottom: 24,
            minHeight: 260,
            position: "relative",
          }}
        >
          {imagePreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imagePreview}
              alt="Equipment"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <div style={{ textAlign: "center" }}>
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                style={{ marginBottom: 12, opacity: 0.3 }}
              >
                <rect
                  x="2"
                  y="6"
                  width="20"
                  height="14"
                  rx="3"
                  stroke="#2c2c2c"
                  strokeWidth="1.5"
                />
                <circle cx="12" cy="13" r="3.5" stroke="#2c2c2c" strokeWidth="1.5" />
                <path
                  d="M8 6V5a2 2 0 012-2h4a2 2 0 012 2v1"
                  stroke="#2c2c2c"
                  strokeWidth="1.5"
                />
              </svg>
              <p
                style={{
                  fontSize: 14,
                  color: "rgba(44,44,44,0.4)",
                  margin: 0,
                  letterSpacing: "0.01em",
                }}
              >
                Tap to take a photo
              </p>
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          style={{ display: "none" }}
        />

        <button
          onClick={analyzeImage}
          disabled={!imageData || isAnalyzing}
          className="btn-primary"
        >
          {isAnalyzing ? "Analyzing..." : "Identify Equipment"}
        </button>
      </div>
    );
  }

  // ── CONFIRM view ─────────────────────────────────────────
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "var(--neuo-bg)",
        padding: "24px 20px 40px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
        <button
          onClick={() => setStep("scan")}
          style={{
            width: 38,
            height: 38,
            borderRadius: 16,
            border: "none",
            background: "var(--neuo-bg)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "4px 4px 10px var(--neuo-mid), -4px -4px 10px var(--neuo-light)",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d="M19 12H5M12 5l-7 7 7 7"
              stroke="#2c2c2c"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <div>
          <h1
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: "#2c2c2c",
              letterSpacing: "-0.02em",
              margin: 0,
            }}
          >
            Found Equipment
          </h1>
          <p
            style={{
              fontSize: 12,
              color: "rgba(44,44,44,0.5)",
              margin: "3px 0 0",
              letterSpacing: "0.02em",
              textTransform: "uppercase",
            }}
          >
            Select items to add
          </p>
        </div>
      </div>

      {scannedItems.length === 0 ? (
        <div
          style={{
            padding: "24px",
            borderRadius: 24,
            boxShadow: "8px 8px 16px var(--neuo-dark), -8px -8px 16px var(--neuo-light)",
            marginBottom: 24,
            textAlign: "center",
          }}
        >
          <p style={{ fontSize: 15, color: "rgba(44,44,44,0.6)", margin: 0 }}>
            No equipment identified in the image. Try a clearer photo.
          </p>
        </div>
      ) : (
        <div
          className="no-scrollbar"
          style={{ flex: 1, overflowY: "auto", marginBottom: 20 }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {scannedItems.map((item, i) => (
              <button
                key={i}
                onClick={() =>
                  setScannedItems((prev) =>
                    prev.map((x, j) => (j === i ? { ...x, selected: !x.selected } : x))
                  )
                }
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "14px 16px",
                  borderRadius: 20,
                  border: "none",
                  cursor: "pointer",
                  background: "var(--neuo-bg)",
                  boxShadow: item.selected
                    ? "inset 4px 4px 8px var(--neuo-mid), inset -4px -4px 8px var(--neuo-light)"
                    : "6px 6px 12px var(--neuo-dark), -6px -6px 12px var(--neuo-light)",
                  transition: "all 0.2s",
                  textAlign: "left",
                }}
              >
                {/* Checkbox */}
                <div
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 8,
                    background: item.selected ? "#007AFF" : "var(--neuo-bg)",
                    boxShadow: item.selected
                      ? "none"
                      : "inset 3px 3px 6px var(--neuo-mid), inset -3px -3px 6px var(--neuo-light)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    transition: "all 0.2s",
                  }}
                >
                  {item.selected && (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path
                        d="M2 6l3 3 5-5"
                        stroke="white"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </div>
                <div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 15,
                      fontWeight: 500,
                      color: "#2c2c2c",
                      letterSpacing: "0.005em",
                    }}
                  >
                    {item.name}
                  </p>
                  <p
                    style={{
                      margin: "2px 0 0",
                      fontSize: 12,
                      color: "rgba(44,44,44,0.5)",
                      letterSpacing: "0.02em",
                      textTransform: "uppercase",
                    }}
                  >
                    {CATEGORY_LABELS[item.category] ?? item.category}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={saveSelected}
        disabled={isSaving || scannedItems.filter((i) => i.selected).length === 0}
        className="btn-primary"
      >
        {isSaving
          ? "Saving..."
          : `Add ${scannedItems.filter((i) => i.selected).length} item${scannedItems.filter((i) => i.selected).length !== 1 ? "s" : ""}`}
      </button>
    </div>
  );
}
