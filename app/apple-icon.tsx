import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Compact AJ mark for Apple touch icon. */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#050505",
          borderRadius: 36,
          border: "4px solid #d4af37",
          fontSize: 72,
          fontWeight: 700,
          color: "#d4af37",
          fontFamily: "Georgia, serif",
          letterSpacing: "-0.04em",
        }}
      >
        AJ
      </div>
    ),
    { ...size },
  );
}
