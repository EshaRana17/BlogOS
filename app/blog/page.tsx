import { Metadata } from "next";
import Link from "next/link";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { Article } from "@/types";
import { ArrowRight, ArrowLeft, Calendar } from "lucide-react";
import JsonLd from "@/components/seo/JsonLd";
import { breadcrumbSchema, webPageSchema } from "@/lib/seo/schemas";
import { absUrl } from "@/lib/seo/site";
import LandingNavbar from "@/components/landing/LandingNavbar";

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

const SAMPLE_ARTICLES = [
  {
    id: "sample-1",
    title: "10 SEO Strategies That Actually Work in 2025",
    excerpt:
      "Discover the most effective techniques to rank higher on Google and AI answer engines — backed by real data and competitor research.",
    category: "SEO",
    createdAt: "2025-01-15",
    slug: null as string | null,
  },
  {
    id: "sample-2",
    title: "How to Write Blog Posts That Rank on the First Page",
    excerpt:
      "A step-by-step guide to creating high-quality, SEO-optimised content that drives organic traffic and converts readers into customers.",
    category: "Content Writing",
    createdAt: "2025-01-10",
    slug: null as string | null,
  },
  {
    id: "sample-3",
    title: "AI-Powered Content Creation: The Future of SEO Blogging",
    excerpt:
      "How tools like BlogOS are revolutionising content creation while keeping the human touch that search engines — and readers — love.",
    category: "AI Tools",
    createdAt: "2025-01-05",
    slug: null as string | null,
  },
];

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
  const hasRealArticles = articles.length > 0;

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
        <LandingNavbar />

        {/* Hero */}
        <section className="border-b border-border py-16">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 space-y-4 text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2"
            >
              <ArrowLeft size={14} />
              Back to Home
            </Link>
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
            {hasRealArticles ? (
              <>
                {/* Featured (first article) */}
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
            ) : (
              /* Sample articles shown while real content is being published */
              <>
                <p className="text-xs text-muted-foreground text-center uppercase tracking-widest font-semibold">
                  Coming soon — sample topics
                </p>

                {/* Featured sample */}
                <article className="rounded-xl border border-border overflow-hidden group">
                  <div className="p-6 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold px-2 py-1 rounded-full bg-primary/10 text-primary">
                        {SAMPLE_ARTICLES[0].category}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar size={12} />
                        {new Date(SAMPLE_ARTICLES[0].createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                    <h2 className="text-2xl font-display font-bold text-foreground">
                      {SAMPLE_ARTICLES[0].title}
                    </h2>
                    <p className="text-muted-foreground">{SAMPLE_ARTICLES[0].excerpt}</p>
                    <span className="inline-flex items-center gap-2 text-muted-foreground text-sm font-medium cursor-default select-none">
                      Coming soon
                      <ArrowRight size={16} />
                    </span>
                  </div>
                </article>

                {/* Sample grid */}
                <div className="grid sm:grid-cols-2 gap-6">
                  {SAMPLE_ARTICLES.slice(1).map((article) => (
                    <div
                      key={article.id}
                      className="rounded-lg border border-border p-5"
                    >
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary">
                          {article.category}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(article.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                      <h3 className="font-display font-bold text-foreground">{article.title}</h3>
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                        {article.excerpt}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="text-center pt-4">
                  <p className="text-sm text-muted-foreground mb-4">
                    Real articles drop soon. Want content like this for your own site?
                  </p>
                  <Link
                    href="/signup"
                    className="inline-flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                  >
                    Try BlogOS free
                    <ArrowRight size={15} />
                  </Link>
                </div>
              </>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
