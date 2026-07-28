import { supabase } from "@/lib/supabase";

export function slugifyRestaurantName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function generateUniqueSlug(restaurantName: string): Promise<string> {
  const baseSlug = slugifyRestaurantName(restaurantName) || "restaurant";
  let candidate = baseSlug;
  let suffix = 0;

  while (true) {
    const { data } = await supabase
      .from("restaurants")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();

    if (!data) {
      return candidate;
    }

    suffix += 1;
    candidate = `${baseSlug}-${suffix}`;
  }
}
