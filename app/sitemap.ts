import type { MetadataRoute } from "next";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { Article } from "@/types";
import { SITE, absUrl } from "@/lib/seo/site";

async function getPublishedArticles(): Promise<Article[]> {
  try {
    const q = query(collection(db, "articles"), where("published", "==", true));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ ...d.data(), id: d.id } as Article));
  } catch {
    return [];
  }
}

export const revalidate = 3600; /* refresh sitemap hourly */

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = [
    { url: SITE.url, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: absUrl("/signup"), lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: absUrl("/login"), lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: absUrl("/blog"), lastModified: now, changeFrequency: "daily", priority: 0.8 },
  ];

  const articles = await getPublishedArticles();
  const articleEntries: MetadataRoute.Sitemap = articles.map((a) => ({
    url: absUrl(`/blog/${a.slug}`),
    lastModified: new Date(a.updatedAt || a.createdAt),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [...staticEntries, ...articleEntries];
}
