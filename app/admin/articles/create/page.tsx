"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { ChevronLeft, Send, AlertCircle, CheckCircle2, Globe } from "lucide-react";
import Link from "next/link";
import type { AdminSite, Article } from "@/types";

interface FormArticle extends Partial<Article> {
  primaryKeyword?: string;
  focusKeywords?: string[];
}

export default function CreateArticlePage() {
  const { user } = useAuth();
  const router = useRouter();

  const [article, setArticle] = useState<FormArticle>({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    featuredImage: "",
    category: "",
    tags: [],
    seoTitle: "",
    metaDescription: "",
    primaryKeyword: "",
    focusKeywords: [],
    published: false,
  });

  const [sites, setSites] = useState<AdminSite[]>([]);
  const [targetSiteId, setTargetSiteId] = useState<string>("blogos-default");
  const [saving, setSaving] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (user && !user.isAdmin) {
      router.push("/dashboard");
    }
  }, [user, router]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/sites", { cache: "no-store" });
        const data = await res.json();
        setSites(data.sites ?? []);
      } catch {
        /* ignore */
      }
    })();
  }, []);

  function generateSlug(title: string) {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!article.title || !article.slug || !article.content) {
      setError("Title, slug, and content are required");
      return;
    }

    setSaving(true);
    try {
      /* "blogos-default" → built-in Article collection (legacy endpoint) */
      if (targetSiteId === "blogos-default") {
        const res = await fetch("/api/articles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(article),
        });
        if (!res.ok) {
          const data = await res.json();
          setError(data.error ?? "Failed to save");
          return;
        }
        router.push("/admin/articles");
        return;
      }

      /* Otherwise publish via the admin publish endpoint */
      const res = await fetch("/api/admin/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteId: targetSiteId,
          title: article.title,
          slug: article.slug,
          content: article.content,
          excerpt: article.excerpt ?? "",
          metaDescription: article.metaDescription ?? "",
          primaryKeyword: article.primaryKeyword ?? "",
          focusKeywords: article.focusKeywords ?? [],
          featuredImageUrl: article.featuredImage ?? "",
          category: article.category ?? "",
          tags: article.tags ?? [],
          status: article.published ? "publish" : "draft",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Publish failed");
        return;
      }
      setSuccess(`Published: ${data.postUrl ?? data.slug}`);
    } finally {
      setSaving(false);
    }
  }

  function addTag(tag: string) {
    if (tag.trim() && !article.tags?.includes(tag.trim())) {
      setArticle((prev) => ({
        ...prev,
        tags: [...(prev.tags || []), tag.trim()],
      }));
      setTagInput("");
    }
  }

  function removeTag(tag: string) {
    setArticle((prev) => ({
      ...prev,
      tags: (prev.tags || []).filter((t) => t !== tag),
    }));
  }

  if (!user?.isAdmin) return null;

  const selectedSite =
    targetSiteId === "blogos-default"
      ? null
      : sites.find((s) => s.id === targetSiteId) ?? null;

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-6">
      <Link
        href="/admin/articles"
        className="inline-flex items-center gap-1 text-sm text-primary hover:gap-2 transition-all"
      >
        <ChevronLeft size={16} />
        Back to articles
      </Link>

      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">New Article</h1>
        <p className="text-muted-foreground mt-1">
          Write once, publish to BlogOS or your connected sites — no quota.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6 bg-card border border-border rounded-xl p-6">
        {/* Target site */}
        <div className="space-y-2">
          <Label htmlFor="target">Publish to</Label>
          <select
            id="target"
            value={targetSiteId}
            onChange={(e) => setTargetSiteId(e.target.value)}
            className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="blogos-default">BlogOS — /blog (internal, default)</option>
            {sites.map((s) => (
              <option key={s.id} value={s.id}>
                {s.kind === "wordpress" ? "WP" : "BlogOS"} · {s.label} — {s.siteUrl}
              </option>
            ))}
          </select>
          {selectedSite && (
            <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
              <Globe size={11} /> {selectedSite.siteUrl}
              {selectedSite.kind === "wordpress" && " · publishes via WordPress REST API"}
            </p>
          )}
          {sites.length === 0 && (
            <p className="text-[11px] text-muted-foreground">
              Need more targets?{" "}
              <Link href="/admin/sites" className="text-primary underline">
                Connect a site
              </Link>
              .
            </p>
          )}
        </div>

        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            value={article.title || ""}
            onChange={(e) => {
              setArticle((prev) => ({ ...prev, title: e.target.value }));
              if (!article.slug) {
                setArticle((prev) => ({ ...prev, slug: generateSlug(e.target.value) }));
              }
            }}
            placeholder="Article title"
            required
          />
        </div>

        {/* Slug */}
        <div className="space-y-2">
          <Label htmlFor="slug">Slug * (URL-safe, unique)</Label>
          <Input
            id="slug"
            value={article.slug || ""}
            onChange={(e) =>
              setArticle((prev) => ({
                ...prev,
                slug: e.target.value.toLowerCase().replace(/\s+/g, "-"),
              }))
            }
            placeholder="article-url-slug"
            required
          />
        </div>

        {/* Excerpt */}
        <div className="space-y-2">
          <Label htmlFor="excerpt">Excerpt</Label>
          <textarea
            id="excerpt"
            value={article.excerpt || ""}
            onChange={(e) => setArticle((prev) => ({ ...prev, excerpt: e.target.value }))}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring min-h-[80px] resize-none"
            placeholder="Brief summary of the article…"
          />
        </div>

        {/* Featured Image */}
        <div className="space-y-2">
          <Label htmlFor="image">Featured Image URL</Label>
          <Input
            id="image"
            value={article.featuredImage || ""}
            onChange={(e) => setArticle((prev) => ({ ...prev, featuredImage: e.target.value }))}
            placeholder="https://example.com/image.jpg"
            type="url"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              value={article.category || ""}
              onChange={(e) => setArticle((prev) => ({ ...prev, category: e.target.value }))}
              placeholder="e.g. SEO"
            />
          </div>

          {/* Primary keyword (used for Yoast focus kw when publishing to WP) */}
          <div className="space-y-2">
            <Label htmlFor="primaryKeyword">Primary keyword</Label>
            <Input
              id="primaryKeyword"
              value={article.primaryKeyword || ""}
              onChange={(e) =>
                setArticle((prev) => ({ ...prev, primaryKeyword: e.target.value }))
              }
              placeholder="main focus keyword"
            />
          </div>
        </div>

        {/* Tags */}
        <div className="space-y-2">
          <Label>Tags</Label>
          <div className="flex gap-2">
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTag(tagInput);
                }
              }}
              placeholder="Add tag and press Enter"
            />
            <Button type="button" onClick={() => addTag(tagInput)} variant="outline" className="shrink-0">
              Add
            </Button>
          </div>
          {article.tags && article.tags.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {article.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary flex items-center gap-1.5 cursor-pointer hover:bg-primary/20 transition-colors"
                  onClick={() => removeTag(tag)}
                >
                  {tag}
                  <span className="font-bold">×</span>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* SEO Title */}
        <div className="space-y-2">
          <Label htmlFor="seoTitle">SEO Title</Label>
          <Input
            id="seoTitle"
            value={article.seoTitle || ""}
            onChange={(e) => setArticle((prev) => ({ ...prev, seoTitle: e.target.value }))}
            placeholder="Title shown in search results"
            maxLength={60}
          />
          <p className="text-xs text-muted-foreground">{article.seoTitle?.length || 0}/60 characters</p>
        </div>

        {/* Meta Description */}
        <div className="space-y-2">
          <Label htmlFor="metaDescription">Meta Description</Label>
          <textarea
            id="metaDescription"
            value={article.metaDescription || ""}
            onChange={(e) =>
              setArticle((prev) => ({ ...prev, metaDescription: e.target.value }))
            }
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring min-h-[80px] resize-none"
            placeholder="Description shown in search results"
            maxLength={160}
          />
          <p className="text-xs text-muted-foreground">
            {article.metaDescription?.length || 0}/160 characters
          </p>
        </div>

        {/* Content */}
        <div className="space-y-2">
          <Label htmlFor="content">Content * (Markdown)</Label>
          <textarea
            id="content"
            value={article.content || ""}
            onChange={(e) => setArticle((prev) => ({ ...prev, content: e.target.value }))}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring min-h-[400px] resize-vertical"
            placeholder="# Heading&#10;&#10;Write your content in Markdown…"
            required
          />
        </div>

        {/* Publish toggle */}
        <div className="flex items-center gap-2">
          <input
            id="published"
            type="checkbox"
            checked={article.published ?? false}
            onChange={(e) => setArticle((prev) => ({ ...prev, published: e.target.checked }))}
            className="h-4 w-4 rounded border-input"
          />
          <Label htmlFor="published" className="cursor-pointer">
            Publish immediately (uncheck to save as draft)
          </Label>
        </div>

        {error && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs">
            <AlertCircle size={14} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs">
            <CheckCircle2 size={14} className="mt-0.5 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <Button type="submit" disabled={saving} className="gap-2">
            <Send size={14} />
            {saving
              ? "Publishing…"
              : targetSiteId === "blogos-default"
                ? "Save to BlogOS"
                : selectedSite
                  ? `Publish to ${selectedSite.label}`
                  : "Publish"}
          </Button>
          <Link href="/admin/articles">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
