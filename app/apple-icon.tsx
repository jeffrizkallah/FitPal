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
          borderRadius: "40px",
          boxShadow:
            "inset 8px 8px 16px #d0d0d0, inset -8px -8px 16px #ffffff",
        }}
      >
        <svg width="100" height="115" viewBox="0 0 100 115" fill="none">
          {/* Vertical stroke */}
          <line x1="18" y1="10" x2="18" y2="105"
            stroke="#a8a8a8" strokeWidth="14" strokeLinecap="round" />
          {/* Top horizontal bar */}
          <line x1="18" y1="10" x2="82" y2="10"
            stroke="#a8a8a8" strokeWidth="14" strokeLinecap="round" />
          {/* Middle horizontal bar */}
          <line x1="18" y1="55" x2="66" y2="55"
            stroke="#a8a8a8" strokeWidth="14" strokeLinecap="round" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
