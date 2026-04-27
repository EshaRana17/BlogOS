import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your BlogOS dashboard — view blogs, usage and your Pro trial.",
  robots: { index: false, follow: false },
};

export default function DashboardPageLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
