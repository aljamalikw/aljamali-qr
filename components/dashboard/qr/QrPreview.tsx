"use client";

import { QRCodeSVG } from "qrcode.react";

interface QrPreviewProps {
  value: string;
  size?: number;
  className?: string;
}

export function QrPreview({ value, size = 48, className = "" }: QrPreviewProps) {
  return (
    <div
      className={`flex items-center justify-center overflow-hidden rounded-lg bg-white p-1 ${className}`}
    >
      <QRCodeSVG
        value={value}
        size={size}
        level="M"
        bgColor="#ffffff"
        fgColor="#050505"
        includeMargin={false}
      />
    </div>
  );
}
