"use client";

import { useRef } from "react";
import Image from "next/image";
import { SettingsField } from "./SettingsSection";

interface SettingsImageUploadProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  aspect?: "square" | "wide";
  hint?: string;
}

export function SettingsImageUpload({
  label,
  value,
  onChange,
  aspect = "square",
  hint,
}: SettingsImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") onChange(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const heightClass = aspect === "wide" ? "h-36 sm:h-44" : "h-32 w-32";

  return (
    <SettingsField label={label} hint={hint}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={`group relative overflow-hidden rounded-2xl border-2 border-dashed border-gold/20 bg-black/20 transition-all duration-300 hover:border-gold/40 hover:bg-gold/[0.03] ${
          aspect === "wide" ? "w-full" : "inline-block"
        } ${heightClass}`}
      >
        {value ? (
          <>
            <Image
              src={value}
              alt={label}
              fill
              className="object-cover"
              unoptimized={value.startsWith("data:")}
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
              <span className="text-sm font-medium text-white">Change image</span>
            </div>
          </>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center px-4 text-center">
            <span className="text-2xl text-gold/40">📷</span>
            <p className="mt-2 text-xs text-white/45">Click to upload</p>
          </div>
        )}
      </button>
    </SettingsField>
  );
}
