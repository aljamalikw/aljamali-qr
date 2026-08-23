import { advanceOnboardingProgress } from "@/lib/onboarding/progress-actions";
import type { PreferencesFormData } from "@/lib/onboarding/types";
import type { Restaurant } from "@/lib/restaurants/types";

export async function saveOnboardingPreferences(
  input: PreferencesFormData,
  options?: { skipped?: boolean },
): Promise<
  { ok: true; restaurant: Restaurant } | { ok: false; message: string }
> {
  return advanceOnboardingProgress({
    nextStep: 4,
    completedStep: 3,
    skipped: options?.skipped,
    extra: {
      currency: input.currency,
      timezone: input.timezone,
      preferred_language: input.preferredLanguage,
      bilingual_menu: input.bilingualMenu,
      reservations_enabled: input.reservationsEnabled,
    },
  });
}
