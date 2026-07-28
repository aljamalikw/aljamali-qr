export const countries = [
  "Kuwait",
  "Saudi Arabia",
  "United Arab Emirates",
  "Qatar",
  "Bahrain",
  "Oman",
  "Egypt",
  "Jordan",
  "Lebanon",
  "Other",
];

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export type PasswordStrengthLevel = "weak" | "fair" | "good" | "strong";

export function getPasswordStrength(password: string): {
  level: PasswordStrengthLevel;
  score: number;
  label: string;
} {
  if (!password) {
    return { level: "weak", score: 0, label: "Enter a password" };
  }

  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^a-zA-Z0-9]/.test(password)) score += 1;

  if (score <= 1) return { level: "weak", score: 25, label: "Weak" };
  if (score === 2) return { level: "fair", score: 50, label: "Fair" };
  if (score === 3 || score === 4) return { level: "good", score: 75, label: "Good" };
  return { level: "strong", score: 100, label: "Strong" };
}

export async function mockAuthDelay(ms = 900): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}
