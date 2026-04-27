import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { Article } from "@/types";
import { Calendar, User, ChevronLeft } from "lucide-react";
import ReactMarkdown from "react-markdown";
import JsonLd from "@/components/seo/JsonLd";
import { articleSchema, breadcrumbSchema } from "@/lib/seo/schemas";
import { absUrl } from "@/lib/seo/site";

async function getArticle(slug: string) {
  try {
    const q = query(
      collection(db, "articles"),
      where("slug", "==", slug),
      where("published", "==", true)
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return { ...snap.docs[0].data(), id: snap.docs[0].id } as Article;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const article = await getArticle(params.slug);
  if (!article) return {};

  return {
    title: article.seoTitle || article.title,
    description: article.metaDescription || article.excerpt,
    alternates: { canonical: absUrl(`/blog/${article.slug}`) },
    openGraph: {
      title: article.seoTitle || article.title,
      description: article.metaDescription || article.excerpt,
      type: "article",
      url: absUrl(`/blog/${article.slug}`),
      publishedTime: article.createdAt,
      modifiedTime: article.updatedAt,
      tags: article.tags,
      images: article.featuredImage ? [{ url: article.featuredImage }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: article.seoTitle || article.title,
      description: article.metaDescription || article.excerpt,
      images: article.featuredImage ? [article.featuredImage] : [],
    },
  };
}

export default async function ArticlePage({
  params,
}: {
  params: { slug: string };
}) {
  const article = await getArticle(params.slug);
  if (!article) notFound();

  const publishDate = new Date(article.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <>
      <JsonLd
        id="ld-article"
        data={articleSchema({
          title: article.seoTitle || article.title,
          description: article.metaDescription || article.excerpt,
          slug: article.slug,
          image: article.featuredImage,
          createdAt: article.createdAt,
          updatedAt: article.updatedAt,
        })}
      />
      <JsonLd
        id="ld-article-breadcrumbs"
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Blog", path: "/blog" },
          { name: article.title, path: `/blog/${article.slug}` },
        ])}
      />

      <div className="min-h-screen bg-background">
        {/* Header */}
        <section className="border-b border-border">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 py-12 space-y-6">
            <Link
              href="/blog"
              className="inline-flex items-center gap-1 text-sm text-primary hover:gap-2 transition-all"
            >
              <ChevronLeft size={16} />
              Back to blog
            </Link>
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl font-display font-bold text-foreground">
                {article.title}
              </h1>
              <p className="text-lg text-muted-foreground">{article.excerpt}</p>
              <div className="flex items-center gap-4 flex-wrap pt-2">
                {article.category && (
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-primary/10 text-primary">
                    {article.category}
                  </span>
                )}
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <Calendar size={14} />
                  {publishDate}
                </span>
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <User size={14} />
                  Build With Esha
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Featured image */}
        {article.featuredImage && (
          <section className="border-b border-border">
            <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8">
              <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={article.featuredImage}
                  alt={article.title}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </section>
        )}

        {/* Content */}
        <section className="py-12">
          <article className="mx-auto max-w-3xl px-4 sm:px-6 prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown
              components={{
                h2: ({ children }) => (
                  <h2 className="text-2xl font-display font-bold text-foreground mt-8 mb-4">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-xl font-display font-bold text-foreground mt-6 mb-3">
                    {children}
                  </h3>
                ),
                p: ({ children }) => (
                  <p className="text-foreground leading-relaxed mb-4">{children}</p>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc list-inside space-y-2 mb-4 text-foreground">
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal list-inside space-y-2 mb-4 text-foreground">
                    {children}
                  </ol>
                ),
                li: ({ children }) => <li className="text-foreground">{children}</li>,
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-primary pl-4 italic text-muted-foreground my-4">
                    {children}
                  </blockquote>
                ),
                code: ({ children }) => (
                  <code className="bg-muted px-2 py-1 rounded text-sm font-mono text-foreground">
                    {children}
                  </code>
                ),
                pre: ({ children }) => (
                  <pre className="bg-muted p-4 rounded-lg overflow-x-auto mb-4">
                    {children}
                  </pre>
                ),
                a: ({ href, children }) => (
                  <a
                    href={href}
                    className="text-primary hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {children}
                  </a>
                ),
              }}
            >
              {article.content}
            </ReactMarkdown>
          </article>
        </section>

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <section className="border-t border-border py-8">
            <div className="mx-auto max-w-3xl px-4 sm:px-6">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-sm font-semibold text-muted-foreground">Tags:</span>
                {article.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-2.5 py-1 rounded-full border border-border text-muted-foreground hover:border-primary/40 transition-colors cursor-default"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>
    </>
  );
}
