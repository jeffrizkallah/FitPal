"use client";

import { useEffect } from "react";

export default function PwaInstaller() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // SW registration failed — app still works, just without offline support
      });
    }
  }, []);

  return null;
}
