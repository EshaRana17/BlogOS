import type { Metadata } from "next";
import JsonLd from "@/components/seo/JsonLd";
import {
  organizationSchema,
  websiteSchema,
  softwareApplicationSchema,
  faqSchema,
  breadcrumbSchema,
} from "@/lib/seo/schemas";
import { SITE, absUrl } from "@/lib/seo/site";
import LandingClient from "./_landing/LandingClient";

export const metadata: Metadata = {
  title: "BlogOS — AI-Powered SEO Blog Writer | Build With Esha",
  description:
    "Write SEO-optimised, human-like blog content that ranks on Google and AI answer engines. Scrape top-10 competitors, extract keywords, write 1,500-word articles, publish to WordPress in minutes.",
  alternates: { canonical: absUrl("/") },
  openGraph: {
    title: "BlogOS — AI-Powered SEO Blog Writer",
    description:
      "Write blogs that rank. Powered by AI, built for SEO. By Build With Esha.",
    url: SITE.url,
    siteName: SITE.name,
    type: "website",
    locale: "en_US",
    images: [{ url: absUrl("/og-image.png"), width: 1200, height: 630, alt: SITE.name }],
  },
  twitter: {
    card: "summary_large_image",
    title: "BlogOS — AI-Powered SEO Blog Writer",
    description: "Write blogs that rank. Powered by AI, built for SEO.",
    images: [absUrl("/og-image.png")],
  },
};

const FAQS = [
  {
    question: "What is BlogOS?",
    answer:
      "BlogOS is an AI-powered SEO blog writer that researches your competitors, extracts winning keywords, and writes complete SEO-optimised articles ready to publish to WordPress.",
  },
  {
    question: "How does BlogOS work?",
    answer:
      "You enter a niche, topic and region. BlogOS scrapes the top 10 ranking pages, extracts 25 keywords and meta data, builds a 10-section blog structure, writes the article section-by-section, runs an AI audit, generates schema markup and a featured image, then publishes to WordPress.",
  },
  {
    question: "How much does BlogOS cost?",
    answer:
      "Free plan is $0 forever and includes 2 high-quality blog posts. Pro is $19/month for 12 blog posts plus WordPress auto-publish. Business is $39/month for 30 blog posts plus the 30-day cluster engine and NLP workbook.",
  },
  {
    question: "Do new users get a free trial?",
    answer:
      "Yes. Every new signup gets 30 days of Pro for free — 12 blogs per month, WordPress integration, featured images and AI audits, no credit card required.",
  },
  {
    question: "Does BlogOS publish directly to WordPress?",
    answer:
      "Yes. Pro and Business users can connect their WordPress site and auto-publish articles with the correct slug, meta description, featured image and schema markup in one click.",
  },
  {
    question: "Is the content human-like and E-E-A-T optimised?",
    answer:
      "Yes. Every article is streamed section-by-section, runs through an AI audit that checks grammar, keyword injection and E-E-A-T signals, and is scored out of 100 before publication.",
  },
];

export default function Home() {
  return (
    <>
      <JsonLd id="ld-organization" data={organizationSchema()} />
      <JsonLd id="ld-website" data={websiteSchema()} />
      <JsonLd id="ld-software" data={softwareApplicationSchema()} />
      <JsonLd id="ld-faq" data={faqSchema(FAQS)} />
      <JsonLd
        id="ld-breadcrumbs-home"
        data={breadcrumbSchema([{ name: "Home", path: "/" }])}
      />
      <LandingClient />
    </>
  );
}
