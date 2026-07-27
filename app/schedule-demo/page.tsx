import type { Metadata } from "next";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { ScheduleDemoForm } from "@/components/demo-requests/ScheduleDemoForm";

export const metadata: Metadata = {
  title: "Schedule a Free Demo | Aljamali QR",
  description:
    "Book a free on-site demonstration and see how Aljamali QR modernizes your restaurant with digital menus, QR codes, and analytics.",
};

export default function ScheduleDemoPage() {
  return (
    <AuthLayout contentClassName="max-w-2xl">
      <ScheduleDemoForm />
    </AuthLayout>
  );
}
