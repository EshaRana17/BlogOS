import type { ContentType, ScrapedPage, BlogSection } from "@/types";
import { NLP_CATEGORIES } from "@/types";

/* ─── JSON parser: handles Groq's varied output formats ── */
export function parseGroqJSON<T>(text: string): T {
  const s = text.trim();
  try { return JSON.parse(s) as T; } catch { /* next */ }
  const fenced = s.match(/```(?:json)?\s*([\s\S]+?)\s*```/);
  if (fenced) { try { return JSON.parse(fenced[1]) as T; } catch { /* next */ } }
  const arr = s.match(/\[[\s\S]*\]/);
  if (arr) { try { return JSON.parse(arr[0]) as T; } catch { /* next */ } }
  const obj = s.match(/\{[\s\S]*\}/);
  if (obj) { try { return JSON.parse(obj[0]) as T; } catch { /* next */ } }
  throw new Error(`Cannot parse JSON from Groq response:\n${s.slice(0, 400)}`);
}

/* ─── Content-type guidance injected into prompts ───────── */
const CONTENT_GUIDANCE: Record<ContentType, string> = {
  informational:
    "educational depth, how-to steps, guides, tips. The reader wants to LEARN.",
  commercial:
    "comparisons, pros/cons, reviews, 'best X for Y'. The reader wants to EVALUATE.",
  transactional:
    "urgency, pricing, 'hire/buy/get a quote', trust signals. The reader wants to ACT.",
};

/* ─── TONE DETECTION ─────────────────────────────────────── *
 * Classifies the {niche, topic} into one of 5 tone domains
 * so the system prompt can enforce vocabulary boundaries.
 * ──────────────────────────────────────────────────────── */
export type Tone =
  | "spiritual"
  | "technical"
  | "local_service"
  | "lifestyle"
  | "commercial";

