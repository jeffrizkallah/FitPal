import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  // Each stroke is drawn in 3 layers to create a neumorphic groove/carved effect:
  // 1. Shadow layer  — offset bottom-right, dark
  // 2. Highlight layer — offset top-left, white
  // 3. Main layer — sits between them, surface grey
  // Result: line looks pressed/carved into the #f0f0f0 surface

  const strokeWidth = 16;
  const shadowColor = "#b8b8b8";
  const highlightColor = "#ffffff";
  const mainColor = "#d4d4d4";
  const offset = 1.5;

  // F geometry — large, centered in 180x180
  const x0 = 46;          // left edge of vertical stroke
  const yTop = 30;        // top of F
  const yBottom = 150;    // bottom of F
  const xRight = 140;     // right end of top bar
  const xMidRight = 118;  // right end of mid bar
  const yMid = 88;        // height of middle bar

  return new ImageResponse(
    (
      <div
        style={{
          width: "180px",
          height: "180px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f0f0f0",
        }}
      >
        <svg width="180" height="180" viewBox="0 0 180 180" fill="none">
          {/* ── VERTICAL STROKE ── */}
          {/* shadow */}
          <line x1={x0 + offset} y1={yTop + offset} x2={x0 + offset} y2={yBottom + offset}
            stroke={shadowColor} strokeWidth={strokeWidth + 2} strokeLinecap="round" />
          {/* highlight */}
          <line x1={x0 - offset} y1={yTop - offset} x2={x0 - offset} y2={yBottom - offset}
            stroke={highlightColor} strokeWidth={strokeWidth + 2} strokeLinecap="round" />
          {/* main */}
          <line x1={x0} y1={yTop} x2={x0} y2={yBottom}
            stroke={mainColor} strokeWidth={strokeWidth} strokeLinecap="round" />

          {/* ── TOP HORIZONTAL BAR ── */}
          {/* shadow */}
          <line x1={x0 + offset} y1={yTop + offset} x2={xRight + offset} y2={yTop + offset}
            stroke={shadowColor} strokeWidth={strokeWidth + 2} strokeLinecap="round" />
          {/* highlight */}
          <line x1={x0 - offset} y1={yTop - offset} x2={xRight - offset} y2={yTop - offset}
            stroke={highlightColor} strokeWidth={strokeWidth + 2} strokeLinecap="round" />
          {/* main */}
          <line x1={x0} y1={yTop} x2={xRight} y2={yTop}
            stroke={mainColor} strokeWidth={strokeWidth} strokeLinecap="round" />

          {/* ── MIDDLE HORIZONTAL BAR ── */}
          {/* shadow */}
          <line x1={x0 + offset} y1={yMid + offset} x2={xMidRight + offset} y2={yMid + offset}
            stroke={shadowColor} strokeWidth={strokeWidth + 2} strokeLinecap="round" />
          {/* highlight */}
          <line x1={x0 - offset} y1={yMid - offset} x2={xMidRight - offset} y2={yMid - offset}
            stroke={highlightColor} strokeWidth={strokeWidth + 2} strokeLinecap="round" />
          {/* main */}
          <line x1={x0} y1={yMid} x2={xMidRight} y2={yMid}
            stroke={mainColor} strokeWidth={strokeWidth} strokeLinecap="round" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
