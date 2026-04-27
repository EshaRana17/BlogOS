import { NextRequest, NextResponse } from "next/server";
import groq from "@/lib/groq/client";
import { brainstormPrompt, parseGroqJSON } from "@/lib/groq/prompts";

export async function POST(req: NextRequest) {
  try {
    const { niche, region } = await req.json();
    if (!niche || !region) {
      return NextResponse.json({ error: "niche and region are required" }, { status: 400 });
    }

    const prompt = brainstormPrompt(niche, region);
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: prompt.system },
        { role: "user", content: prompt.user },
      ],
      temperature: 0.7,
      max_tokens: 512,
    });

    const text = completion.choices[0]?.message?.content ?? "[]";
    const topics = parseGroqJSON<string[]>(text);

    return NextResponse.json({ topics });
  } catch (err) {
    console.error("[brainstorm]", err);
    return NextResponse.json({ error: "Failed to brainstorm topics" }, { status: 500 });
  }
}
