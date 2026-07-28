import type { Metadata } from "next";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata: Metadata = {
  title: "Create Restaurant Account | Aljamali QR",
  description:
    "Start your free trial and create a premium digital QR menu for your restaurant in minutes.",
};

export default function RegisterPage() {
  return (
    <AuthLayout wide>
      <RegisterForm />
    </AuthLayout>
  );
}
