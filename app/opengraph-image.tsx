import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  const logoData = await readFile(
    join(process.cwd(), "public/images/aljamali-qr-logo.png"),
  );
  const logoSrc = `data:image/png;base64,${logoData.toString("base64")}`;

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
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoSrc}
          alt=""
          width={560}
          height={188}
          style={{
            objectFit: "contain",
            marginBottom: 28,
          }}
        />
        <div
          style={{
            display: "flex",
            marginTop: 8,
            fontSize: 26,
            color: "rgba(245,245,245,0.6)",
            fontFamily: "Arial, sans-serif",
          }}
        >
          Complete Digital Solutions for Restaurants
        </div>
      </div>
    ),
    { ...size },
  );
}
