import { Metadata } from "next";
import { ShootingPageClient } from "./ShootingPageClient";

export const metadata: Metadata = { title: "Телесуфлёр / Съёмка" };

export default async function ShootingPage() {
  // Always pass empty readyItems from server so every user has 100% isolated private browser storage
  return <ShootingPageClient readyItems={[]} />;
}
