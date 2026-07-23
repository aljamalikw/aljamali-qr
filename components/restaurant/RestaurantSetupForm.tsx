"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthHeader } from "@/components/auth/AuthHeader";
import { AuthInput } from "@/components/auth/AuthInput";
import { AuthButton } from "@/components/auth/AuthButton";
import {
  CURRENCY_OPTIONS,
  DEFAULT_CURRENCY,
  DEFAULT_TIMEZONE,
  TIMEZONE_OPTIONS,
} from "@/lib/restaurants/constants";
import {
  fetchUserRestaurant,
  saveRestaurantSetup,
} from "@/lib/restaurants/setup";

const selectClass = "auth-input w-full appearance-none cursor-pointer";

export function RestaurantSetupForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    restaurantName: "",
    phone: "",
    currency: DEFAULT_CURRENCY,
    timezone: DEFAULT_TIMEZONE,
  });

  useEffect(() => {
    fetchUserRestaurant().then((restaurant) => {
      if (!restaurant) return;

      setForm((current) => ({
        restaurantName: restaurant.restaurant_name?.trim() ?? current.restaurantName,
        phone: restaurant.phone?.trim() ?? current.phone,
        currency: restaurant.currency || DEFAULT_CURRENCY,
        timezone: restaurant.timezone || DEFAULT_TIMEZONE,
      }));
    });
  }, []);

  const update = (key: keyof typeof form, value: string) => {
    setForm((previous) => ({ ...previous, [key]: value }));
    if (errors[key]) {
      setErrors((previous) => ({ ...previous, [key]: "" }));
    }
    setFormError("");
  };

  const validate = () => {
    const next: Record<string, string> = {};

    if (!form.restaurantName.trim()) {
      next.restaurantName = "Please enter your restaurant name.";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setFormError("");

    const result = await saveRestaurantSetup({
      restaurantName: form.restaurantName,
      phone: form.phone,
      currency: form.currency,
      timezone: form.timezone,
    });

    if (!result.ok) {
      setLoading(false);
      setFormError(result.message);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  };

  return (
    <AuthCard className="max-w-xl">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="mb-6 flex items-center justify-center gap-2">
          <span className="h-1.5 w-8 rounded-full bg-gold" />
          <span className="h-1.5 w-8 rounded-full bg-gold/30" />
          <span className="h-1.5 w-8 rounded-full bg-gold/15" />
        </div>

        <AuthHeader
          title="Set up your restaurant"
          subtitle="Tell us a little about your venue to personalize your premium digital menu experience."
        />

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <AuthInput
            label="Restaurant Name"
            placeholder="Saffron Garden"
            value={form.restaurantName}
            onChange={(event) => update("restaurantName", event.target.value)}
            error={errors.restaurantName}
          />

          <AuthInput
            label="Phone Number"
            type="tel"
            autoComplete="tel"
            placeholder="+965 5000 0000"
            value={form.phone}
            onChange={(event) => update("phone", event.target.value)}
            error={errors.phone}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label
                htmlFor="currency"
                className="block text-xs font-medium uppercase tracking-wider text-white/45"
              >
                Currency
              </label>
              <select
                id="currency"
                value={form.currency}
                onChange={(event) => update("currency", event.target.value)}
                className={selectClass}
              >
                {CURRENCY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="timezone"
                className="block text-xs font-medium uppercase tracking-wider text-white/45"
              >
                Timezone
              </label>
              <select
                id="timezone"
                value={form.timezone}
                onChange={(event) => update("timezone", event.target.value)}
                className={selectClass}
              >
                {TIMEZONE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {formError && (
            <p className="text-sm text-red-400" role="alert">
              {formError}
            </p>
          )}

          <AuthButton type="submit" loading={loading} className="mt-2">
            Complete Setup
          </AuthButton>
        </form>
      </motion.div>
    </AuthCard>
  );
}
