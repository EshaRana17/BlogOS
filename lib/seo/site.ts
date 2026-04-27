export const SITE = {
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://blogos.live",
  name: "BlogOS",
  legalName: "Build With Esha",
  founder: "Esha Sabir",
  tagline: "AI-Powered SEO Blog Writer",
  description:
    "BlogOS writes SEO-optimised, human-like blog content that ranks on Google and AI answer engines. Scrapes top 10 competitors, extracts keywords, generates 1,500-word articles and publishes to WordPress.",
  logo: "/logo.png",
  twitter: "@buildwithesha",
  whatsapp: "+923290503919",
  email: "esharanarajpoott@gmail.com",
} as const;

export function absUrl(path = "/"): string {
  if (path.startsWith("http")) return path;
  return `${SITE.url}${path.startsWith("/") ? path : `/${path}`}`;
}
