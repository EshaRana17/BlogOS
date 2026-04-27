import type { Metadata, Viewport } from "next";
import { Syne } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/context/AuthContext";
import { SITE } from "@/lib/seo/site";
import "./globals.css";

const syne = Syne({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-syne",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: "BlogOS — AI-Powered SEO Blog Writer",
    template: "%s | BlogOS",
  },
  description:
    "Write SEO-optimised, human-like blog content that ranks on Google and AI answer engines. BlogOS by Build With Esha.",
  applicationName: SITE.name,
  keywords: [
    "SEO blog writer",
    "AI blog generator",
    "SEO content",
    "blog automation",
    "AI SEO tool",
    "WordPress AI writer",
    "content marketing",
    "keyword research AI",
  ],
  authors: [{ name: SITE.founder, url: "https://buildwithesha.com" }],
  creator: SITE.founder,
  publisher: SITE.legalName,
  formatDetection: { email: false, address: false, telephone: false },
  alternates: { canonical: "/" },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    title: "BlogOS — AI-Powered SEO Blog Writer",
    description: "Write blogs that rank. Powered by AI, built for SEO.",
    url: SITE.url,
    siteName: SITE.name,
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "BlogOS — AI-Powered SEO Blog Writer",
    description: "Write blogs that rank. Powered by AI, built for SEO.",
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0f1a" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={syne.variable}
    >
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange={false}
        >
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
