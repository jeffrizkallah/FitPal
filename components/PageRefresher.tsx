"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Drop this into any server-component page to force a fresh data fetch
 * whenever the tab/app becomes visible (e.g. after navigating back).
 * Fixes Next.js router cache serving stale data between page visits.
 */
export default function PageRefresher() {
  const router = useRouter();

  useEffect(() => {
    // Refresh on mount so navigating back always shows fresh data
    router.refresh();

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        router.refresh();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [router]);

  return null;
}
