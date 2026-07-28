import type { Metadata } from "next";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";

export const metadata: Metadata = {
  title: "Admin Login | Aljamali QR",
  description: "Sign in to the Aljamali QR platform admin console.",
};

export default function AdminLoginPage() {
  return (
    <AuthLayout>
      <AdminLoginForm />
    </AuthLayout>
  );
}
