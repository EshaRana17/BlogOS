import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Generate a Blog",
  description: "Generate a new SEO-optimised blog post with BlogOS.",
  robots: { index: false, follow: false },
};

export default function GenerateLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
