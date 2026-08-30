"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AuthCard } from "./AuthCard";
import { AuthHeader } from "./AuthHeader";
import { AuthFooter, AuthFooterLink } from "./AuthFooter";
import { AuthInput } from "./AuthInput";
import { PasswordInput } from "./PasswordInput";
import { AuthButton } from "./AuthButton";
import { AuthCheckbox } from "./AuthCheckbox";
import { PasswordStrength } from "./PasswordStrength";
import { PasswordRequirements, meetsPasswordRequirements } from "./PasswordRequirements";
import { RegisterSuccessScreen } from "./RegisterSuccessScreen";
import { countries, isValidEmail } from "@/lib/auth/utils";
import {
  getAuthErrorMessage,
  getSiteUrl,
  PENDING_VERIFICATION_EMAIL_KEY,
} from "@/lib/auth/errors";
import { supabase } from "@/lib/supabase";
import { createRestaurantForOwner } from "@/lib/restaurants/create-restaurant";

export function RegisterForm() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState({
    ownerName: "",
    restaurantName: "",
    email: "",
    password: "",
    confirmPassword: "",
    country: "Kuwait",
    phone: "",
    terms: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const update = (key: string, value: string | boolean) => {
    setForm((p) => ({ ...p, [key]: value }));
    if (errors[key]) setErrors((p) => ({ ...p, [key]: "" }));
    setFormError("");
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.ownerName.trim()) next.ownerName = "Please enter the owner's name.";
    if (!form.restaurantName.trim()) next.restaurantName = "Please enter your restaurant name.";
    if (!form.email.trim()) next.email = "Please enter your email address.";
    else if (!isValidEmail(form.email)) next.email = "That email doesn't look right — check and try again.";
    if (!form.password) next.password = "Please create a password.";
    else if (!meetsPasswordRequirements(form.password))
      next.password = "Your password doesn't meet all requirements yet.";
    if (!form.confirmPassword) next.confirmPassword = "Please confirm your password.";
    else if (form.password !== form.confirmPassword)
      next.confirmPassword = "Passwords don't match — please try again.";
    if (!form.phone.trim()) next.phone = "Please enter a phone number.";
    if (!form.terms) next.terms = "Please accept the terms to continue.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setFormError("");

    const { data, error } = await supabase.auth.signUp({
      email: form.email.trim(),
      password: form.password,
      options: {
        data: {
          full_name: form.ownerName.trim(),
        },
        emailRedirectTo: `${getSiteUrl()}/auth/callback`,
      },
    });

    if (error) {
      setLoading(false);
      setFormError(getAuthErrorMessage(error));
      return;
    }

    if (!data.user) {
      setLoading(false);
      setFormError("Registration completed, but we couldn't verify your account. Please try again.");
      return;
    }

    const restaurantResult = await createRestaurantForOwner(
      data.user.id,
      form.email.trim(),
      {
        restaurantName: form.restaurantName.trim(),
        ownerName: form.ownerName.trim(),
        phone: form.phone.trim(),
        country: form.country.trim(),
      },
    );

    if (!restaurantResult.ok) {
      if (data.session) {
        await supabase.auth.signOut();
      }
      setLoading(false);
      setFormError(restaurantResult.message);
      return;
    }

    if (data.session) {
      await supabase.auth.signOut();
    }

    sessionStorage.setItem(PENDING_VERIFICATION_EMAIL_KEY, form.email.trim());
    setLoading(false);
    setSuccess(true);
  };

  const selectClass = "auth-input w-full appearance-none cursor-pointer";

  return (
    <AuthCard>
      <AnimatePresence mode="wait">
        {success ? (
          <RegisterSuccessScreen key="success" email={form.email.trim()} />
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3 }}
          >
            <AuthHeader
              title="Create your account"
              subtitle="Start building your premium digital QR menu today"
            />

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <AuthInput
                label="Restaurant Owner Name"
                placeholder="Layla Al-Mutairi"
                value={form.ownerName}
                onChange={(e) => update("ownerName", e.target.value)}
                error={errors.ownerName}
              />

              <AuthInput
                label="Restaurant Name"
                placeholder="Saffron Garden"
                value={form.restaurantName}
                onChange={(e) => update("restaurantName", e.target.value)}
                error={errors.restaurantName}
              />

              <AuthInput
                label="Email"
                type="email"
                autoComplete="email"
                placeholder="hello@restaurant.com"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                error={errors.email}
              />

              <div className="space-y-2">
                <PasswordInput
                  label="Password"
                  autoComplete="new-password"
                  placeholder="Create a strong password"
                  value={form.password}
                  onChange={(e) => update("password", e.target.value)}
                  error={errors.password}
                />
                <PasswordStrength password={form.password} />
                <PasswordRequirements password={form.password} />
              </div>

              <PasswordInput
                label="Confirm Password"
                autoComplete="new-password"
                placeholder="Repeat your password"
                value={form.confirmPassword}
                onChange={(e) => update("confirmPassword", e.target.value)}
                error={errors.confirmPassword}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label
                    htmlFor="country"
                    className="block text-xs font-medium uppercase tracking-wider text-white/45"
                  >
                    Country
                  </label>
                  <select
                    id="country"
                    value={form.country}
                    onChange={(e) => update("country", e.target.value)}
                    className={selectClass}
                  >
                    {countries.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <AuthInput
                  label="Phone Number"
                  type="tel"
                  autoComplete="tel"
                  placeholder="+965 5000 0000"
                  value={form.phone}
                  onChange={(e) => update("phone", e.target.value)}
                  error={errors.phone}
                />
              </div>

              <AuthCheckbox
                id="terms"
                checked={form.terms}
                onChange={(v) => update("terms", v)}
                error={errors.terms}
                label={
                  <>
                    I agree to the{" "}
                    <span className="text-gold">Terms of Service</span> and{" "}
                    <span className="text-gold">Privacy Policy</span>
                  </>
                }
              />

              {formError && (
                <p className="text-sm text-red-400" role="alert">
                  {formError}
                </p>
              )}

              <AuthButton type="submit" loading={loading} className="mt-2">
                Create Account
              </AuthButton>
            </form>

            <AuthFooter>
              Already have an account?{" "}
              <AuthFooterLink href="/login">Sign in</AuthFooterLink>
            </AuthFooter>
          </motion.div>
        )}
      </AnimatePresence>
    </AuthCard>
  );
}