const TONE_PATTERNS: { tone: Tone; patterns: RegExp[] }[] = [
  {
    tone: "spiritual",
    patterns: [
      /\b(surah|quran|qur'an|hadith|islam|muslim|prayer|salah|dua|zikr|wird|hajj|ramadan|tafsir|fiqh|sunnah|prophet|allah|yaseen|rahman|baqarah|fatiha|kahf)\b/i,
      /\b(bible|christian|church|jesus|christ|gospel|sermon|scripture|psalm|verse of|bhagavad|gita|torah|jewish|judaism|hindu|sikh|buddhism|buddhist|meditation|mantra|spiritual|sacred|faith|devotion|worship|divine|religion|religious)\b/i,
    ],
  },
  {
    tone: "technical",
    patterns: [
      /\b(saas|b2b|api|sdk|cloud|devops|cybersecurity|zero[- ]trust|kubernetes|docker|microservices|serverless|blockchain|ai\/ml|machine learning|data engineering|software|platform engineering|infrastructure|observability|siem|iam|cryptography|oauth|jwt|rest|graphql|ci\/cd|sre|fintech)\b/i,
    ],
  },
  {
    tone: "local_service",
    patterns: [
      /\b(plumbing|plumber|electrician|hvac|locksmith|roofing|landscaping|cleaning service|pest control|moving|dentist|chiropractor|auto repair|towing|handyman|contractor|emergency repair|24\/7|near me)\b/i,
    ],
  },
  {
    tone: "lifestyle",
    patterns: [
      /\b(fashion|beauty|wellness|recipe|cooking|travel|parenting|home decor|gardening|fitness|yoga|skincare|hairstyle|dating|pets|diy|minimalism|productivity|self[- ]care|mental health)\b/i,
    ],
  },
];

export function detectTone(niche: string, topic: string): Tone {
  const combined = `${niche} ${topic}`.toLowerCase();
  for (const { tone, patterns } of TONE_PATTERNS) {
    if (patterns.some((p) => p.test(combined))) return tone;
  }
  return "commercial";
}

/* ─── TONE DIRECTIVES injected into every system prompt ── *
 * Hard vocabulary and framing rules per domain.
 * ──────────────────────────────────────────────────────── */
const TONE_DIRECTIVES: Record<Tone, string> = {
  spiritual: `TONE: Sacred / Religious.
- Treat the subject with reverence. It is NOT a "product," "tool," "solution," "service," "offering," "utility," or "asset." Do not use business vocabulary.
- Avoid: "leverage," "optimise," "deploy," "convert," "tactics," "funnel," "ROI," "hack," "boost performance."
- Prefer: "recite," "reflect on," "learn about," "understand," "draw meaning from," "study," "observe," "practice."
- Never fabricate religious claims, benefits, virtues (fadail), or historical events. If a specific claim is not common knowledge, write in general, observational language.
- Never make medical, financial, or supernatural promises tied to the practice.
- Region plays almost NO role. Do not attach the location to the sacred subject. A topic like "Surah Yaseen" is universal; location only matters if the user is asking about local mosques, prayer times, or community events.`,

  technical: `TONE: Technical / B2B SaaS.
- Audience is engineers, architects, security leads, CTOs. Assume literacy — do not over-explain basics.
- Favour precision: name the protocol, the standard, the RFC, the tool. "OAuth 2.1," "mTLS," "NIST SP 800-207," "Terraform," not "the authentication thing."
- Code, config, or command snippets are welcome where they sharpen the point.
- Avoid marketing puff: "cutting-edge," "revolutionary," "game-changing," "next-generation," "robust," "seamless," "enterprise-grade" — these are empty.
- Region only matters for compliance (GDPR, HIPAA, PIPEDA, SOC2 audit boundaries). Otherwise technology is global; do not geo-tag.`,

  local_service: `TONE: Local Service / Trade.
- Audience is a homeowner, business owner, or property manager in a specific city with an urgent or practical need.
- Region IS part of the value proposition here. Mention the city in the intro, service area, and CTA. Reference local codes, permits, climate factors, or rates where genuinely relevant.
- Write like a licensed tradesperson who has done this job hundreds of times — concrete steps, realistic timelines, honest cost ranges, safety warnings.
- Avoid: "unlock savings," "transform your space," "elevate your home," "peace of mind" (cliché), "at your service."`,

  lifestyle: `TONE: Lifestyle / Personal.
- Warm, conversational, first-person. Share observations and small anecdotes when they add texture.
- Avoid influencer filler: "obsessed with," "absolute game-changer," "I'm gonna spill," "the secret no one tells you."
- Region is cultural context, not SEO filler — mention it only if the recipe, season, fabric, or product is region-specific.`,

  commercial: `TONE: Commercial / General Business.
- Clear, authoritative, plain language. Give real recommendations and honest tradeoffs — no fence-sitting.
- Avoid corporate filler: "synergy," "best-in-class," "paradigm," "holistic," "bandwidth."
- Region matters for currency, tax, and service availability — not for every heading.`,
};

/* ─── GLOBAL VOCABULARY BLOCKLIST ─────────────────────────
 * Words/phrases that scream "AI wrote this."  Applied to every
 * writing prompt in addition to tone-specific bans.
 * ──────────────────────────────────────────────────────── */
const VOCAB_BLOCKLIST = [
  "delve into", "delve", "delving",
  "dive into", "let's dive", "deep dive",
  "in today's digital landscape", "digital landscape",
  "in the realm of", "realm of", "the world of",
  "navigate the", "navigating the complexities",
  "it's worth noting that", "it is important to note",
  "a testament to", "stands as a testament",
  "the tapestry of", "rich tapestry",
  "embark on", "embark on a journey",
  "unleash", "unlock the power of", "unlock the potential",
  "harness the power", "harness",
  "in conclusion", "to sum up", "to summarize",
  "furthermore", "moreover", "additionally", "thus",
  "plethora", "myriad", "countless",
  "cutting-edge", "state-of-the-art", "next-generation",
  "revolutionary", "game-changing", "paradigm shift",
  "seamless", "seamlessly", "robust", "holistic",
  "comprehensive solution", "end-to-end solution",
  "in this article we will", "this article aims to",
  "hopefully this helps", "stay tuned",
  "ever-evolving", "rapidly evolving", "ever-changing",
  "at the end of the day", "when all is said and done",
  "it goes without saying",
];

const VOCAB_RULE = `FORBIDDEN VOCABULARY (never use these phrases, even once):
${VOCAB_BLOCKLIST.map((w) => `"${w}"`).join(", ")}.
If you catch yourself writing one of these, rewrite the sentence with plain, specific words.`;

/* ─── VARIABLE WEIGHTING — the core fix for location-stuffing ─ *
 * NICHE > TOPIC >> REGION.  Region is *background*, not filler.
 * ──────────────────────────────────────────────────────── */
const VARIABLE_WEIGHTING = (niche: string, topic: string, region: string, tone: Tone) => {
  const regionRole = tone === "local_service"
    ? `Region is a PRIMARY variable for this content. Expect ~8–12% of body text to reference the location (service area, local codes, climate). Every H2 does NOT need the city — 2 or 3 do.`
    : tone === "spiritual"
      ? `Region is EFFECTIVELY IGNORED. Do not attach the location to the sacred subject. Do not place it in any H2. Mention it at most once, and only if the user is asking about local community practice.`
      : tone === "technical"
        ? `Region is relevant only for compliance jurisdictions (GDPR, HIPAA, PIPEDA, APPI). Do not geo-tag concepts that are globally applicable.`
        : `Region is BACKGROUND CONTEXT only. It may shape spelling, currency, and examples, but must NOT exceed 5% of total word count. Do not force it into H2 headings. A blog that mentions the region once in the intro and once in the CTA is already sufficient.`;

  return `VARIABLE WEIGHTING (strict priority order):
1. NICHE = "${niche}"   (highest weight — every section must reinforce the niche)
2. TOPIC = "${topic}"   (high weight — every H2 must directly serve this topic)
3. REGION = "${region}" (${regionRole})

Region injection rule: NEVER append the region to every heading. NEVER start multiple sentences with "In ${region}...". Mention the region only where it is linguistically natural. If a sentence reads just as well without the region, remove it.`;
};

/* ─── Helpers ────────────────────────────────────────────── */
export function buildPageSummaries(pages: ScrapedPage[], maxChars = 12000): string {
  if (pages.length === 0) return "(no live page data — using AI knowledge)";
  const perPage = Math.floor(maxChars / pages.length);
  return pages
    .map((p, i) => `[Page ${i + 1}] ${p.title}\nURL: ${p.url}\n${p.content.slice(0, perPage)}`)
    .join("\n\n---\n\n");
}

export function buildCompetitorInsights(pages: ScrapedPage[], maxChars = 6000): string {
  if (pages.length === 0) return "(no competitor data — use SEO expertise)";
  const perPage = Math.floor(maxChars / pages.length);
  return pages
    .map((p, i) => `[${i + 1}] "${p.title}" — ${p.url}\n${p.content.slice(0, perPage)}`)
    .join("\n\n");
}

/* ─── PROMPT: Brainstorm topics ─────────────────────────── */
export function brainstormPrompt(niche: string, region: string) {
  const tone = detectTone(niche, "");
  const regionHint = tone === "local_service"
    ? `Include the region "${region}" naturally in 2–3 of the 5 topics (the local intent variants).`
    : tone === "spiritual"
      ? `Do NOT inject the region into the topics. These subjects are universal — the region is not an SEO variable.`
      : `Include the region "${region}" in AT MOST 1 of the 5 topics, and only if a local angle genuinely exists.`;

  return {
    system:
      "You are an expert SEO content strategist who identifies high-value, rankable blog topics matching real user search intent. You respect the subject matter of the niche and do not blindly inject geography. Always return valid JSON.",
    user: `Suggest exactly 5 specific blog topics for the niche "${niche}" for an audience in "${region}".

${regionHint}

Rules:
- Each topic is a specific, searchable phrase a real person would type into Google
- Topics should vary: mix how-to, best-of, comparison, and (where natural) local/transactional angles
- Each should be 5–12 words
- Do not start multiple topics with the same word

Return ONLY a JSON array of 5 strings. No markdown, no explanation.`,
  };
}

/* ─── PROMPT: Keyword extraction ────────────────────────── */
export function keywordsPrompt(
  topic: string,
  region: string,
  contentType: ContentType,
  pageContent: string,
  useFallback: boolean,
  niche = ""
) {
  const tone = detectTone(niche, topic);
  const keywordRegionRule = tone === "local_service"
    ? `Primary keyword MAY include the region ("${region}") where natural.`
    : tone === "spiritual"
      ? `Primary keyword MUST NOT include the region. The subject is universal.`
      : `Primary keyword should focus on the topic itself. Include the region only if it is already a common modifier in real searches.`;

  return {
    system:
      "You are an expert SEO keyword researcher. You extract keywords that match actual search behaviour, not keyword-stuffed fiction. Return valid JSON format only.",
    user: `Extract SEO keywords for this blog post.

Topic: "${topic}"
Region: "${region}"
Content Type: ${contentType.toUpperCase()} — ${CONTENT_GUIDANCE[contentType]}

${keywordRegionRule}

${
  useFallback
    ? "No live page data available. Use your SEO expertise."
    : `Content from top-ranking competitor pages:\n${pageContent}`
}

Return a JSON object with EXACTLY this structure (no extra keys):
{
  "primaryKeyword": "one long-tail keyword (3-6 words)",
  "secondaryKeywords": ["4 supporting keywords that reinforce the primary"],
  "semanticKeywords": ["20 LSI/semantic keywords — entities, concepts, related terms, questions"],
  "seoTitle": "SEO title under 60 characters including primary keyword",
  "metaDescription": "Meta description under 155 characters. Include primary keyword. Action-oriented.",
  "permalink": "url-friendly-slug-no-spaces"
}`,
  };
}

/* ─── PROMPT: The Content Writer ─────────────────────────
 * Responsible for drafting one section of a blog.
 * Uses Variable Weighting so NICHE+TOPIC > REGION.
 * ──────────────────────────────────────────────────────── */
export function writeSectionPrompt(
  section: BlogSection,
  sectionIndex: number,
  totalSections: number,
  topic: string,
  primaryKeyword: string,
  secondaryKeywords: string[],
  semanticKeywords: string[],
  contentType: ContentType,
  region: string,
  niche = ""
) {
  const tone = detectTone(niche, topic);
  const isFaq = section.sectionType === "faq";
  const isCta = section.sectionType === "cta";

  const wordTarget = "EXACTLY 150 words — do NOT exceed 160 or go below 140";

  const allSecondary = secondaryKeywords.join(", ");
  const semanticSlice = semanticKeywords.slice(sectionIndex * 2, sectionIndex * 2 + 4).join(", ");
  const remainingSemantic = semanticKeywords.filter((_, i) => i % totalSections === sectionIndex).join(", ");

  const faqRule = `FAQ GROUNDING RULES:
- Each of the 6 questions MUST be grounded in the specific topic "${topic}" — not generic filler.
- Answers MUST reference something concrete from the topic. Never answer "it depends" or "many factors."
- Do NOT fabricate statistics, dates, prices, or authorities. If you cannot state something truthfully, phrase it as general guidance.
- At least 3 of the 6 questions should naturally include the primary keyword.
- Each question must be a phrase a real person would type — including "how," "why," "what is," "can I," "is it safe to," "how often."
- No question may be answered with a yes/no that doesn't elaborate.`;

  return {
    system: `You are an expert long-form writer. You produce human-sounding, authoritative blog content that ranks on Google and reads like it was written by a practitioner — not an AI.

${TONE_DIRECTIVES[tone]}

BASE RULES (apply always):
- Simple, modern English. Short sentences. Active voice.
- First person ("I"), not corporate "we."
- Sound like someone who has personally done / studied / observed the topic.
- Follow Google E-E-A-T — experience, expertise, authority, trust.
- Do NOT use em dashes or hyphenated parentheticals for rhythm.
- Do NOT use rhetorical questions to open paragraphs.
- Output RAW markdown only. No "Here is the section," no meta-commentary.

${VOCAB_RULE}`,

    user: `Write section ${sectionIndex + 1} of ${totalSections}.

${VARIABLE_WEIGHTING(niche, topic, region, tone)}

CONTENT TYPE: ${contentType.toUpperCase()} — ${CONTENT_GUIDANCE[contentType]}

KEYWORD REQUIREMENTS — weave these in naturally, do NOT keyword-stuff:
• Primary keyword (use 1–2 times, never in an unnatural phrase): "${primaryKeyword}"
• Secondary keywords (use all 4 across the section): ${allSecondary}
• Semantic keywords to touch on: ${semanticSlice}${remainingSemantic ? `, ${remainingSemantic}` : ""}

SECTION HEADING: "${section.h2}"
SECTION TYPE: ${section.sectionType}
SECTION INTENT: ${section.intent}
WORD COUNT: ${wordTarget}.

${
  isFaq
    ? faqRule + `\n\nFormat: each question as "### Question text" then a 1–2 sentence answer paragraph.`
    : isCta
      ? `Write a genuine, human call-to-action — ${tone === "spiritual" ? "invite the reader to continue their study or practice. Do not sell anything." : tone === "local_service" ? `invite the reader to call / book a quote. Reference "${region}" once in the CTA.` : `invite the reader to take the specific next step (subscribe, get a quote, book a demo, read the related guide). Reference the region only if natural.`}`
      : `Write flowing paragraphs. Add a single ### subheading only if the section truly needs it. Every sentence must earn its place — no padding.`
}

Begin your response with exactly "## ${section.h2}" — nothing before it, no preamble.`,
  };
}

/* ─── PROMPT: AI SEO score ───────────────────────────────── */
export function seoScorePrompt(
  content: string,
  primaryKeyword: string,
  secondaryKeywords: string[],
  seoTitle: string,
  metaDescription: string
) {
  return {
    system:
      "You are an expert SEO auditor. Score blog content honestly — do not inflate. Return valid JSON only.",
    user: `Audit this blog post for SEO quality.

Primary Keyword: "${primaryKeyword}"
Secondary Keywords: ${secondaryKeywords.join(", ")}
SEO Title: "${seoTitle}"
Meta Description: "${metaDescription}"

Content (first 3000 chars):
${content.slice(0, 3000)}

Score each dimension based on ACTUAL performance.
- keywordUsage (0–25): Did the primary keyword appear naturally multiple times? Did secondary keywords appear?
- contentDepth (0–25): Does the content thoroughly cover the topic with specific details, examples, insights?
- readability (0–25): Short sentences? Simple words? Easy to scan? Clear structure?
- structureAndFormatting (0–25): Good H2/H3 headings? Bullet points where helpful? Logical flow?

Deduct heavily if you detect:
- Region-stuffing (the location repeated in most headings unnecessarily)
- Any forbidden AI vocabulary ("delve," "in today's digital landscape," "seamless," etc.)
- Generic FAQ fillers not grounded in the topic

Return ONLY this JSON:
{
  "score": <integer 0-100>,
  "breakdown": {
    "keywordUsage": <0-25>,
    "contentDepth": <0-25>,
    "readability": <0-25>,
    "structureAndFormatting": <0-25>
  },
  "suggestions": ["2–3 specific, actionable improvements"]
}`,
  };
}

/* ─── PROMPT: JSON-LD Schema ──────────────────────────────── */
export function schemaPrompt(
  topic: string,
  seoTitle: string,
  metaDescription: string,
  primaryKeyword: string,
  permalink: string,
  appUrl: string
) {
  return {
    system:
      "You are a structured-data expert. Generate valid JSON-LD schema markup for blog posts. Return a JSON object only.",
    user: `Generate JSON-LD schema for this blog post.

Title: "${seoTitle}"
Description: "${metaDescription}"
Topic: "${topic}"
Primary Keyword: "${primaryKeyword}"
URL: "${appUrl}/blog/${permalink}"

Return a single JSON object using the Article schema type. Include: @context, @type, headline, description, author (name: "BlogOS"), publisher (name: "BlogOS"), url, keywords. Use today's date for datePublished.`,
  };
}

