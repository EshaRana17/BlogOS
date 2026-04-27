import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import groq from "@/lib/groq/client";
import {
  keywordsPrompt,
  structurePrompt,
  writeSectionPrompt,
  seoScorePrompt,
  schemaPrompt,
  buildCompetitorInsights,
  parseGroqJSON,
  fallbackCompetitorPrompt,
} from "@/lib/groq/prompts";
import type {
  Blog,
  BlogSection,
  ClusterPlan,
  KeywordData,
  ScrapedPage,
} from "@/types";
import firecrawl from "@/lib/firecrawl/client";

export const runtime = "nodejs";
export const maxDuration = 300;

/* Assemble competitive context: Firecrawl first, Groq fallback if blocked. */
async function getCompetitiveContext(topic: string, region: string) {
  try {
    const results = await firecrawl.search(`${topic} ${region}`, { limit: 5 });
    if (results?.data?.length) {
      const pages: ScrapedPage[] = results.data
        .filter((r) => !!r.url)
        .map((r) => ({
          url: r.url ?? "",
          title: (r.metadata?.title as string | undefined) ?? r.url ?? "",
          content: (r.markdown as string | undefined) ?? "",
          blocked: !(r.markdown as string | undefined) || (r.markdown as string).length < 100,
        }))
        .filter((p) => !p.blocked && p.url !== "")
        .slice(0, 5);
      if (pages.length > 0) return { pages, useFallback: false };
    }
  } catch (err) {
    console.warn("[cluster-day] firecrawl failed, using groq fallback", err);
  }

  const prompt = fallbackCompetitorPrompt(topic, region);
  const res = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: prompt.system },
      { role: "user", content: prompt.user },
    ],
    temperature: 0.4,
    max_tokens: 3000,
    response_format: { type: "json_object" },
  });
  const parsed = parseGroqJSON<{ pages: Array<{ url: string; title: string; content: string }> }>(
    res.choices[0]?.message?.content ?? "{}"
  );
  const pages: ScrapedPage[] = (parsed.pages ?? []).slice(0, 5).map((p) => ({
    url: p.url,
    title: p.title,
    content: p.content,
    blocked: false,
  }));
  return { pages, useFallback: true };
}

