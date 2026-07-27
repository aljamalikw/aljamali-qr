"use client";

import { useRef, useState } from "react";
import { uploadMenuItemImage } from "@/lib/menu-items/uploadMenuItemImage";

interface MenuItemImageFieldProps {
  value: string;
  onChange: (url: string) => void;
  disabled?: boolean;
}

export function MenuItemImageField({
  value,
  onChange,
  disabled = false,
}: MenuItemImageFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileChange = async (file: File | undefined) => {
    if (!file) return;

    setUploading(true);
    setUploadError(null);

    const result = await uploadMenuItemImage(file);

    setUploading(false);

    if (!result.ok) {
      setUploadError(result.message);
      return;
    }

    onChange(result.url);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <div>
      <label className="mb-1.5 block text-xs uppercase tracking-wider text-white/45">
        Image
      </label>
      <div className="flex items-start gap-4">
        {value.trim() ? (
          <img
            src={value}
            alt="Menu item preview"
            className="h-20 w-20 shrink-0 rounded-lg border border-gold/15 object-cover"
          />
        ) : (
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg border border-dashed border-gold/20 bg-black/20 text-[10px] uppercase tracking-wider text-white/30">
            No image
          </div>
        )}
        <div className="min-w-0 flex-1 space-y-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(event) => handleFileChange(event.target.files?.[0])}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={disabled || uploading}
            className="menu-btn-secondary w-full text-xs disabled:opacity-60"
          >
            {uploading ? "Uploading..." : value.trim() ? "Replace Image" : "Choose Image"}
          </button>
          {uploadError && (
            <p className="text-xs text-red-400" role="alert">
              {uploadError}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
