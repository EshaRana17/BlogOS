import { NextRequest } from "next/server";
import groq from "@/lib/groq/client";
import {
  writeSectionPrompt,
  seoScorePrompt,
  schemaPrompt,
  parseGroqJSON,
} from "@/lib/groq/prompts";
import { adminDb } from "@/lib/firebase/admin";
import type { BlogSection, ContentType } from "@/types";

function send(controller: ReadableStreamDefaultController, event: string, data: unknown) {
  const chunk = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  controller.enqueue(new TextEncoder().encode(chunk));
}

export async function POST(req: NextRequest) {
  const {
    blogId,
    niche,
    topic,
    region,
    contentType,
    primaryKeyword,
    secondaryKeywords,
    semanticKeywords,
    seoTitle,
    metaDescription,
    permalink,
    sections,
  } = await req.json() as {
    blogId: string;
    niche?: string;
    topic: string;
    region: string;
    contentType: ContentType;
    primaryKeyword: string;
    secondaryKeywords: string[];
    semanticKeywords: string[];
    seoTitle: string;
    metaDescription: string;
    permalink: string;
    sections: BlogSection[];
  };

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const sectionContents: string[] = [];

        // Write each section
        for (let i = 0; i < sections.length; i++) {
          const section = sections[i];
          send(controller, "section_start", { index: i, h2: section.h2, type: section.sectionType });

          const prompt = writeSectionPrompt(
            section,
            i,
            sections.length,
            topic,
            primaryKeyword,
            secondaryKeywords,
            semanticKeywords,
            contentType,
            region,
            niche ?? ""
          );

          let sectionText = "";
          const stream = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
              { role: "system", content: prompt.system },
              { role: "user", content: prompt.user },
            ],
            temperature: 0.6,
            max_tokens: 600,
            stream: true,
          });

          for await (const chunk of stream) {
            const delta = chunk.choices[0]?.delta?.content ?? "";
            sectionText += delta;
            if (delta) send(controller, "token", { index: i, token: delta });
          }

          sectionContents.push(sectionText.trim());
          send(controller, "section_done", { index: i });
        }

        const fullContent = sectionContents.join("\n\n");
        const wordCount = fullContent.split(/\s+/).filter(Boolean).length;

        // SEO score
        send(controller, "status", { message: "Calculating SEO score…" });
        const scorePrompt = seoScorePrompt(fullContent, primaryKeyword, secondaryKeywords, seoTitle, metaDescription);
        const scoreRes = await groq.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: scorePrompt.system },
            { role: "user", content: scorePrompt.user },
          ],
          temperature: 0.2,
          max_tokens: 512,
          response_format: { type: "json_object" },
        });
        const scoreData = parseGroqJSON<{ score: number; breakdown: Record<string, number>; suggestions: string[] }>(
          scoreRes.choices[0]?.message?.content ?? "{}"
        );

        // Schema markup
        send(controller, "status", { message: "Generating schema markup…" });
        const schemaP = schemaPrompt(topic, seoTitle, metaDescription, primaryKeyword, permalink, process.env.NEXT_PUBLIC_APP_URL ?? "");
        const schemaRes = await groq.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: schemaP.system },
            { role: "user", content: schemaP.user },
          ],
          temperature: 0.1,
          max_tokens: 512,
          response_format: { type: "json_object" },
        });
        const schemaJson = schemaRes.choices[0]?.message?.content ?? "{}";

        // Save to Firestore
        send(controller, "status", { message: "Saving…" });
        await adminDb.collection("blogs").doc(blogId).update({
          content: fullContent,
          wordCount,
          aiScore: scoreData.score ?? 0,
          schema: schemaJson,
          updatedAt: new Date().toISOString(),
        });

        send(controller, "done", {
          wordCount,
          aiScore: scoreData.score,
          breakdown: scoreData.breakdown,
          suggestions: scoreData.suggestions,
          schema: schemaJson,
        });
      } catch (err) {
        send(controller, "error", { message: err instanceof Error ? err.message : "Generation failed" });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
