"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Plus, Edit, Trash2, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import type { Article } from "@/types";

export default function AdminArticlesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (user && !user.isAdmin) {
      router.push("/dashboard");
      return;
    }
    fetchArticles();
  }, [user, router]);

  async function fetchArticles() {
    try {
      const res = await fetch("/api/articles");
      const data = await res.json();
      setArticles(data);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;

    setDeleting(id);
    try {
      const res = await fetch(`/api/articles?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setArticles((prev) => prev.filter((a) => a.id !== id));
      }
    } finally {
      setDeleting(null);
    }
  }

  async function togglePublish(article: Article) {
    try {
      await fetch("/api/articles", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: article.id, published: !article.published }),
      });
      setArticles((prev) =>
        prev.map((a) =>
          a.id === article.id ? { ...a, published: !a.published } : a
        )
      );
    } catch (err) {
      console.error("Failed to update article:", err);
    }
  }

  if (!user?.isAdmin) return null;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Articles</h1>
          <p className="text-muted-foreground mt-1">Create and manage company blog posts</p>
        </div>
        <Link href="/admin/articles/create">
          <Button className="gap-2">
            <Plus size={16} />
            New Article
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      ) : articles.length === 0 ? (
        <div className="text-center py-12 rounded-xl border border-dashed border-border">
          <p className="text-muted-foreground mb-4">No articles yet</p>
          <Link href="/admin/articles/create">
            <Button variant="outline">Create first article</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {articles.map((article) => (
            <div
              key={article.id}
              className="flex items-center gap-4 bg-card border border-border rounded-lg p-4 hover:border-primary/40 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground truncate">{article.title}</h3>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                  <span>/{article.slug}</span>
                  {article.category && <span>•</span>}
                  {article.category && <span>{article.category}</span>}
                  <span>•</span>
                  <span>{article.viewCount || 0} views</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => togglePublish(article)}
                  className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                  title={article.published ? "Unpublish" : "Publish"}
                >
                  {article.published ? (
                    <Eye size={18} className="text-green-500" />
                  ) : (
                    <EyeOff size={18} />
                  )}
                </button>
                <button
                  onClick={() => handleDelete(article.id, article.title)}
                  disabled={deleting === article.id}
                  className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-destructive disabled:opacity-50"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
