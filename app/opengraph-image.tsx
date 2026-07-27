import { ImageResponse } from "next/og";

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
          alignItems: "center",
          justifyContent: "center",
          background: "#050505",
          backgroundImage:
            "radial-gradient(circle at 50% 0%, rgba(212,175,55,0.16) 0%, transparent 55%)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 96,
            height: 96,
            borderRadius: 24,
            background:
              "linear-gradient(135deg, #e8c547 0%, #d4af37 50%, #b8942e 100%)",
            fontSize: 48,
            fontWeight: 700,
            color: "#050505",
            fontFamily: "Georgia, serif",
            marginBottom: 32,
          }}
        >
          A
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 64,
            fontWeight: 700,
            color: "#f5f5f5",
            fontFamily: "Georgia, serif",
          }}
        >
          Aljamali&nbsp;
          <span style={{ color: "#d4af37" }}>QR</span>
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 20,
            fontSize: 26,
            color: "rgba(245,245,245,0.6)",
            fontFamily: "Arial, sans-serif",
          }}
        >
          Premium Digital QR Menus for Restaurants
        </div>
      </div>
    ),
    { ...size },
  );
}
