import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Create Restaurant Account | Aljamali QR",
  description:
    "Start your free trial and create a premium digital QR menu for your restaurant in minutes.",
};

export default function RegistrationPage() {
  redirect("/register");
}
