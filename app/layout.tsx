import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Sans_Arabic, Playfair_Display } from "next/font/google";
import { Providers } from "@/components/Providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const notoArabic = Noto_Sans_Arabic({
  variable: "--font-noto-arabic",
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Aljamali QR — Premium Digital QR Menus for Restaurants",
  description:
    "Replace printed menus with beautiful bilingual QR menus. English & Arabic support, instant updates, analytics, and multi-branch management for modern restaurants.",
  keywords: [
    "QR menu",
    "digital menu",
    "restaurant menu",
    "Arabic menu",
    "bilingual menu",
    "Aljamali QR",
  ],
  openGraph: {
    title: "Aljamali QR — Premium Digital QR Menus for Restaurants",
    description:
      "Elevate your restaurant with beautiful digital QR menus in English and Arabic.",
    type: "website",
    locale: "en_US",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} ${notoArabic.variable} h-full scroll-smooth antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
