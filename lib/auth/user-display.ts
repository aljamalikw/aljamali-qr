import type { User } from "@supabase/supabase-js";

export function getUserDisplayName(user: User | null | undefined): string {
  if (!user) return "";

  const fullName = user.user_metadata?.full_name;
  if (typeof fullName === "string" && fullName.trim()) {
    return fullName.trim();
  }

  return user.email ?? "";
}

export function getUserInitials(displayName: string): string {
  const trimmed = displayName.trim();
  if (!trimmed) return "";

  if (trimmed.includes("@")) {
    return trimmed.slice(0, 2).toUpperCase();
  }

  return trimmed
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
