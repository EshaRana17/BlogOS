import { NextRequest, NextResponse } from "next/server";
import groq from "@/lib/groq/client";
import { keywordsPrompt, buildCompetitorInsights, parseGroqJSON } from "@/lib/groq/prompts";
import type { ContentType, KeywordData, ScrapedPage } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const { niche, topic, region, contentType, pages, useFallback } = await req.json() as {
      niche?: string;
      topic: string;
      region: string;
      contentType: ContentType;
      pages: ScrapedPage[];
      useFallback: boolean;
    };

    if (!topic || !region || !contentType) {
      return NextResponse.json({ error: "topic, region, and contentType are required" }, { status: 400 });
    }

    const pageContent = buildCompetitorInsights(pages ?? [], 6000);
    const prompt = keywordsPrompt(topic, region, contentType, pageContent, useFallback ?? true, niche ?? "");

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: prompt.system },
        { role: "user", content: prompt.user },
      ],
      temperature: 0.4,
      max_tokens: 1024,
      response_format: { type: "json_object" },
    });

    const text = completion.choices[0]?.message?.content ?? "{}";
    const keywords = parseGroqJSON<KeywordData>(text);

    return NextResponse.json(keywords);
  } catch (err) {
    console.error("[keywords]", err);
    return NextResponse.json({ error: "Failed to extract keywords" }, { status: 500 });
  }
}
