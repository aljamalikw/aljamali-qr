import { supabase } from "@/lib/supabase";
import { getCurrentRestaurantId } from "@/lib/categories/get-restaurant-id";

const MENU_IMAGES_BUCKET = "menu-images";

const UPLOAD_ERROR = "Unable to upload image. Please try again.";

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
]);

function getFileExtension(file: File): string {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName) return fromName;

  switch (file.type) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
    default:
      return "jpg";
  }
}

export async function uploadMenuItemImage(
  file: File,
): Promise<{ ok: true; url: string } | { ok: false; message: string }> {
  try {
    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      return { ok: false, message: "Please select a JPG, PNG, WEBP, or GIF image." };
    }

    const restaurantId = await getCurrentRestaurantId();

    if (!restaurantId) {
      return { ok: false, message: UPLOAD_ERROR };
    }

    const extension = getFileExtension(file);
    const filePath = `${restaurantId}/${crypto.randomUUID()}.${extension}`;

    const { error } = await supabase.storage
      .from(MENU_IMAGES_BUCKET)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });

    if (error) {
      return { ok: false, message: UPLOAD_ERROR };
    }

    const { data } = supabase.storage.from(MENU_IMAGES_BUCKET).getPublicUrl(filePath);

    if (!data.publicUrl) {
      return { ok: false, message: UPLOAD_ERROR };
    }

    return { ok: true, url: data.publicUrl };
  } catch {
    return { ok: false, message: UPLOAD_ERROR };
  }
}
