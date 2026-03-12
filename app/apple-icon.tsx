import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
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
        {/* Inset neumorphic well — pressed in, close to icon edges */}
        <div
          style={{
            width: "158px",
            height: "158px",
            borderRadius: "36px",
            backgroundColor: "#f0f0f0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow:
              "inset 8px 8px 16px #d0d0d0, inset -8px -8px 16px #ffffff",
          }}
        >
          {/* F drawn as SVG strokes with rounded caps — no squared-off terminals */}
          <svg
            width="80"
            height="95"
            viewBox="0 0 80 95"
            fill="none"
          >
            {/* Vertical stroke */}
            <line
              x1="18"
              y1="10"
              x2="18"
              y2="85"
              stroke="#a8a8a8"
              strokeWidth="14"
              strokeLinecap="round"
            />
            {/* Top horizontal bar */}
            <line
              x1="18"
              y1="10"
              x2="68"
              y2="10"
              stroke="#a8a8a8"
              strokeWidth="14"
              strokeLinecap="round"
            />
            {/* Middle horizontal bar (slightly shorter) */}
            <line
              x1="18"
              y1="48"
              x2="56"
              y2="48"
              stroke="#a8a8a8"
              strokeWidth="14"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>
    ),
    { ...size }
  );
}
