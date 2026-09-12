import { Metadata } from "next";
import { auth } from "@/server/auth";
import { prisma } from "@/server/db";
import { SettingsPageClient } from "./SettingsPageClient";

export const metadata: Metadata = { title: "Настройки Workspace" };

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const workspace = await prisma.workspace.findUnique({
    where: { ownerId: session.user.id },
    include: { settings: true },
  });
  if (!workspace) return null;

  return <SettingsPageClient workspace={workspace} settings={workspace.settings} />;
}
