import type { Metadata } from "next";
import { PublicMenuView } from "@/components/public-menu/PublicMenuView";
import { RestaurantNotFound } from "@/components/public-menu/RestaurantNotFound";
import { fetchPublicMenuBySlug } from "@/lib/public-menu/fetch-public-menu";

interface PublicMenuPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: PublicMenuPageProps): Promise<Metadata> {
  const { slug } = await params;
  const menu = await fetchPublicMenuBySlug(slug);

  if (!menu) {
    return {
      title: "Restaurant not found | Aljamali QR",
      robots: { index: false, follow: false },
    };
  }

  return {
    title: `${menu.restaurant.name} — Menu | Aljamali QR`,
    description: `Browse the digital menu for ${menu.restaurant.name}. Bilingual English and Arabic QR menu.`,
    robots: { index: true, follow: true },
  };
}

export default async function PublicMenuPage({ params }: PublicMenuPageProps) {
  const { slug } = await params;
  const menu = await fetchPublicMenuBySlug(slug);

  if (!menu) {
    return <RestaurantNotFound />;
  }

  return <PublicMenuView menu={menu} />;
}
