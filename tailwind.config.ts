import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Design Language System — monochrome + one action color
        action: "#007AFF",
        "action-dim": "rgba(0,122,255,0.15)",
        surface: {
          DEFAULT: "#000000",
          secondary: "#0A0A0A",
          tertiary: "#111111",
          overlay: "rgba(0,0,0,0.6)",
        },
        border: {
          DEFAULT: "rgba(255,255,255,0.08)",
          strong: "rgba(255,255,255,0.16)",
        },
        text: {
          primary: "#FFFFFF",
          secondary: "rgba(255,255,255,0.55)",
          tertiary: "rgba(255,255,255,0.3)",
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
        "body":    ["16px", { lineHeight: "1.5",  fontWeight: "400" }],
        "label":   ["13px", { lineHeight: "1.4",  fontWeight: "500", letterSpacing: "0.01em" }],
        "caption": ["11px", { lineHeight: "1.4",  fontWeight: "400", letterSpacing: "0.02em" }],
      },
      borderRadius: {
        "2xl": "16px",
        "3xl": "24px",
        "4xl": "32px",
      },
      backdropBlur: {
        xs: "4px",
        sm: "8px",
        md: "16px",   // SystemThinMaterial equivalent
        lg: "32px",
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