/* ─── PROMPT: NLP Workbook (Business) ───────────────────── */
export function workbookPrompt(topic: string, region: string, contentType: ContentType, niche = "") {
  const tone = detectTone(niche, topic);
  const categories = NLP_CATEGORIES.join(", ");
  return {
    system:
      "You are an expert NLP keyword researcher and SEO strategist. You produce complete, structured JSON workbooks. Return valid JSON only — no markdown, no commentary.",
    user: `Brainstorm NLP categories for the topic "${topic}" in the niche "${niche || "(unspecified)"}".

${VARIABLE_WEIGHTING(niche, topic, region, tone)}

Content Type: ${contentType.toUpperCase()} — ${CONTENT_GUIDANCE[contentType]}

Use EXACTLY these 10 linguistic categories: ${categories}.

Return a single JSON object with this EXACT shape:
{
  "topic": "${topic}",
  "region": "${region}",
  "primaryKeyword": "one long-tail keyword (3-6 words)",
  "secondaryKeywords": ["4 supporting keywords"],
  "semanticKeywords": ["20 LSI / semantic keywords"],
  "seoTitle": "under 60 chars",
  "metaDescription": "under 155 chars, action-oriented",
  "permalink": "url-friendly-slug",

  "sheet1": {
    "categories": {
      "Synonyms":    ["8+ variations"],
      "Antonyms":    ["8+ variations"],
      "Homonyms":    ["8+ variations"],
      "Homophones":  ["8+ variations"],
      "Homographs":  ["8+ variations"],
      "Hypernyms":   ["8+ variations"],
      "Hyponyms":    ["8+ variations"],
      "Meronyms":    ["8+ variations"],
      "Holonyms":    ["8+ variations"],
      "Acronyms":    ["8+ variations"]
    }
  },

  "sheet2": {
    "clusters": [
      { "clusterName": "cluster theme", "priority": "high|medium|low",
        "targetKeywords": ["kw1","kw2","kw3"],
        "pages": [ { "title": "page idea", "intent": "1-line intent" } ]
      }
    ]
  },

  "sheet3": {
    "ranking":      [ { "title": "competitor title", "url": "example.com/slug", "strength": "1-line description" } ],
    "gaps":         ["gap1", "gap2", "gap3", "gap4", "gap5"],
    "opportunities":["opportunity1", "opportunity2", "opportunity3", "opportunity4", "opportunity5"]
  },

  "sheet4": {
    "groups": [
      { "group": "Service",  "keywords": ["7+ keywords"] },
      { "group": "Process",  "keywords": ["7+ keywords"] },
      { "group": "Cost",     "keywords": ["7+ keywords"] },
      { "group": "Material", "keywords": ["7+ keywords"] },
      { "group": "Region",   "keywords": ["7+ keywords"] }
    ]
  }
}

Rules:
- sheet1.categories MUST contain all 10 categories — no additions, no removals.
- Every array must meet its minimum count.
- Produce 6–10 sheet2 clusters totaling 30+ page ideas.
- No nulls, no empty arrays, no "TBD".
- Return JSON only.`,
  };
}

