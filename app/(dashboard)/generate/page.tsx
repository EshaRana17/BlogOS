"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { TopicForm } from "@/components/generate/TopicForm";
import { ProgressTracker } from "@/components/generate/ProgressTracker";
import { AlertCircle, FileText } from "lucide-react";
import type { Blog, BlogSection, ContentType, KeywordData, PipelineStep, ScrapedPage } from "@/types";

const INITIAL_STEPS: PipelineStep[] = [
  { id: "scrape", label: "Scraping competitor pages", status: "pending" },
  { id: "keywords", label: "Extracting SEO keywords", status: "pending" },
  { id: "structure", label: "Building blog structure", status: "pending" },
  { id: "save", label: "Saving research data", status: "pending" },
];

function setStep(
  steps: PipelineStep[],
  id: string,
  status: PipelineStep["status"],
  detail?: string
): PipelineStep[] {
  return steps.map((s) => (s.id === id ? { ...s, status, detail } : s));
}

export default function GeneratePage() {
  const { user } = useAuth();
  const router = useRouter();

  const [steps, setSteps] = useState<PipelineStep[]>(INITIAL_STEPS);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [brainstormLoading, setBrainstormLoading] = useState(false);

  async function brainstorm(niche: string, region: string) {
    if (!niche || !region) return;
    setBrainstormLoading(true);
    try {
      const res = await fetch("/api/generate/brainstorm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ niche, region }),
      });
      const data = await res.json();
      if (data.topics) setSuggestions(data.topics);
    } finally {
      setBrainstormLoading(false);
    }
  }

  async function runPipeline(formData: {
    niche: string;
    topic: string;
    region: string;
    contentType: ContentType;
  }) {
    if (!user) return;
    setRunning(true);
    setError(null);
    setSteps(INITIAL_STEPS);

    const { niche, topic, region, contentType } = formData;

    try {
      // Step 1: Scrape
      setSteps((s) => setStep(s, "scrape", "running"));
      const scrapeRes = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, region }),
      });
      const { pages, useFallback } = (await scrapeRes.json()) as {
        pages: ScrapedPage[];
        useFallback: boolean;
      };
      setSteps((s) =>
        setStep(
          s,
          "scrape",
          "done",
          useFallback ? "Using AI knowledge (no live data)" : `${pages.length} pages scraped`
        )
      );

      // Step 2: Keywords
      setSteps((s) => setStep(s, "keywords", "running"));
      const kwRes = await fetch("/api/keywords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ niche, topic, region, contentType, pages, useFallback }),
      });
      if (!kwRes.ok) throw new Error("Keyword extraction failed");
      const keywords: KeywordData = await kwRes.json();
      setSteps((s) =>
        setStep(s, "keywords", "done", `Primary: "${keywords.primaryKeyword}"`)
      );

      // Step 3: Structure
      setSteps((s) => setStep(s, "structure", "running"));
      const structRes = await fetch("/api/generate/structure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          niche,
          topic,
          region,
          contentType,
          primaryKeyword: keywords.primaryKeyword,
          secondaryKeywords: keywords.secondaryKeywords,
          pages,
          useFallback,
        }),
      });
      if (!structRes.ok) throw new Error("Structure generation failed");
      const { sections }: { sections: BlogSection[] } = await structRes.json();
      setSteps((s) => setStep(s, "structure", "done", `${sections.length} sections planned`));

      // Step 4: Save via server-side API (uses admin SDK, bypasses Firestore rules)
      setSteps((s) => setStep(s, "save", "running"));
      const blogId = `${user.uid}_${Date.now()}`;
      const now = new Date().toISOString();

      const blogDoc: Blog = {
        id: blogId,
        userId: user.uid,
        niche,
        topic,
        region,
        contentType,
        primaryKeyword: keywords.primaryKeyword,
        secondaryKeywords: keywords.secondaryKeywords,
        semanticKeywords: keywords.semanticKeywords,
        seoTitle: keywords.seoTitle,
        metaDescription: keywords.metaDescription,
        permalink: keywords.permalink,
        content: JSON.stringify(sections),
        wordCount: 0,
        aiScore: 0,
        schema: "",
        featuredImageUrl: "",
        featuredImagePrompt: "",
        externalLink: "",
        scrapedUrls: pages.map((p) => p.url),
        status: "draft",
        createdAt: now,
        updatedAt: now,
      };

      const saveRes = await fetch("/api/blogs/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...blogDoc, blogId }),
      });
      if (!saveRes.ok) {
        const err = await saveRes.json().catch(() => ({}));
        throw new Error(err.error ?? "Failed to save research data");
      }

      setSteps((s) => setStep(s, "save", "done", "Research saved"));

      router.push(`/generate/blog/${blogId}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Pipeline failed";
      setError(msg);
      setSteps((s) =>
        s.map((step) =>
          step.status === "running" ? { ...step, status: "error" } : step
        )
      );
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Generate Blog</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Enter your topic and we&apos;ll research, plan, and write a full SEO-optimised blog post.
        </p>
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        <TopicForm
          onSubmit={runPipeline}
          loading={running}
          onBrainstorm={brainstorm}
          brainstormLoading={brainstormLoading}
          suggestions={suggestions}
        />
      </div>

      {(running || steps.some((s) => s.status !== "pending")) && (
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <FileText size={15} className="text-muted-foreground" />
            <p className="text-sm font-semibold text-foreground">Research Pipeline</p>
          </div>
          <ProgressTracker steps={steps} />
        </div>
      )}

      {error && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          <AlertCircle size={15} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
