import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

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
          background:
            "linear-gradient(135deg, #e8c547 0%, #d4af37 50%, #b8942e 100%)",
          borderRadius: 36,
          fontSize: 96,
          fontWeight: 700,
          color: "#050505",
          fontFamily: "Georgia, serif",
        }}
      >
        A
      </div>
    ),
    { ...size },
  );
}
