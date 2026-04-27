import { NextRequest, NextResponse } from "next/server";
import firecrawl from "@/lib/firecrawl/client";
import groq from "@/lib/groq/client";
import { fallbackCompetitorPrompt, parseGroqJSON } from "@/lib/groq/prompts";
import type { ScrapedPage } from "@/types";

export const runtime = "nodejs";
export const maxDuration = 60;

async function synthesizeFallback(topic: string, region: string): Promise<ScrapedPage[]> {
  const prompt = fallbackCompetitorPrompt(topic, region || "global");
  const completion = await groq.chat.completions.create({
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
    completion.choices[0]?.message?.content ?? "{}"
  );
  return (parsed.pages ?? []).slice(0, 5).map((p) => ({
    url: p.url,
    title: p.title,
    content: p.content,
    blocked: false,
  }));
}

export async function POST(req: NextRequest) {
  try {
    const { topic, region } = await req.json();
    if (!topic) {
      return NextResponse.json({ error: "topic is required" }, { status: 400 });
    }

    const query = region ? `${topic} ${region}` : topic;

    let pages: ScrapedPage[] = [];
    let useFallback = false;

    try {
      const results = await firecrawl.search(query, { limit: 5 });

      if (results?.data && results.data.length > 0) {
        pages = results.data
          .filter((r) => !!r.url)
          .map((r) => ({
            url: r.url ?? "",
            title: (r.metadata?.title as string | undefined) ?? r.url ?? "",
            content: (r.markdown as string | undefined) ?? "",
            blocked:
              !(r.markdown as string | undefined) ||
              ((r.markdown as string).length < 100),
          }))
          .filter((p) => !p.blocked && p.url !== "")
          .slice(0, 5);
      }

      if (pages.length === 0) useFallback = true;
    } catch (err) {
      console.warn("[scrape] firecrawl threw, falling back to groq:", err);
      useFallback = true;
    }

    /* Override #2 — if Firecrawl is blocked/empty, synthesise competitive data
       via Groq so the pipeline never stops. */
    if (useFallback) {
      try {
        pages = await synthesizeFallback(topic, region ?? "");
      } catch (err) {
        console.error("[scrape] groq fallback also failed:", err);
        pages = [];
      }
    }

    return NextResponse.json({ pages, useFallback });
  } catch (err) {
    console.error("[scrape]", err);
    return NextResponse.json({ pages: [], useFallback: true });
  }
}