/* ─── PROMPT: The Strategic Cluster Generator ─────────────
 * Builds a 30-day topical authority plan.
 * Honours tone + Variable Weighting.
 * ──────────────────────────────────────────────────────── */
export function clusterPrompt(
  topic: string,
  region: string,
  contentType: ContentType,
  workbookContext: string,
  niche = ""
) {
  const tone = detectTone(niche, topic);

  const localRule = tone === "local_service"
    ? `~30–40% of titles should carry the region ("${region}") — service areas, neighbourhoods, codes.`
    : tone === "spiritual"
      ? `DO NOT attach "${region}" to any title. These subjects are universal; location is irrelevant.`
      : `AT MOST 2 of the 30 titles may mention "${region}", and only where a local angle is real.`;

  return {
    system:
      "You are a world-class SEO content strategist. You build 30-day topical-authority plans designed to dominate a topic, not to keyword-stuff. You respect the subject matter. Return valid JSON only.",
    user: `Build a 30-day blog strategy (1 blog/day) for the topic "${topic}" within the niche "${niche || "(unspecified)"}". The audience is in "${region}".

${VARIABLE_WEIGHTING(niche, topic, region, tone)}

Content Type: ${contentType.toUpperCase()} — ${CONTENT_GUIDANCE[contentType]}

Local-injection rule for this plan: ${localRule}

Use the workbook context:
${workbookContext}

Return a single JSON object with this shape:
{
  "days": [
    {
      "day": 1,
      "date": "YYYY-MM-DD (Day 1 = today, +1 per day)",
      "title": "specific article title (60 chars or less)",
      "intent": "informational|commercial|transactional|navigational",
      "sentiment": "positive|neutral|negative|curious",
      "targetQuery": "the exact long-tail search query",
      "nlpCategory": "one of: Synonyms, Antonyms, Homonyms, Homophones, Homographs, Hypernyms, Hyponyms, Meronyms, Holonyms, Acronyms",
      "funnel": "TOFU|MOFU|BOFU",
      "format": "how-to|listicle|comparison|guide|case-study|faq|review",
      "wordCount": "1500",
      "cta": "one-line CTA tailored to the funnel stage",
      "internalLinks": "comma-separated slugs of 2-3 OTHER days in the 30-day plan",
      "permalink": "url-friendly-slug-no-spaces",
      "primaryKeyword": "main keyword for this article",
      "secondaryKeywords": "comma-separated 4 secondary keywords",
      "notes": "1-line strategic note"
    }
  ]
}

Hard requirements:
- EXACTLY 30 entries.
- Every "permalink" MUST be unique across the 30 days.
- Permalinks lowercase, hyphen-separated, no stopwords.
- Distribute funnel stages roughly 40% TOFU / 35% MOFU / 25% BOFU.
- Titles must read like editorial SERP-ranking pieces, not keyword lists.
- Return raw JSON only.`,
  };
}

