"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  {
    href: "/",
    label: "Home",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M3 9.5L12 3L21 9.5V20C21 20.55 20.55 21 20 21H15V15H9V21H4C3.45 21 3 20.55 3 20V9.5Z"
          fill={active ? "#007AFF" : "none"}
          stroke={active ? "#007AFF" : "rgba(44,44,44,0.35)"}
          strokeWidth="1.75"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    href: "/workout",
    label: "Train",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        {/* Dumbbell */}
        <path
          d="M6 9H4a1 1 0 00-1 1v4a1 1 0 001 1h2M18 9h2a1 1 0 011 1v4a1 1 0 01-1 1h-2M6 12h12M8 8v8M16 8v8"
          stroke={active ? "#007AFF" : "rgba(44,44,44,0.35)"}
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    href: "/nutrition",
    label: "Food",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        {/* Fork */}
        <path
          d="M7 3v4M9 3v4M8 7v13M7 7c0 1.5 2 1.5 2 0"
          stroke={active ? "#007AFF" : "rgba(44,44,44,0.35)"}
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Knife */}
        <path
          d="M16 3c2 0 3 2 3 5v13M16 3v18"
          stroke={active ? "#007AFF" : "rgba(44,44,44,0.35)"}
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    href: "/advisor",
    label: "Advisor",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z"
          fill={active ? "rgba(0,122,255,0.15)" : "none"}
          stroke={active ? "#007AFF" : "rgba(44,44,44,0.35)"}
          strokeWidth="1.75"
          strokeLinejoin="round"
        />
        <path
          d="M8 9H16M8 13H13"
          stroke={active ? "#007AFF" : "rgba(44,44,44,0.35)"}
          strokeWidth="1.75"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 pb-safe z-50 px-4" aria-label="Main navigation">
      <div
        className="relative flex items-center justify-around rounded-3xl mx-auto max-w-sm mb-3 px-2 py-2"
        style={{
          backgroundColor: "var(--neuo-bg)",
          boxShadow: "-4px -4px 10px var(--neuo-light), 4px 4px 12px var(--neuo-dark)",
        }}
      >
        {NAV_ITEMS.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              aria-current={active ? "page" : undefined}
              className="relative flex flex-col items-center justify-center gap-0.5 px-4 py-2 rounded-2xl transition-colors duration-200"
            >
              {active && (
                <motion.div
                  layoutId="nav-pill"
                  className="absolute inset-0 rounded-2xl"
                  style={{
                    boxShadow: "inset 3px 3px 6px var(--neuo-dark), inset -3px -3px 6px var(--neuo-light)",
                    backgroundColor: "var(--neuo-bg)",
                  }}
                  transition={{ type: "spring", stiffness: 380, damping: 34 }}
                />
              )}
              <span className="relative z-10">{item.icon(active)}</span>
              <span
                className={cn(
                  "relative z-10 transition-colors duration-150",
                  active ? "text-action" : "text-text-tertiary"
                )}
                style={{ fontSize: "10px", lineHeight: 1, letterSpacing: "0.02em" }}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
