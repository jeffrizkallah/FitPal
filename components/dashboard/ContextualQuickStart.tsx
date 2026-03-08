"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type AppContext = "gym" | "mealtime" | "recovery" | "default";

interface Props {
  lastSessionMin: number;
  mealLogged: boolean;
  hasActivity?: boolean;
}

const iconWellStyle: React.CSSProperties = {
  backgroundColor: "var(--neuo-bg)",
  boxShadow: "inset 2px 2px 5px var(--neuo-dark), inset -2px -2px 5px var(--neuo-light)",
};

// Haversine distance in metres
function getDistanceM(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getTimeContext(): AppContext {
  const h = new Date().getHours();
  const m = new Date().getMinutes();
  const mins = h * 60 + m;
  // Lunch window: 11:30–14:30 | Dinner window: 17:30–20:30
  if ((mins >= 690 && mins <= 870) || (mins >= 1050 && mins <= 1230)) return "mealtime";
  // Late night / early morning: 21:00–05:30
  if (mins >= 1260 || mins <= 330) return "recovery";
  return "default";
}

const CONTEXT_META: Record<
  AppContext,
  { label: string; message: string; accent: string }
> = {
  gym: {
    label: "Gym Mode",
    message: "You're at the gym.",
    accent: "#007AFF",
  },
  mealtime: {
    label: "Fuel Mode",
    message: "Time to refuel.",
    accent: "#34C759",
  },
  recovery: {
    label: "Recovery",
    message: "Rest and recover.",
    accent: "#AF52DE",
  },
  default: {
    label: "",
    message: "",
    accent: "#007AFF",
  },
};

interface Action {
  href: string;
  label: string;
  sub: string;
  icon: React.ReactNode;
}

export default function ContextualQuickStart({ lastSessionMin, mealLogged, hasActivity = false }: Props) {
  const [context, setContext] = useState<AppContext>("default");

  // Icons
  const workoutIcon = (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M8 5L19 12L8 19V5Z" fill="#007AFF" />
    </svg>
  );
  const mealIcon = (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="#34C759" strokeWidth="1.75" />
      <path d="M12 8V12L15 14" stroke="#34C759" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
  const advisorIcon = (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M20 2H4C2.9 2 2 2.9 2 4V16C2 17.1 2.9 18 4 18H8L12 22L16 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z"
        stroke="#AF52DE"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </svg>
  );

  const allActions: Record<string, Action> = {
    workout: {
      href: "/workout",
      label: "Start Workout",
      sub: lastSessionMin > 0 ? `Last session: ${lastSessionMin} min` : "No session today",
      icon: workoutIcon,
    },
    meal: {
      href: "/nutrition",
      label: "Log a Meal",
      sub: mealLogged ? "Today: Logged" : "Today: Not logged",
      icon: mealIcon,
    },
    advisor: {
      href: "/advisor",
      label: "Ask Advisor",
      sub: "How are you feeling today?",
      icon: advisorIcon,
    },
  };

  const contextOrder: Record<AppContext, string[]> = {
    gym: ["workout", "advisor", "meal"],
    mealtime: ["meal", "advisor", "workout"],
    recovery: ["advisor", "meal", "workout"],
    default: ["workout", "meal", "advisor"],
  };

  useEffect(() => {
    if (!navigator.geolocation) {
      const tc = getTimeContext();
      setContext(tc === "recovery" && !hasActivity ? "default" : tc);
      return;
    }

    // Fetch saved gym coords to determine context
    fetch("/api/context")
      .then((r) => r.json())
      .then(({ gymLatitude, gymLongitude }: { gymLatitude: number | null; gymLongitude: number | null }) => {
        if (gymLatitude === null || gymLongitude === null) {
          const tc = getTimeContext();
          setContext(tc === "recovery" && !hasActivity ? "default" : tc);
          return;
        }

        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const dist = getDistanceM(
              pos.coords.latitude,
              pos.coords.longitude,
              gymLatitude,
              gymLongitude
            );
            const tc = dist <= 250 ? "gym" : getTimeContext();
            setContext(tc === "recovery" && !hasActivity ? "default" : tc);
          },
          () => {
            const tc = getTimeContext();
            setContext(tc === "recovery" && !hasActivity ? "default" : tc);
          },
          { timeout: 6000, maximumAge: 60000 }
        );
      })
      .catch(() => setContext(getTimeContext()));
  }, []);

  const meta = CONTEXT_META[context];
  const orderedActions = contextOrder[context].map((key) => allActions[key]);

  return (
    <div className="flex flex-col gap-4 mt-2">
      {/* Context mode banner (only shown if not default) */}
      {context !== "default" && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 16px",
            borderRadius: 20,
            background: "var(--neuo-bg)",
            boxShadow: "4px 4px 10px var(--neuo-mid), -4px -4px 10px var(--neuo-light)",
          }}
        >
          <div>
            <p
              style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: meta.accent,
                margin: 0,
              }}
            >
              {meta.label}
            </p>
            <p
              style={{
                fontSize: 13,
                color: "#2c2c2c",
                margin: 0,
                marginTop: 1,
                letterSpacing: "0.005em",
              }}
            >
              {meta.message}
            </p>
          </div>
        </div>
      )}

      {/* Quick start label */}
      <p className="section-label mt-2 mb-1">Quick Start</p>

      {/* Context-ordered quick actions */}
      {orderedActions.map((action) => (
        <Link
          key={action.href}
          href={action.href}
          className="glass flex items-center justify-between px-5 py-5 transition-all duration-200 active:shadow-[inset_6px_6px_12px_#d0d0d0,inset_-6px_-6px_12px_#ffffff]"
        >
          <div>
            <p className="text-body font-semibold">{action.label}</p>
            <p className="text-label text-text-secondary mt-0.5">{action.sub}</p>
          </div>
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center"
            style={iconWellStyle}
          >
            {action.icon}
          </div>
        </Link>
      ))}
    </div>
  );
}
