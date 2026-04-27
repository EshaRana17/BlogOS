import { NextRequest, NextResponse } from "next/server";
import groq from "@/lib/groq/client";
import { structurePrompt, buildCompetitorInsights, parseGroqJSON } from "@/lib/groq/prompts";
import type { ContentType, BlogSection, ScrapedPage } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const { niche, topic, region, contentType, primaryKeyword, secondaryKeywords, pages, useFallback } =
      await req.json() as {
        niche?: string;
        topic: string;
        region: string;
        contentType: ContentType;
        primaryKeyword: string;
        secondaryKeywords: string[];
        pages: ScrapedPage[];
        useFallback: boolean;
      };

    if (!topic || !region || !contentType || !primaryKeyword) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const competitorInsights = buildCompetitorInsights(pages ?? [], 6000);
    const prompt = structurePrompt(
      topic,
      region,
      contentType,
      primaryKeyword,
      secondaryKeywords ?? [],
      competitorInsights,
      useFallback ?? true,
      niche ?? ""
    );

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: prompt.system },
        { role: "user", content: prompt.user },
      ],
      temperature: 0.5,
      max_tokens: 2048,
      response_format: { type: "json_object" },
    });

    const text = completion.choices[0]?.message?.content ?? "{}";
    const parsed = parseGroqJSON<{ sections: BlogSection[] }>(text);
    const sections: BlogSection[] = parsed.sections ?? [];

    return NextResponse.json({ sections });
  } catch (err) {
    console.error("[structure]", err);
    return NextResponse.json({ error: "Failed to generate structure" }, { status: 500 });
  }
}
