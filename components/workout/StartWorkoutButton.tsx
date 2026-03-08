"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function StartWorkoutButton({ planId }: { planId?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleStart() {
    setLoading(true);
    try {
      const res = await fetch("/api/workouts/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });
      const data = await res.json();
      router.push(`/workout/active?sessionId=${data.sessionId}`);
    } catch {
      setLoading(false);
    }
  }

  return (
    <button
      className="btn-primary w-full"
      onClick={handleStart}
      disabled={loading}
    >
      {loading ? "Starting..." : "Start Workout"}
    </button>
  );
}
