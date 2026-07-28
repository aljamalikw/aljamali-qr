import { uploadMenuItemImage } from "@/lib/menu-items/uploadMenuItemImage";

/**
 * Uploads a branding asset (logo, cover, favicon) during onboarding.
 * Reuses the existing restaurant-scoped storage bucket/upload pipeline.
 */
export async function uploadBrandingAsset(
  file: File,
): Promise<{ ok: true; url: string } | { ok: false; message: string }> {
  return uploadMenuItemImage(file);
}
