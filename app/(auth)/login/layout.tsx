import type { Metadata } from "next";
import JsonLd from "@/components/seo/JsonLd";
import { webPageSchema } from "@/lib/seo/schemas";
import { absUrl } from "@/lib/seo/site";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to BlogOS to continue writing SEO-optimised blogs that rank.",
  alternates: { canonical: absUrl("/login") },
  openGraph: {
    title: "Sign In | BlogOS",
    description: "Sign in to BlogOS to continue writing SEO-optimised blogs.",
    url: absUrl("/login"),
    type: "website",
  },
  robots: { index: false, follow: true },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd
        id="ld-login-page"
        data={webPageSchema({
          path: "/login",
          name: "Sign In to BlogOS",
          description: "Sign in to your BlogOS account.",
          breadcrumbs: [
            { name: "Home", path: "/" },
            { name: "Sign In", path: "/login" },
          ],
        })}
      />
      {children}
    </>
  );
}
