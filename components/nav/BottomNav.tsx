"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  {
    href: "/",
    label: "Home",
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d="M3 9.5L12 3L21 9.5V20C21 20.55 20.55 21 20 21H15V15H9V21H4C3.45 21 3 20.55 3 20V9.5Z"
          fill={active ? "#007AFF" : "none"}
          stroke={active ? "#007AFF" : "rgba(255,255,255,0.45)"}
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
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d="M6 4V20M18 4V20M3 12H6M18 12H21M6 7H18M6 17H18"
          stroke={active ? "#007AFF" : "rgba(255,255,255,0.45)"}
          strokeWidth="1.75"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    href: "/nutrition",
    label: "Fuel",
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d="M12 3C8.13 3 5 7.03 5 12C5 16.97 8.13 21 12 21C15.87 21 19 16.97 19 12C19 7.03 15.87 3 12 3Z"
          stroke={active ? "#007AFF" : "rgba(255,255,255,0.45)"}
          strokeWidth="1.75"
        />
        <path
          d="M12 8V12L15 14"
          stroke={active ? "#007AFF" : "rgba(255,255,255,0.45)"}
          strokeWidth="1.75"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    href: "/advisor",
    label: "Advisor",
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z"
          fill={active ? "rgba(0,122,255,0.2)" : "none"}
          stroke={active ? "#007AFF" : "rgba(255,255,255,0.45)"}
          strokeWidth="1.75"
          strokeLinejoin="round"
        />
        <path
          d="M8 9H16M8 13H13"
          stroke={active ? "#007AFF" : "rgba(255,255,255,0.45)"}
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
    <nav className="fixed bottom-0 left-0 right-0 pb-safe z-50">
      {/* Blur backdrop */}
      <div className="absolute inset-0 bg-surface/80 backdrop-blur-md border-t border-border" />

      <div className="relative flex items-center justify-around px-2 h-16">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center gap-1 w-16 h-full"
            >
              {item.icon(active)}
              <span
                className={cn(
                  "text-caption transition-colors duration-150",
                  active ? "text-action" : "text-text-tertiary"
                )}
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
