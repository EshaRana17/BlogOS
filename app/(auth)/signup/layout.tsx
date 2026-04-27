import type { Metadata } from "next";
import JsonLd from "@/components/seo/JsonLd";
import { webPageSchema } from "@/lib/seo/schemas";
import { absUrl } from "@/lib/seo/site";

export const metadata: Metadata = {
  title: "Create Your Account — Pro Free for 1 Month",
  description:
    "Create your free BlogOS account and unlock Pro features free for 30 days — 12 SEO blogs a month, WordPress auto-publish, AI featured images and SEO audits.",
  alternates: { canonical: absUrl("/signup") },
  openGraph: {
    title: "Create Your BlogOS Account — Pro Free for 1 Month",
    description:
      "Write SEO blogs that rank. New signups get Pro free for 30 days.",
    url: absUrl("/signup"),
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd
        id="ld-signup-page"
        data={webPageSchema({
          path: "/signup",
          name: "Create Your BlogOS Account",
          description:
            "Create a free BlogOS account — Pro features are free for your first 30 days.",
          breadcrumbs: [
            { name: "Home", path: "/" },
            { name: "Sign Up", path: "/signup" },
          ],
        })}
      />
      {children}
    </>
  );
}
