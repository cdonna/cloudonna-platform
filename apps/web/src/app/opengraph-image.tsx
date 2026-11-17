import { ImageResponse } from "next/og";

export const alt = "ClouDonna — Enterprise Decision Intelligence";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Website Perfection & SEO Release Gate (brief §14): the generic
 * blue/violet palette here (#2563eb/#7c3aed) didn't match the actual
 * brand at all — the real editorial design system
 * (src/app/globals.css's --ed-* tokens) is deep emerald (#075e4b),
 * graphite ink (#07110e) and a restrained gold accent (#8a6b2a /
 * #d4af67), on warm paper (#f5f7f4). This is the one image every
 * LinkedIn/social share of any ClouDonna page falls back to (no
 * per-page override exists), so it is worth getting the brand right
 * once here rather than per page.
 */
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
          background: "#f5f7f4",
        }}
      >
        <div style={{ display: "flex", width: 56, height: 4, background: "#8a6b2a", marginBottom: 36 }} />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            fontSize: 30,
            fontWeight: 600,
            color: "#07110e",
            letterSpacing: "-0.02em",
          }}
        >
          <div
            style={{
              display: "flex",
              width: 48,
              height: 48,
              borderRadius: 12,
              background: "#075e4b",
            }}
          />
          Clou<span style={{ color: "#075e4b" }}>Donna</span>
        </div>

        <div
          style={{
            display: "flex",
            marginTop: 56,
            fontSize: 62,
            fontWeight: 600,
            lineHeight: 1.1,
            letterSpacing: "-0.03em",
            color: "#07110e",
            maxWidth: 920,
          }}
        >
          Enterprise Decision Intelligence
        </div>

        <div
          style={{
            display: "flex",
            marginTop: 28,
            fontSize: 26,
            color: "#3f4a45",
            maxWidth: 820,
          }}
        >
          Evidence-backed, vendor-neutral technology decisions — from business goal to executive recommendation.
        </div>
      </div>
    ),
    { ...size },
  );
}