/* ─── PROMPT: Fallback competitor synthesis ─────────────── */
export function fallbackCompetitorPrompt(topic: string, region: string) {
  return {
    system:
      "You are an SEO research specialist. When live scraping is unavailable, synthesise a realistic competitive landscape from your training knowledge. Return valid JSON only.",
    user: `Live scraping is blocked. Synthesise competitive intelligence for: "${topic}" with audience in "${region}".

Return a JSON object with EXACTLY this shape:
{
  "pages": [
    { "url": "plausible-example.com/path",
      "title": "what a ranking article for this query would be titled",
      "content": "300-400 word synthesis of what the top-ranking article for this query would cover — key sections, data points, angles, competitor strengths and gaps." }
  ]
}

Rules:
- 5 entries, each ~300-400 words.
- Realistic URLs (plausible domains), not "example.com".
- Cover different angles: one how-to, one listicle, one comparison, one FAQ, one reference.
- Raw JSON only.`,
  };
}

/* ─── PROMPT: Featured image prompt ─────────────────────── */
export function imagePromptGen(topic: string, seoTitle: string, contentType: ContentType, niche = "") {
  const tone = detectTone(niche, topic);
  const styleByTone: Record<Tone, string> = {
    spiritual: "reverent, minimal, soft natural light, no human faces, no religious iconography distortion, calligraphic or textural",
    technical: "clean editorial tech illustration or subtle 3D render, cool palette, abstract geometry, no stock-photo clichés",
    local_service: "documentary photography of a real job in progress, natural light, tools or service in use",
    lifestyle: "warm, editorial lifestyle photography, natural textures, uncluttered composition",
    commercial: "modern editorial photography or clean flat illustration, balanced composition",
  };
  return `Professional blog featured image for: "${seoTitle}". Topic: ${topic}. Style: ${styleByTone[tone]}. No text overlays. High quality, 16:9 composition.`;
}

