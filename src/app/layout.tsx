import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Brand Office",
    template: "%s — Brand Office",
  },
  description:
    "Персональная AI-команда для развития личного бренда в Instagram. Адаптивное интервью, сценарии Reels, контент-план и аналитика.",
  keywords: [
    "личный бренд",
    "Instagram",
    "контент-план",
    "AI продюсер",
    "Reels сценарий",
    "shaxsiy brend",
    "instagram kontent",
  ],
  authors: [{ name: "Brand Office" }],
  creator: "Brand Office",
  robots: {
    index: false, // Private app
    follow: false,
  },
  openGraph: {
    type: "website",
    locale: "ru_RU",
    siteName: "Brand Office",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" className={inter.variable}>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body>{children}</body>
    </html>
  );
}
