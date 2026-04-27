"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/hooks/useAuth";
import ReactMarkdown from "react-markdown";
import Link from "next/link";
import { ArrowLeft, Sparkles, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ProgressTracker } from "@/components/generate/ProgressTracker";
import type { Blog, BlogSection, PipelineStep } from "@/types";

const WRITING_STEPS: PipelineStep[] = [
  { id: "writing", label: "Writing blog content", status: "pending" },
  { id: "seo",     label: "Calculating SEO score", status: "pending" },
  { id: "schema",  label: "Generating schema markup", status: "pending" },
  { id: "saving",  label: "Saving your blog", status: "pending" },
];

function stepSet(steps: PipelineStep[], id: string, status: PipelineStep["status"], detail?: string): PipelineStep[] {
  return steps.map((s) => (s.id === id ? { ...s, status, detail } : s));
}

export default function BlogEditorPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();

  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [steps, setSteps] = useState<PipelineStep[]>(WRITING_STEPS);
  const [streamContent, setStreamContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user || !id) return;
    getDoc(doc(db, "blogs", id as string)).then((snap) => {
      if (!snap.exists()) { router.push("/dashboard"); return; }
      const data = { ...snap.data(), id: snap.id } as Blog;
      if (data.userId !== user.uid) { router.push("/dashboard"); return; }
      setBlog(data);
      setLoading(false);
    }).catch(() => { router.push("/dashboard"); });
  }, [user, id, router]);

  function getSections(): BlogSection[] {
    if (!blog) return [];
    try { return JSON.parse(blog.content) as BlogSection[]; } catch { return []; }
  }

  async function generateContent() {
    if (!blog) return;
    setGenerating(true);
    setError(null);
    setStreamContent("");
    setSteps(WRITING_STEPS);

    const sections = getSections();

    try {
      const res = await fetch("/api/generate/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blogId: blog.id,
          niche: blog.niche,
          topic: blog.topic,
          region: blog.region,
          contentType: blog.contentType,
          primaryKeyword: blog.primaryKeyword,
          secondaryKeywords: blog.secondaryKeywords,
          semanticKeywords: blog.semanticKeywords,
          seoTitle: blog.seoTitle,
          metaDescription: blog.metaDescription,
          permalink: blog.permalink,
          sections,
        }),
      });

      if (!res.ok || !res.body) throw new Error("Content generation failed to start");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullContent = "";
      let lastEvent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (line.startsWith("event: ")) {
            lastEvent = line.slice(7).trim();
          } else if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (lastEvent === "token" && data.token) {
                fullContent += data.token;
                setStreamContent(fullContent);
              } else if (lastEvent === "status") {
                if (data.message?.includes("SEO")) {
                  setSteps((s) => stepSet(s, "writing", "done"));
                  setSteps((s) => stepSet(s, "seo", "running"));
                } else if (data.message?.includes("schema")) {
                  setSteps((s) => stepSet(s, "seo", "done"));
                  setSteps((s) => stepSet(s, "schema", "running"));
                } else if (data.message?.includes("Saving")) {
                  setSteps((s) => stepSet(s, "schema", "done"));
                  setSteps((s) => stepSet(s, "saving", "running"));
                }
              } else if (lastEvent === "done") {
                setSteps((s) => stepSet(s, "saving", "done", `${data.wordCount?.toLocaleString()} words`));
                setBlog((prev) =>
                  prev
                    ? { ...prev, content: fullContent, wordCount: data.wordCount ?? 0, aiScore: data.aiScore ?? 0 }
                    : prev
                );
              } else if (lastEvent === "section_start") {
                if (fullContent === "") {
                  setSteps((s) => stepSet(s, "writing", "running", `Writing section 1…`));
                }
              } else if (lastEvent === "section_done") {
                setSteps((s) =>
                  stepSet(s, "writing", "running", `Section ${(data.index ?? 0) + 1} done`)
                );
              } else if (lastEvent === "error") {
                throw new Error(data.message ?? "Unknown error");
              }
            } catch (parseErr) {
              if (parseErr instanceof Error && parseErr.message !== "Unknown error") {
                // ignore JSON parse noise from partial lines
              } else {
                throw parseErr;
              }
            }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Content generation failed");
      setSteps((s) => s.map((step) => step.status === "running" ? { ...step, status: "error" } : step));
    } finally {
      setGenerating(false);
    }
  }

  async function copyContent() {
    const content = blog && blog.wordCount > 0 ? blog.content : streamContent;
    if (!content) return;
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <span className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!blog) return null;

  const hasContent = blog.wordCount > 0;
  const sections = getSections();
  const displayContent = hasContent ? blog.content : streamContent;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors shrink-0">
            <ArrowLeft size={18} />
          </Link>
          <div className="min-w-0">
            <h1 className="text-xl font-display font-bold text-foreground truncate">{blog.seoTitle}</h1>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{blog.topic} · {blog.region}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {displayContent && (
            <Button variant="outline" size="sm" onClick={copyContent}>
              {copied ? <Check size={13} /> : <Copy size={13} />}
              {copied ? "Copied!" : "Copy"}
            </Button>
          )}
          {!hasContent && !generating && (
            <Button size="sm" onClick={generateContent}>
              <Sparkles size={13} />
              Generate Content
            </Button>
          )}
          {hasContent && !generating && (
            <Button variant="outline" size="sm" onClick={generateContent}>
              <Sparkles size={13} />
              Regenerate
            </Button>
          )}
        </div>
      </div>

      {/* SEO meta strip */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">SEO Data</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-muted-foreground">Primary keyword: </span>
            <span className="font-medium text-foreground">{blog.primaryKeyword}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Permalink: </span>
            <span className="font-mono text-foreground">/blog/{blog.permalink}</span>
          </div>
          <div className="sm:col-span-2">
            <span className="text-muted-foreground">Meta: </span>
            <span className="text-foreground">{blog.metaDescription}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5 pt-1">
          {blog.secondaryKeywords.map((kw) => (
            <span key={kw} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
              {kw}
            </span>
          ))}
        </div>
      </div>

      {/* Generation progress */}
      {generating && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <p className="text-sm font-semibold text-foreground">Writing your blog…</p>
          <ProgressTracker steps={steps} />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          {error}
        </div>
      )}

      {/* Generated content */}
      {displayContent ? (
        <div className="bg-card border border-border rounded-xl p-6">
          {hasContent && (
            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-border">
              <span className="text-xs text-muted-foreground">{blog.wordCount.toLocaleString()} words</span>
              {blog.aiScore > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 font-medium">
                  SEO {blog.aiScore}/100
                </span>
              )}
            </div>
          )}
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown
              components={{
                h2: ({ children }) => (
                  <h2 className="text-xl font-display font-bold text-foreground mt-8 mb-3">{children}</h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-lg font-semibold text-foreground mt-5 mb-2">{children}</h3>
                ),
                p: ({ children }) => (
                  <p className="text-foreground leading-relaxed mb-4">{children}</p>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc list-inside space-y-1.5 mb-4 text-foreground">{children}</ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal list-inside space-y-1.5 mb-4 text-foreground">{children}</ol>
                ),
                li: ({ children }) => <li className="text-foreground">{children}</li>,
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-primary pl-4 italic text-muted-foreground my-4">
                    {children}
                  </blockquote>
                ),
                a: ({ href, children }) => (
                  <a href={href} className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                    {children}
                  </a>
                ),
                code: ({ children }) => (
                  <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-foreground">{children}</code>
                ),
                pre: ({ children }) => (
                  <pre className="bg-muted p-4 rounded-lg overflow-x-auto mb-4">{children}</pre>
                ),
              }}
            >
              {displayContent}
            </ReactMarkdown>
          </div>
        </div>
      ) : !generating && sections.length > 0 ? (
        /* Outline preview before content is generated */
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <p className="text-sm font-semibold text-foreground">Blog Outline — {sections.length} sections planned</p>
          <div className="space-y-2">
            {sections.map((s, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/40">
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-semibold uppercase shrink-0 mt-0.5">
                  {s.sectionType}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{s.h2}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{s.intent}</p>
                </div>
              </div>
            ))}
          </div>
          <Button className="w-full" onClick={generateContent}>
            <Sparkles size={14} />
            Write Full Blog Content
          </Button>
        </div>
      ) : null}
    </div>
  );
}
