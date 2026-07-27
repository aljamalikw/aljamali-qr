import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow LAN IP access during `next dev` so React can hydrate when
  // opening the menu via http://192.168.x.x:3000 (QR / phone testing).
  // Without this, Next blocks cross-origin dev resources and clicks never fire.
  allowedDevOrigins: ["192.168.8.119"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
