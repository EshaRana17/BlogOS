import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminAuth } from "@/lib/firebase/admin";
import DashboardSidebar from "@/components/layout/DashboardSidebar";

export const metadata: Metadata = {
  title: "Admin Panel",
  robots: { index: false, follow: false, nocache: true, noarchive: true },
};

/* Server Component — verifies admin claim before rendering anything */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sessionCookie = cookies().get("session")?.value;

  if (!sessionCookie) {
    redirect("/login");
  }

  try {
    const claims = await adminAuth.verifySessionCookie(sessionCookie, true);
    if (!claims.admin) {
      redirect("/dashboard");
    }
  } catch {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />
      <main className="flex-1 overflow-auto min-h-screen">{children}</main>
    </div>
  );
}
