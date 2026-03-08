"use client";

import { useEffect, useState } from "react";

type GymState = "loading" | "unset" | "saving" | "saved" | "denied";

export default function GymLocationButton() {
  const [state, setState] = useState<GymState>("loading");

  useEffect(() => {
    fetch("/api/context")
      .then((r) => r.json())
      .then(({ gymLatitude }: { gymLatitude: number | null }) => {
        setState(gymLatitude !== null ? "saved" : "unset");
      })
      .catch(() => setState("unset"));
  }, []);

  function handleSave() {
    if (!navigator.geolocation) return;
    setState("saving");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        await fetch("/api/context", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          }),
        });
        setState("saved");
      },
      () => setState("denied"),
      { timeout: 8000 }
    );
  }

  const isLoading = state === "loading" || state === "saving";

  return (
    <button
      onClick={handleSave}
      disabled={isLoading}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
        padding: "14px 16px",
        borderRadius: 20,
        background: "var(--neuo-bg)",
        boxShadow:
          state === "saved"
            ? "inset 4px 4px 8px var(--neuo-mid), inset -4px -4px 8px var(--neuo-light)"
            : "4px 4px 10px var(--neuo-mid), -4px -4px 10px var(--neuo-light)",
        border: "none",
        cursor: isLoading ? "default" : "pointer",
        textAlign: "left",
        opacity: isLoading ? 0.6 : 1,
        transition: "box-shadow 0.2s, opacity 0.2s",
      }}
    >
      <div>
        <p
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: "#2c2c2c",
            margin: 0,
            letterSpacing: "0.005em",
          }}
        >
          Gym Location
        </p>
        <p
          style={{
            fontSize: 12,
            color:
              state === "saved"
                ? "#34C759"
                : state === "denied"
                ? "#e53e3e"
                : "rgba(44,44,44,0.45)",
            margin: 0,
            marginTop: 2,
            letterSpacing: "0.005em",
          }}
        >
          {state === "loading"  && "Checking…"}
          {state === "unset"    && "Tap to save your gym's location"}
          {state === "saving"   && "Saving location…"}
          {state === "saved"    && "Location saved. Tap to update."}
          {state === "denied"   && "Location access denied"}
        </p>
      </div>

      {/* Pin icon */}
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        style={{ flexShrink: 0, opacity: state === "denied" ? 0.3 : 1 }}
      >
        <circle cx="12" cy="10" r="3" fill={state === "saved" ? "#34C759" : "#007AFF"} />
        <path
          d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7Z"
          stroke={state === "saved" ? "#34C759" : "#007AFF"}
          strokeWidth="1.75"
        />
      </svg>
    </button>
  );
}
