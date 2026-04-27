import { NextRequest, NextResponse } from "next/server";
import groq from "@/lib/groq/client";
import { workbookPrompt, parseGroqJSON } from "@/lib/groq/prompts";
import type { ContentType, Workbook } from "@/types";
import { NLP_CATEGORIES } from "@/types";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { niche, topic, region, contentType } = (await req.json()) as {
      niche?: string;
      topic: string;
      region: string;
      contentType: ContentType;
    };

    if (!topic || !region || !contentType) {
      return NextResponse.json(
        { error: "topic, region, and contentType are required" },
        { status: 400 }
      );
    }

    const prompt = workbookPrompt(topic, region, contentType, niche ?? "");

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: prompt.system },
        { role: "user", content: prompt.user },
      ],
      temperature: 0.45,
      max_tokens: 6000,
      response_format: { type: "json_object" },
    });

    const text = completion.choices[0]?.message?.content ?? "{}";
    const workbook = parseGroqJSON<Workbook>(text);

    /* Enforce the 10-category contract — fill any missing buckets with [] */
    const categories = workbook.sheet1?.categories ?? ({} as Workbook["sheet1"]["categories"]);
    for (const cat of NLP_CATEGORIES) {
      if (!Array.isArray(categories[cat])) categories[cat] = [];
    }
    workbook.sheet1 = { categories };

    /* Ensure downstream arrays exist */
    workbook.sheet2 = workbook.sheet2 ?? { clusters: [] };
    workbook.sheet3 = workbook.sheet3 ?? { ranking: [], gaps: [], opportunities: [] };
    workbook.sheet4 = workbook.sheet4 ?? { groups: [] };

    return NextResponse.json(workbook);
  } catch (err) {
    console.error("[workbook]", err);
    return NextResponse.json({ error: "Failed to generate workbook" }, { status: 500 });
  }
}
