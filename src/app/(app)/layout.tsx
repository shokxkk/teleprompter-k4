import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AuthProvider } from "@/components/providers/AuthProvider";

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = (await auth()) ?? {
    user: {
      id: "public-k4-user",
      name: "Пользователь k4",
      email: "public@teleprompterk4.com",
    },
    expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
  };

  return (
    <AuthProvider session={session}>
      <div className="app-shell">
        <AppSidebar user={session.user} />
        <main className="main-content">
          {children}
        </main>
      </div>
    </AuthProvider>
  );
}
