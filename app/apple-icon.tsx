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
        {/* Raised neumorphic well — like the meal icon squares */}
        <div
          style={{
            width: "130px",
            height: "130px",
            borderRadius: "32px",
            backgroundColor: "#f0f0f0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow:
              "8px 8px 16px #d0d0d0, -8px -8px 16px #ffffff",
          }}
        >
          {/* Engraved F — inset neumorphic like the dashboard progress lines */}
          <div
            style={{
              fontSize: "72px",
              fontWeight: "800",
              color: "#b0b0b0",
              letterSpacing: "-0.03em",
              lineHeight: 1,
              textShadow:
                "2px 2px 4px #d0d0d0, -1px -1px 3px #ffffff",
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
