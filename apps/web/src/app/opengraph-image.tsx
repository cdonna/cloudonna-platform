import { ImageResponse } from "next/og";

export const alt = "ClouDonna — Enterprise Decision Intelligence";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "linear-gradient(135deg, #eef2ff 0%, #ffffff 55%, #f5f3ff 100%)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            fontSize: 30,
            fontWeight: 600,
            color: "#0f172a",
            letterSpacing: "-0.02em",
          }}
        >
          <div
            style={{
              display: "flex",
              width: 52,
              height: 52,
              borderRadius: 16,
              background: "linear-gradient(135deg, #2563eb, #7c3aed)",
            }}
          />
          Clou<span style={{ color: "#7c3aed" }}>Donna</span>
        </div>

        <div
          style={{
            display: "flex",
            marginTop: 56,
            fontSize: 64,
            fontWeight: 600,
            lineHeight: 1.08,
            letterSpacing: "-0.03em",
            color: "#0f172a",
            maxWidth: 920,
          }}
        >
          The Independent Enterprise Decision Intelligence Platform
        </div>

        <div
          style={{
            display: "flex",
            marginTop: 28,
            fontSize: 26,
            color: "#475569",
            maxWidth: 820,
          }}
        >
          Evidence-based technology decisions, from business goal to executive report.
        </div>
      </div>
    ),
    { ...size },
  );
}
