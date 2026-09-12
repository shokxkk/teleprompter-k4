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
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

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
