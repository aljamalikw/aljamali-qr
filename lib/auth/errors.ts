import type { AuthError } from "@supabase/supabase-js";

export function getAuthErrorMessage(error: AuthError | Error): string {
  const message = error.message.toLowerCase();

  if (message.includes("invalid login credentials")) {
    return "Incorrect email or password. Please try again.";
  }
  if (message.includes("email not confirmed")) {
    return "Please verify your email before signing in.";
  }
  if (message.includes("user already registered")) {
    return "An account with this email already exists. Try signing in instead.";
  }
  if (message.includes("password should be at least")) {
    return "Password must be at least 6 characters.";
  }
  if (message.includes("unable to validate email")) {
    return "That email address looks invalid. Please check and try again.";
  }
  if (message.includes("rate limit") || message.includes("too many requests")) {
    return "Too many attempts. Please wait a moment and try again.";
  }
  if (message.includes("signup is disabled")) {
    return "Account registration is temporarily unavailable. Please try again later.";
  }
  if (message.includes("email link is invalid") || message.includes("expired")) {
    return "This link has expired. Please request a new one.";
  }
  if (message.includes("new password should be different")) {
    return "Choose a different password from your current one.";
  }

  return error.message || "Something went wrong. Please try again.";
}

export function isEmailVerified(
  user: { email_confirmed_at?: string | null } | null | undefined,
): boolean {
  return Boolean(user?.email_confirmed_at);
}

export const REMEMBER_EMAIL_KEY = "aljamali_remember";
export const PENDING_VERIFICATION_EMAIL_KEY = "pending_verification_email";

export function getSiteUrl(): string {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}