export async function POST(req: NextRequest) {
  try {
    const session = cookies().get("session")?.value;
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const decoded = await adminAuth.verifySessionCookie(session, true).catch(() => null);
    if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { clusterId, day } = (await req.json()) as { clusterId: string; day: number };
    if (!clusterId || !day) return NextResponse.json({ error: "Missing clusterId or day" }, { status: 400 });

    const clusterRef = adminDb.collection("clusters").doc(clusterId);
    const snap = await clusterRef.get();
    if (!snap.exists) return NextResponse.json({ error: "Cluster not found" }, { status: 404 });
    const cluster = snap.data() as ClusterPlan;
    if (cluster.userId !== decoded.uid) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const dayIdx = cluster.days.findIndex((d) => d.day === day);
    if (dayIdx === -1) return NextResponse.json({ error: "Day not found" }, { status: 404 });
    const entry = cluster.days[dayIdx];
    if (entry.status === "done" && entry.blogId) {
      return NextResponse.json({ blogId: entry.blogId, alreadyGenerated: true });
    }

    /* Mark generating */
    const updatedDays = [...cluster.days];
    updatedDays[dayIdx] = { ...entry, status: "generating" };
    await clusterRef.update({ days: updatedDays });

    /* 1. Competitive context (Firecrawl or Groq fallback) */
    const { pages, useFallback } = await getCompetitiveContext(entry.title, cluster.region);
    const insights = buildCompetitorInsights(pages, 4000);

    /* 2. Keywords — if cluster day already has keywords, skip Groq call */
    let keywords: KeywordData;
    if (entry.primaryKeyword && entry.secondaryKeywords) {
      keywords = {
        primaryKeyword: entry.primaryKeyword,
        secondaryKeywords: entry.secondaryKeywords.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 4),
        semanticKeywords: [],
        seoTitle: entry.title,
        metaDescription: entry.notes || `${entry.title} — ${entry.cta}`,
        permalink: entry.slug,
      };
    } else {
      const p = keywordsPrompt(entry.title, cluster.region, cluster.contentType, insights, useFallback, cluster.niche);
      const c = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "system", content: p.system }, { role: "user", content: p.user }],
        temperature: 0.4,
        max_tokens: 1024,
        response_format: { type: "json_object" },
      });
      keywords = parseGroqJSON<KeywordData>(c.choices[0]?.message?.content ?? "{}");
    }
    /* Always use pre-registered permalink, never let Groq overwrite it */
    keywords.permalink = entry.slug;
    if (!keywords.semanticKeywords || keywords.semanticKeywords.length === 0) {
      keywords.semanticKeywords = [];
    }

    /* 3. Structure */
    const sp = structurePrompt(
      entry.title,
      cluster.region,
      cluster.contentType,
      keywords.primaryKeyword,
      keywords.secondaryKeywords,
      insights,
      useFallback,
      cluster.niche
    );
    const structRes = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "system", content: sp.system }, { role: "user", content: sp.user }],
      temperature: 0.5,
      max_tokens: 2048,
      response_format: { type: "json_object" },
    });
    const { sections }: { sections: BlogSection[] } = parseGroqJSON(
      structRes.choices[0]?.message?.content ?? "{}"
    );

    /* 4. Write all 10 sections (non-streaming — batch-mode) */
    const sectionContents: string[] = [];
    for (let i = 0; i < sections.length; i++) {
      const wp = writeSectionPrompt(
        sections[i],
        i,
        sections.length,
        entry.title,
        keywords.primaryKeyword,
        keywords.secondaryKeywords,
        keywords.semanticKeywords,
        cluster.contentType,
        cluster.region,
        cluster.niche
      );
      const res = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "system", content: wp.system }, { role: "user", content: wp.user }],
        temperature: 0.6,
        max_tokens: 300,
      });
      sectionContents.push(res.choices[0]?.message?.content?.trim() ?? "");
    }

    const fullContent = sectionContents.join("\n\n");
    const wordCount = fullContent.split(/\s+/).filter(Boolean).length;

    /* 5. Resolve internal links — any slug that exists in the cluster becomes a live URL */
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
    const internalLinks = (entry.internalLinks ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s && cluster.permalinkIndex[s] !== undefined)
      .map((slug) => {
        const linkedDay = cluster.days[cluster.permalinkIndex[slug] - 1];
        return {
          slug,
          anchor: linkedDay?.title ?? slug,
          url: `${appUrl}/blog/${slug}`,
        };
      });

    /* 6. SEO Score + Schema (parallel) */
    const [scoreRes, schemaRes] = await Promise.all([
      groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: (() => {
          const s = seoScorePrompt(fullContent, keywords.primaryKeyword, keywords.secondaryKeywords, entry.title, keywords.metaDescription);
          return [{ role: "system" as const, content: s.system }, { role: "user" as const, content: s.user }];
        })(),
        temperature: 0.2,
        max_tokens: 512,
        response_format: { type: "json_object" },
      }),
      groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: (() => {
          const s = schemaPrompt(entry.title, entry.title, keywords.metaDescription, keywords.primaryKeyword, entry.slug, appUrl);
          return [{ role: "system" as const, content: s.system }, { role: "user" as const, content: s.user }];
        })(),
        temperature: 0.1,
        max_tokens: 512,
        response_format: { type: "json_object" },
      }),
    ]);

    const scoreData = parseGroqJSON<{ score: number; breakdown: Record<string, number>; suggestions: string[] }>(
      scoreRes.choices[0]?.message?.content ?? "{}"
    );
    const schemaJson = schemaRes.choices[0]?.message?.content ?? "{}";

    /* 7. Save Blog */
    const now = new Date().toISOString();
    const blogId = `${decoded.uid}_${Date.now()}_d${day}`;
    const blog: Blog = {
      id: blogId,
      userId: decoded.uid,
      niche: cluster.niche,
      topic: entry.title,
      region: cluster.region,
      contentType: cluster.contentType,
      primaryKeyword: keywords.primaryKeyword,
      secondaryKeywords: keywords.secondaryKeywords,
      semanticKeywords: keywords.semanticKeywords,
      seoTitle: entry.title,
      metaDescription: keywords.metaDescription,
      permalink: entry.slug,
      content: fullContent,
      wordCount,
      aiScore: scoreData.score ?? 0,
      schema: schemaJson,
      featuredImageUrl: "",
      featuredImagePrompt: "",
      externalLink: pages[0]?.url ?? "",
      scrapedUrls: pages.map((p) => p.url),
      status: "draft",
      clusterId,
      clusterDay: day,
      internalLinks,
      createdAt: now,
      updatedAt: now,
    };

    await adminDb.collection("blogs").doc(blogId).set(blog);

    /* Link permalink → blog */
    await adminDb.collection("permalinks").doc(entry.slug).set({ blogId }, { merge: true });

    /* Update cluster day status */
    const finalDays = [...cluster.days];
    finalDays[dayIdx] = { ...entry, status: "done", blogId, generatedAt: now };
    await clusterRef.update({ days: finalDays });

    /* Increment user's blogsUsed */
    await adminDb
      .collection("users")
      .doc(decoded.uid)
      .update({ blogsUsed: FieldValue.increment(1), lastActive: now })
      .catch(() => { /* best effort */ });

    return NextResponse.json({ blogId, day, wordCount, aiScore: blog.aiScore });
  } catch (err) {
    console.error("[cluster/generate-day]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to generate day" },
      { status: 500 }
    );
  }
}
