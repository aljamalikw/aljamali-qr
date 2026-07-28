import type { Metadata } from "next";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Restaurant Login | Aljamali QR",
  description:
    "Sign in to your Aljamali QR restaurant dashboard to manage digital menus, QR codes, and guest analytics.",
};

export default function LoginPage() {
  return (
    <AuthLayout>
      <LoginForm />
    </AuthLayout>
  );
}
