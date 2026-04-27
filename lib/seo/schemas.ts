import { SITE, absUrl } from "./site";

type Graph = Record<string, unknown>;

export function organizationSchema(): Graph {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": absUrl("/#organization"),
    name: SITE.name,
    legalName: SITE.legalName,
    url: SITE.url,
    logo: absUrl(SITE.logo),
    description: SITE.description,
    founder: { "@type": "Person", name: SITE.founder },
    sameAs: [],
    contactPoint: {
      "@type": "ContactPoint",
      telephone: SITE.whatsapp,
      contactType: "customer support",
      email: SITE.email,
      areaServed: "Worldwide",
      availableLanguage: ["en"],
    },
  };
}

export function websiteSchema(): Graph {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": absUrl("/#website"),
    url: SITE.url,
    name: SITE.name,
    description: SITE.description,
    publisher: { "@id": absUrl("/#organization") },
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${SITE.url}/blog?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };
}

export function softwareApplicationSchema(): Graph {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: SITE.name,
    operatingSystem: "Web Browser",
    applicationCategory: "BusinessApplication",
    applicationSubCategory: "SEO Content Generation",
    description: SITE.description,
    url: SITE.url,
    image: absUrl(SITE.logo),
    offers: [
      { "@type": "Offer", name: "Free", price: "0", priceCurrency: "USD", description: "2 blog posts" },
      { "@type": "Offer", name: "Pro", price: "19", priceCurrency: "USD", description: "12 blog posts per month with WordPress integration" },
      { "@type": "Offer", name: "Business", price: "39", priceCurrency: "USD", description: "30 blog posts per month with Cluster Engine and Auto-Scheduler" },
    ],
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      ratingCount: "180",
      bestRating: "5",
    },
    provider: { "@id": absUrl("/#organization") },
  };
}

export function faqSchema(items: { question: string; answer: string }[]): Graph {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((i) => ({
      "@type": "Question",
      name: i.question,
      acceptedAnswer: { "@type": "Answer", text: i.answer },
    })),
  };
}

export function breadcrumbSchema(items: { name: string; path: string }[]): Graph {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absUrl(item.path),
    })),
  };
}

export function webPageSchema(opts: {
  path: string;
  name: string;
  description: string;
  breadcrumbs?: { name: string; path: string }[];
}): Graph {
  const graph: Graph = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": absUrl(`${opts.path}#webpage`),
    url: absUrl(opts.path),
    name: opts.name,
    description: opts.description,
    isPartOf: { "@id": absUrl("/#website") },
    inLanguage: "en",
  };
  if (opts.breadcrumbs) {
    graph.breadcrumb = breadcrumbSchema(opts.breadcrumbs);
  }
  return graph;
}

export function articleSchema(article: {
  title: string;
  description: string;
  slug: string;
  image?: string;
  createdAt: string;
  updatedAt: string;
  authorName?: string;
}): Graph {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: article.title,
    description: article.description,
    image: article.image ? [article.image] : [absUrl(SITE.logo)],
    datePublished: article.createdAt,
    dateModified: article.updatedAt,
    author: {
      "@type": "Organization",
      name: article.authorName ?? SITE.legalName,
      url: SITE.url,
    },
    publisher: {
      "@type": "Organization",
      name: SITE.name,
      logo: { "@type": "ImageObject", url: absUrl(SITE.logo) },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": absUrl(`/blog/${article.slug}`),
    },
  };
}
