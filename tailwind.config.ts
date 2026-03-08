import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Design Language System — Neumorphic palette + one action color
        action: "#007AFF",
        "action-dim": "rgba(0,122,255,0.12)",
        surface: {
          DEFAULT: "#f0f0f0",
          secondary: "#f5f5f5",
          tertiary: "#e8e8e8",
          overlay: "rgba(0,0,0,0.12)",
        },
        neuo: {
          bg:    "#f0f0f0",
          light: "#ffffff",
          dark:  "#d0d0d0",
          mid:   "#d8d8d8",
        },
        text: {
          primary: "#2c2c2c",
          secondary: "rgba(44,44,44,0.55)",
          tertiary: "rgba(44,44,44,0.35)",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "San Francisco",
          "Segoe UI",
          "sans-serif",
        ],
      },
      fontSize: {
        "display": ["48px", { lineHeight: "1.05", fontWeight: "700", letterSpacing: "-0.03em" }],
        "title":   ["28px", { lineHeight: "1.15", fontWeight: "700", letterSpacing: "-0.02em" }],
        "heading": ["20px", { lineHeight: "1.3",  fontWeight: "600", letterSpacing: "-0.01em" }],
        "body":    ["16px", { lineHeight: "1.5",  fontWeight: "400", letterSpacing: "0.005em" }],
        "label":   ["13px", { lineHeight: "1.4",  fontWeight: "500", letterSpacing: "0.02em" }],
        "caption": ["11px", { lineHeight: "1.4",  fontWeight: "400", letterSpacing: "0.04em" }],
      },
      borderRadius: {
        "2xl": "16px",
        "3xl": "24px",
        "4xl": "32px",
      },
      boxShadow: {
        // Neumorphic raised — main surface
        "neuo":         "8px 8px 16px #d0d0d0, -8px -8px 16px #ffffff",
        "neuo-sm":      "4px 4px 10px #d8d8d8, -4px -4px 10px #ffffff",
        "neuo-xs":      "2px 2px 6px #d4d4d4, -2px -2px 6px #ffffff",
        // Neumorphic inset — pressed/input state
        "neuo-inset":   "inset 8px 8px 16px #d0d0d0, inset -8px -8px 16px #ffffff",
        "neuo-inset-sm":"inset 5px 5px 10px #d8d8d8, inset -5px -5px 10px #ffffff",
        "neuo-inset-xs":"inset 3px 3px 7px #d4d4d4, inset -3px -3px 7px #ffffff",
        // Action button (raised with colored tint depth)
        "neuo-action":  "6px 6px 14px rgba(0,0,0,0.12), -3px -3px 10px rgba(255,255,255,0.7)",
        "neuo-action-pressed": "inset 4px 4px 8px rgba(0,0,0,0.18), inset -2px -2px 6px rgba(255,255,255,0.2)",
        // Nav bar top shadow
        "neuo-nav":     "-4px -4px 12px #ffffff, 0px -2px 8px #d8d8d8",
      },
      animation: {
        "fade-in":   "fadeIn 0.2s ease-out",
        "slide-up":  "slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
        "scale-in":  "scaleIn 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
      keyframes: {
        fadeIn:  { from: { opacity: "0" }, to: { opacity: "1" } },
        slideUp: { from: { opacity: "0", transform: "translateY(16px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        scaleIn: { from: { opacity: "0", transform: "scale(0.95)" }, to: { opacity: "1", transform: "scale(1)" } },
      },
    },
  },
  plugins: [],
};

export default config;