/* ─── PROMPT: The Content Architect ───────────────────────
 * Builds the 10-section outline.
 * Prioritises logical flow over keyword stuffing.
 * Applies tone + Variable Weighting.
 * ──────────────────────────────────────────────────────── */
export function structurePrompt(
  topic: string,
  region: string,
  contentType: ContentType,
  primaryKeyword: string,
  secondaryKeywords: string[],
  competitorInsights: string,
  useFallback: boolean,
  niche = ""
) {
  const tone = detectTone(niche, topic);

  const h2LocalRule = tone === "local_service"
    ? `2–4 of the 10 H2s may include the region ("${region}") where the local angle is real (service area, local codes, climate, pricing). The rest focus on the craft.`
    : tone === "spiritual"
      ? `NO H2 may contain "${region}". None. The subject is universal.`
      : tone === "technical"
        ? `NO H2 should contain "${region}" unless the section is specifically about a compliance framework in that jurisdiction.`
        : `AT MOST 1 H2 may contain "${region}", and only if the section is genuinely local in scope.`;

  return {
    system: `You are a world-class content architect. You design 10-section blog outlines that win SERPs by nailing search intent — not by stuffing keywords or geography into every heading.

${TONE_DIRECTIVES[tone]}

Architect rules:
- Headings must show logical progression: hook → context → core how-to → nuance → counterpoints → resolution → next step.
- Each H2 must make sense on its own as a sub-topic someone would actually search.
- The outline is judged on FLOW first, keyword density second.
- FAQ section must be grounded in the topic, not generic filler.

${VOCAB_RULE}

Return valid JSON only.`,

    user: `Create a 10-section blog outline.

${VARIABLE_WEIGHTING(niche, topic, region, tone)}

Content Type: ${contentType.toUpperCase()} — ${CONTENT_GUIDANCE[contentType]}
Primary Keyword: "${primaryKeyword}"
Secondary Keywords: ${secondaryKeywords.join(", ")}

H2 LOCAL-INJECTION RULE: ${h2LocalRule}

${
  useFallback
    ? "Use your SEO expertise to design an outline that would outperform typical content on this topic."
    : `Analysis of currently ranking pages:\n${competitorInsights}`
}

Strict requirements:
- EXACTLY 10 sections: 1 intro + 6 body + 1 conclusion + 1 cta + 1 faq.
- H2s must be editorially compelling, not keyword-list headers.
- Intent line (one sentence per section) must state the ANGLE, not just restate the heading.
- FAQ section: the intent must pre-seed 6 real user questions specific to "${topic}" (not generic).

Return a JSON object with EXACTLY this structure:
{
  "sections": [
    {"sectionType": "intro", "h2": "heading text", "intent": "one sentence describing the angle"},
    {"sectionType": "body", "h2": "heading", "intent": "..."},
    {"sectionType": "body", "h2": "heading", "intent": "..."},
    {"sectionType": "body", "h2": "heading", "intent": "..."},
    {"sectionType": "body", "h2": "heading", "intent": "..."},
    {"sectionType": "body", "h2": "heading", "intent": "..."},
    {"sectionType": "body", "h2": "heading", "intent": "..."},
    {"sectionType": "conclusion", "h2": "heading", "intent": "..."},
    {"sectionType": "cta", "h2": "heading", "intent": "..."},
    {"sectionType": "faq", "h2": "Frequently Asked Questions", "intent": "6 questions grounded in ${topic}"}
  ]
}`,
  };
}
