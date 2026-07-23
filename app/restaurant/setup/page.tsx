import type { Metadata } from "next";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { RestaurantSetupForm } from "@/components/restaurant/RestaurantSetupForm";
import { RestaurantSetupGuard } from "@/components/restaurant/RestaurantSetupGuard";

export const metadata: Metadata = {
  title: "Restaurant Setup | Aljamali QR",
  description:
    "Complete your restaurant profile to launch your premium digital QR menu with Aljamali QR.",
};

export default function RestaurantSetupPage() {
  return (
    <AuthLayout wide>
      <RestaurantSetupGuard>
        <RestaurantSetupForm />
      </RestaurantSetupGuard>
    </AuthLayout>
  );
}
