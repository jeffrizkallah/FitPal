import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      // Outer: plain bg — satori can't render box-shadow on the root element
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
        {/* Inner: 174x174 — gap (3px each side) hidden by iOS rounded corners */}
        <div
          style={{
            width: "174px",
            height: "174px",
            borderRadius: "38px",
            backgroundColor: "#f0f0f0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow:
              "inset 5px 5px 10px #c4c4c4, inset -5px -5px 10px #ffffff",
          }}
        >
          <svg width="100" height="115" viewBox="0 0 100 115" fill="none">
            {/* Vertical stroke */}
            <line x1="18" y1="10" x2="18" y2="105"
              stroke="#a8a8a8" strokeWidth="18" strokeLinecap="round" />
            {/* Top horizontal bar */}
            <line x1="18" y1="10" x2="82" y2="10"
              stroke="#a8a8a8" strokeWidth="18" strokeLinecap="round" />
            {/* Middle horizontal bar */}
            <line x1="18" y1="55" x2="66" y2="55"
              stroke="#a8a8a8" strokeWidth="18" strokeLinecap="round" />
          </svg>
        </div>
      </div>
    ),
    { ...size }
  );
}
