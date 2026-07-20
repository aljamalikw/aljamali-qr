import type { Metadata } from "next";
import { SaffronGardenMenu } from "@/components/demo/SaffronGardenMenu";

export const metadata: Metadata = {
  title: "Saffron Garden — Demo Menu | Aljamali QR",
  description:
    "Explore the Saffron Garden interactive demo menu. Bilingual English & Arabic QR menu with categories, search, and premium design.",
  robots: { index: true, follow: true },
};

export default function DemoPage() {
  return <SaffronGardenMenu />;
}
