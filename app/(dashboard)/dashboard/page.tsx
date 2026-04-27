"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { Sparkles, FileText, TrendingUp, ArrowRight, BarChart3 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import CompactThemeToggle from "@/components/theme/CompactThemeToggle";
import WelcomeTrialModal from "@/components/dashboard/WelcomeTrialModal";
import type { Blog } from "@/types";

const PLAN_BADGE: Record<string, string> = {
  free: "bg-muted text-muted-foreground",
  pro: "bg-primary/10 text-primary",
  business: "bg-gradient-to-r from-primary/20 to-accent/20 text-foreground",
};

const PLAN_LABELS: Record<string, string> = {
  free: "Free Plan",
  pro: "Pro Plan",
  business: "Business Plan",
};

export default function Dashboard() {
  const { user } = useAuth();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [blogsLoading, setBlogsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    async function fetchBlogs() {
      setBlogsLoading(true);
      try {
        const q = query(
          collection(db, "blogs"),
          where("userId", "==", user!.uid)
        );
        const snap = await getDocs(q);
        const data = snap.docs.map((d) => d.data() as Blog);
        data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setBlogs(data);
      } finally {
        setBlogsLoading(false);
      }
    }
    fetchBlogs();
  }, [user]);

  if (!user) return null;

  const pct = Math.min(Math.round((user.blogsUsed / user.blogsLimit) * 100), 100);
  const remaining = user.blogsLimit - user.blogsUsed;

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <Suspense fallback={null}>
        <WelcomeTrialModal userName={user.name} trialEndsAt={user.trialEndsAt} />
      </Suspense>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Welcome back, {user.name.split(" ")[0]}
          </h1>
          <p className="text-muted-foreground mt-1">Ready to write content that ranks?</p>
        </div>
        <div className="flex items-center gap-2">
          <CompactThemeToggle />
          <span className={`text-xs px-3 py-1.5 rounded-full font-semibold ${PLAN_BADGE[user.plan]}`}>
            {PLAN_LABELS[user.plan]}
          </span>
        </div>
      </div>

      {/* Trial congratulations banner — persists while trial is active */}
      {user.trialActive && (
        <div className="rounded-xl border border-accent/30 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 px-4 py-3 text-sm text-foreground">
          <p className="font-semibold text-accent">
            🎉 Congrats — you got <span className="text-foreground">Pro free for 1 month</span>!
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            All Pro features are unlocked — 12 blogs per month, WordPress auto-publish, AI featured images and SEO audits.
            {user.trialEndsAt && (
              <>
                {" "}Your trial runs until{" "}
                <span className="font-semibold text-foreground">
                  {new Date(user.trialEndsAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                </span>
                .
              </>
            )}
          </p>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground font-medium">Blog Usage</span>
            <FileText size={15} className="text-muted-foreground" />
          </div>
          <p className="text-2xl font-display font-bold text-foreground">
            {user.blogsUsed}
            <span className="text-base font-normal text-muted-foreground"> / {user.blogsLimit}</span>
          </p>
          <div className="space-y-1">
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  pct >= 90 ? "bg-destructive" : pct >= 70 ? "bg-amber-500" : "bg-primary"
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {remaining > 0
                ? `${remaining} blog${remaining === 1 ? "" : "s"} remaining`
                : "Limit reached — upgrade to continue"}
            </p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground font-medium">Quick Action</span>
            <Sparkles size={15} className="text-muted-foreground" />
          </div>
          <p className="text-sm text-foreground font-medium">
            {remaining > 0 ? "Generate a new SEO blog" : "You've used all your blogs"}
          </p>
          {remaining > 0 ? (
            <Link href="/generate">
              <Button size="sm" className="w-full gap-2">
                <Sparkles size={14} />
                Generate Blog
              </Button>
            </Link>
          ) : (
            <a href="https://wa.me/923290503919?text=Hi%20Esha%2C%20I%20want%20to%20upgrade%20my%20BlogOS%20plan." target="_blank" rel="noopener noreferrer">
              <Button size="sm" variant="outline" className="w-full">Chat with our team</Button>
            </a>
          )}
        </div>

        <div className="bg-card border border-border rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground font-medium">Your Features</span>
            <TrendingUp size={15} className="text-muted-foreground" />
          </div>
          <ul className="space-y-1.5 text-sm">
            <li className="flex items-center gap-2 text-foreground">
              <span className="text-green-500 text-xs">✓</span>
              {user.blogsLimit} high-quality blogs
            </li>
            <li className={`flex items-center gap-2 text-sm ${user.plan !== "free" ? "text-foreground" : "text-muted-foreground line-through"}`}>
              <span className={user.plan !== "free" ? "text-green-500 text-xs" : "text-muted-foreground text-xs"}>
                {user.plan !== "free" ? "✓" : "✗"}
              </span>
              WordPress integration
            </li>
            <li className={`flex items-center gap-2 text-sm ${user.plan === "business" ? "text-foreground" : "text-muted-foreground line-through"}`}>
              <span className={user.plan === "business" ? "text-green-500 text-xs" : "text-muted-foreground text-xs"}>
                {user.plan === "business" ? "✓" : "✗"}
              </span>
              Cluster Engine
            </li>
          </ul>
          {user.plan === "free" && (
            <a href="https://wa.me/923290503919" target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
              Chat with our team
            </a>
          )}
        </div>
      </div>

      {/* Recent blogs */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-display font-semibold text-foreground">Recent Blogs</h2>
          {blogs.length > 3 && (
            <Link href="/profile" className="text-xs text-primary hover:underline">View all</Link>
          )}
        </div>

        {blogsLoading ? (
          <div className="space-y-3">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-20 bg-muted/50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : blogs.length === 0 ? (
          <div className="bg-card border border-dashed border-border rounded-xl p-10 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Sparkles size={20} className="text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground">No blogs yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Generate your first SEO-optimised blog to see it here
              </p>
            </div>
            <Link href="/generate">
              <Button size="sm" className="gap-2">
                <Sparkles size={14} />
                Write your first blog
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {blogs.slice(0, 5).map((blog) => {
              const hasContent = blog.wordCount > 0;
              return (
                <Link
                  key={blog.id}
                  href={`/blog/${blog.id}`}
                  className="flex items-center gap-4 bg-card border border-border rounded-xl p-4 hover:border-primary/40 transition-colors group"
                >
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <FileText size={15} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{blog.seoTitle}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground capitalize">{blog.contentType}</span>
                      <span className="text-xs text-muted-foreground">·</span>
                      <span className="text-xs text-muted-foreground">{blog.region}</span>
                      {hasContent && (
                        <>
                          <span className="text-xs text-muted-foreground">·</span>
                          <span className="text-xs text-muted-foreground">{blog.wordCount.toLocaleString()} words</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {blog.aiScore > 0 && (
                      <div className="flex items-center gap-1">
                        <BarChart3 size={11} className="text-muted-foreground" />
                        <span className={`text-xs font-semibold ${blog.aiScore >= 80 ? "text-green-500" : blog.aiScore >= 60 ? "text-amber-500" : "text-destructive"}`}>
                          {blog.aiScore}
                        </span>
                      </div>
                    )}
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${hasContent ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" : "bg-muted text-muted-foreground"}`}>
                      {hasContent ? "Written" : "Research only"}
                    </span>
                    <ArrowRight size={14} className="text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
