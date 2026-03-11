import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "32px",
          height: "32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f0f0f0",
          borderRadius: "8px",
        }}
      >
        <div
          style={{
            width: "28px",
            height: "28px",
            borderRadius: "7px",
            backgroundColor: "#f0f0f0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "3px 3px 6px #d0d0d0, -3px -3px 6px #ffffff",
          }}
        >
          <div
            style={{
              fontSize: "16px",
              fontWeight: "800",
              color: "#b0b0b0",
              letterSpacing: "-0.03em",
              lineHeight: 1,
              textShadow: "1px 1px 2px #d0d0d0, -1px -1px 2px #ffffff",
            }}
          >
            F
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
