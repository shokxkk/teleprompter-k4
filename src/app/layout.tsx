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
    default: "sufler.uz — Профессиональный Онлайн Телесуфлёр k4",
    template: "%s — sufler.uz",
  },
  description:
    "sufler.uz — Удобный профессиональный онлайн телесуфлёр k4 для записи видео, Reels, роликов и выступлений. Поддержка Word, PPTX, Фото и Текста.",
  keywords: [
    "sufler.uz",
    "телесуфлер",
    "онлайн суфлер",
    "телесуфлёр k4",
    "Reels суфлер",
    "sufler uzbekistan",
    "видео съемка",
  ],
  authors: [{ name: "sufler.uz" }],
  creator: "sufler.uz",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    locale: "ru_RU",
    siteName: "sufler.uz",
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
