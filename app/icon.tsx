import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/** Compact AJ mark for browser favicon. */
export default function Icon() {
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
          borderRadius: 6,
          fontSize: 14,
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
