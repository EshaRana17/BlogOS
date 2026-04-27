import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import groq from "@/lib/groq/client";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { clusterPrompt, parseGroqJSON } from "@/lib/groq/prompts";
import { slugify } from "@/lib/utils";
import type { ClusterDay, ClusterPlan, ContentType, Workbook } from "@/types";

export const runtime = "nodejs";
export const maxDuration = 90;

function daysFromToday(offset: number) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

/* Builds the Firestore-safe cluster day, guaranteeing a non-colliding slug */
function normalizeDays(
  raw: Array<Partial<ClusterDay>>,
  usedSlugs: Set<string>
): ClusterDay[] {
  return raw.slice(0, 30).map((r, idx) => {
    const dayNum = r.day ?? idx + 1;
    let baseSlug = slugify(r.permalink ?? r.title ?? `day-${dayNum}`);
    if (!baseSlug) baseSlug = `day-${dayNum}`;
    let slug = baseSlug;
    let n = 1;
    while (usedSlugs.has(slug)) {
      slug = `${baseSlug}-${++n}`;
    }
    usedSlugs.add(slug);

    return {
      day: dayNum,
      date: r.date ?? daysFromToday(idx),
      title: r.title ?? `Untitled Day ${dayNum}`,
      intent: r.intent ?? "informational",
      sentiment: r.sentiment ?? "neutral",
      targetQuery: r.targetQuery ?? "",
      nlpCategory: r.nlpCategory ?? "Synonyms",
      funnel: r.funnel ?? "TOFU",
      format: r.format ?? "guide",
      wordCount: r.wordCount ?? "1500",
      cta: r.cta ?? "",
      internalLinks: r.internalLinks ?? "",
      permalink: slug,
      slug,
      primaryKeyword: r.primaryKeyword ?? "",
      secondaryKeywords: r.secondaryKeywords ?? "",
      notes: r.notes ?? "",
      status: "pending",
    } satisfies ClusterDay;
  });
}

export async function POST(req: NextRequest) {
  try {
    /* Auth — must be logged in */
    const session = cookies().get("session")?.value;
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const decoded = await adminAuth.verifySessionCookie(session, true).catch(() => null);
    if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { niche, topic, region, contentType, workbook } = (await req.json()) as {
      niche: string;
      topic: string;
      region: string;
      contentType: ContentType;
      workbook: Workbook;
    };

    if (!topic || !region || !contentType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    /* Build a compact workbook context for the LLM (don't blow max_tokens) */
    const context = `Primary: ${workbook?.primaryKeyword ?? ""}
Secondary: ${(workbook?.secondaryKeywords ?? []).join(", ")}
Semantic: ${(workbook?.semanticKeywords ?? []).join(", ")}
Clusters: ${(workbook?.sheet2?.clusters ?? [])
      .map((c) => `${c.clusterName} [${c.priority}] → ${c.targetKeywords.join("/")}`)
      .join(" | ")}
Gaps: ${(workbook?.sheet3?.gaps ?? []).join(", ")}
Opportunities: ${(workbook?.sheet3?.opportunities ?? []).join(", ")}`;

    const prompt = clusterPrompt(topic, region, contentType, context, niche);

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: prompt.system },
        { role: "user", content: prompt.user },
      ],
      temperature: 0.5,
      max_tokens: 8000,
      response_format: { type: "json_object" },
    });

    const text = completion.choices[0]?.message?.content ?? "{}";
    const parsed = parseGroqJSON<{ days: Array<Partial<ClusterDay>> }>(text);
    const rawDays = Array.isArray(parsed.days) ? parsed.days : [];

    /* Pre-register slugs + ensure global uniqueness within this plan */
    const usedSlugs = new Set<string>();
    const days = normalizeDays(rawDays, usedSlugs);

    if (days.length < 30) {
      /* Top up with placeholder days if Groq returned fewer */
      for (let i = days.length; i < 30; i++) {
        const filler = normalizeDays([{ day: i + 1, title: `${topic} — idea ${i + 1}` }], usedSlugs);
        days.push(...filler);
      }
    }

    /* Create cluster doc id */
    const clusterRef = adminDb.collection("clusters").doc();
    const clusterId = clusterRef.id;

    const permalinkIndex: Record<string, number> = {};
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

    days.forEach((d) => (permalinkIndex[d.slug] = d.day));

    const clusterPlan: ClusterPlan = {
      id: clusterId,
      userId: decoded.uid,
      niche,
      topic,
      region,
      contentType,
      days,
      permalinkIndex,
      status: "active",
      createdAt: new Date().toISOString(),
    };

    /* Batch: write cluster + register every slug in permalinks/{slug} atomically */
    const batch = adminDb.batch();
    batch.set(clusterRef, clusterPlan);

    for (const d of days) {
      const permRef = adminDb.collection("permalinks").doc(d.slug);
      batch.set(
        permRef,
        {
          slug: d.slug,
          userId: decoded.uid,
          clusterId,
          clusterDay: d.day,
          url: `${appUrl}/blog/${d.slug}`,
          createdAt: new Date().toISOString(),
        },
        { merge: true }
      );
    }

    await batch.commit();

    return NextResponse.json(clusterPlan);
  } catch (err) {
    console.error("[cluster]", err);
    return NextResponse.json({ error: "Failed to generate cluster plan" }, { status: 500 });
  }
}
