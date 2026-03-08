"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Status = "idle" | "loading" | "success" | "error";

export default function GenerateNextPlanButton({ planId }: { planId: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleGenerate() {
    setStatus("loading");
    setErrorMsg("");
    try {
      const res = await fetch("/api/plans/generate-next", { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setErrorMsg(data.error ?? "Something went wrong. Please try again.");
        setStatus("error");
        return;
      }
      setStatus("success");
      setTimeout(() => router.refresh(), 800);
    } catch {
      setErrorMsg("Network error. Please try again.");
      setStatus("error");
    }
  }

  if (status === "loading") {
    return (
      <button
        className="btn-ghost w-full"
        disabled
        style={{ opacity: 0.6, cursor: "not-allowed" }}
      >
        <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
          <span className="dot-bounce" style={{ animationDelay: "0ms" }} />
          <span className="dot-bounce" style={{ animationDelay: "160ms" }} />
          <span className="dot-bounce" style={{ animationDelay: "320ms" }} />
        </span>
      </button>
    );
  }

  if (status === "success") {
    return (
      <button className="btn-ghost w-full" disabled style={{ opacity: 0.6 }}>
        Plan ready
      </button>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <button
        className="btn-ghost w-full"
        onClick={handleGenerate}
        data-plan-id={planId}
      >
        Next Week&apos;s Plan
      </button>
      {status === "error" && errorMsg && (
        <p
          style={{
            fontSize: "0.8125rem",
            color: "#FF3B30",
            textAlign: "center",
            margin: 0,
          }}
        >
          {errorMsg}
        </p>
      )}
    </div>
  );
}
