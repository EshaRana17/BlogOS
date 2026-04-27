import { Metadata } from "next";
import Link from "next/link";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { Article } from "@/types";
import { ArrowRight, Calendar } from "lucide-react";
import JsonLd from "@/components/seo/JsonLd";
import { breadcrumbSchema, webPageSchema } from "@/lib/seo/schemas";
import { absUrl } from "@/lib/seo/site";

export const metadata: Metadata = {
  title: "Blog — SEO Writing Guides & Tips",
  description:
    "SEO strategies, content-writing tips and AI insights from the BlogOS team at Build With Esha.",
  alternates: { canonical: absUrl("/blog") },
  openGraph: {
    title: "BlogOS Blog",
    description: "Read our latest guides on SEO and content writing.",
    url: absUrl("/blog"),
    type: "website",
  },
};

async function getArticles() {
  try {
    const q = query(
      collection(db, "articles"),
      where("published", "==", true),
      orderBy("createdAt", "desc")
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ ...d.data(), id: d.id } as Article));
  } catch {
    return [];
  }
}

export default async function BlogPage() {
  const articles = await getArticles();
  const categories = Array.from(new Set(articles.map((a) => a.category))).filter(Boolean);

  return (
    <>
      <JsonLd
        id="ld-blog-collection"
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "BlogOS Blog",
          description: "SEO writing guides and tips",
          url: absUrl("/blog"),
          mainEntity: {
            "@type": "Blog",
            name: "BlogOS Blog",
            url: absUrl("/blog"),
            blogPost: articles.slice(0, 20).map((a) => ({
              "@type": "BlogPosting",
              headline: a.title,
              url: absUrl(`/blog/${a.slug}`),
              datePublished: a.createdAt,
              dateModified: a.updatedAt,
              image: a.featuredImage || undefined,
            })),
          },
        }}
      />
      <JsonLd
        id="ld-blog-webpage"
        data={webPageSchema({
          path: "/blog",
          name: "BlogOS Blog",
          description:
            "SEO strategies, content-writing tips, and AI insights from Build With Esha.",
          breadcrumbs: [
            { name: "Home", path: "/" },
            { name: "Blog", path: "/blog" },
          ],
        })}
      />
      <JsonLd
        id="ld-blog-breadcrumbs"
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Blog", path: "/blog" },
        ])}
      />

      <div className="min-h-screen bg-background">
        {/* Hero */}
        <section className="border-b border-border py-16">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 space-y-4 text-center">
            <h1 className="text-4xl sm:text-5xl font-display font-bold text-foreground">
              Blog & Guides
            </h1>
            <p className="text-lg text-muted-foreground">
              Learn SEO strategies, content writing tips, and AI insights from Build With Esha
            </p>
          </div>
        </section>

        {/* Articles */}
        <section className="py-16">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 space-y-8">
            {articles.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No articles yet. Check back soon!</p>
              </div>
            ) : (
              <>
                {/* Featured (first article) */}
                {articles.length > 0 && (
                  <article className="rounded-xl border border-border overflow-hidden hover:border-primary/40 transition-colors group">
                    <div className="grid md:grid-cols-2 gap-6 p-6">
                      {articles[0].featuredImage && (
                        <div className="relative aspect-video md:aspect-square rounded-lg overflow-hidden bg-muted">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={articles[0].featuredImage}
                            alt={articles[0].title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      )}
                      <div className="flex flex-col justify-between space-y-3">
                        <div>
                          <div className="flex items-center gap-2 mb-3 flex-wrap">
                            {articles[0].category && (
                              <span className="text-xs font-semibold px-2 py-1 rounded-full bg-primary/10 text-primary">
                                {articles[0].category}
                              </span>
                            )}
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar size={12} />
                              {new Date(articles[0].createdAt).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                          </div>
                          <h2 className="text-2xl font-display font-bold text-foreground">
                            {articles[0].title}
                          </h2>
                          <p className="text-muted-foreground mt-2">{articles[0].excerpt}</p>
                        </div>
                        <Link
                          href={`/blog/${articles[0].slug}`}
                          className="inline-flex items-center gap-2 text-primary hover:gap-3 transition-all w-fit font-medium"
                        >
                          Read Article
                          <ArrowRight size={16} />
                        </Link>
                      </div>
                    </div>
                  </article>
                )}

                {/* Grid */}
                {articles.length > 1 && (
                  <div className="grid sm:grid-cols-2 gap-6">
                    {articles.slice(1).map((article) => (
                      <Link
                        key={article.id}
                        href={`/blog/${article.slug}`}
                        className="group rounded-lg border border-border p-5 hover:border-primary/40 transition-colors"
                      >
                        {article.featuredImage && (
                          <div className="relative aspect-video rounded-lg overflow-hidden bg-muted mb-4">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={article.featuredImage}
                              alt={article.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                        )}
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          {article.category && (
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary">
                              {article.category}
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {new Date(article.createdAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                        <h3 className="font-display font-bold text-foreground group-hover:text-primary transition-colors">
                          {article.title}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                          {article.excerpt}
                        </p>
                      </Link>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
