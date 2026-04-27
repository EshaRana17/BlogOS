/* ─── Subscription ────────────────────────────────────── */
export type Plan = "free" | "pro" | "business";

export const PLAN_LIMITS: Record<Plan, { blogs: number; wordpress: boolean; cluster: boolean }> = {
  free:     { blogs: 2,  wordpress: false, cluster: false },
  pro:      { blogs: 12, wordpress: true,  cluster: false },
  business: { blogs: 30, wordpress: true,  cluster: true  },
};

/* 30-day trial mirrors Pro */
export const TRIAL_DURATION_DAYS = 30;

/* ─── Content Types ───────────────────────────────────── */
export type ContentType = "informational" | "commercial" | "transactional";

export const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  informational: "Informational",
  commercial:    "Commercial",
  transactional: "Transactional",
};

/* ─── User ────────────────────────────────────────────── */
export interface BlogOSUser {
  uid: string;
  email: string;
  name: string;
  plan: Plan;
  blogsUsed: number;
  blogsLimit: number;
  wordpressConnected: boolean;
  wordpressSiteUrl?: string;
  wordpressUsername?: string;
  wordpressAppPassword?: string;
  createdAt: string;
  lastActive: string;
  isAdmin?: boolean;

  /* Trial — every new signup gets 30 days mirroring Pro */
  trialActive?: boolean;
  trialStartedAt?: string;
  trialEndsAt?: string;
}

/* Derive the effective plan for a user — trial maps to Pro while active */
export function getEffectivePlan(user: Pick<BlogOSUser, "plan" | "trialActive" | "trialEndsAt">): Plan {
  if (user.trialActive && user.trialEndsAt && new Date(user.trialEndsAt) > new Date()) {
    return user.plan === "business" ? "business" : "pro";
  }
  return user.plan;
}

/* ─── Blog ────────────────────────────────────────────── */
export type BlogStatus = "draft" | "published" | "scheduled";

export interface Blog {
  id: string;
  userId: string;
  niche: string;
  topic: string;
  region: string;
  contentType: ContentType;

  /* Keywords */
  primaryKeyword: string;
  secondaryKeywords: string[];
  semanticKeywords: string[];

  /* Meta */
  seoTitle: string;
  metaDescription: string;
  permalink: string;

  /* Content */
  content: string;
  wordCount: number;
  aiScore: number;
  schema: string;

  /* Assets */
  featuredImageUrl: string;
  featuredImagePrompt: string;
  externalLink: string;
  scrapedUrls: string[];

  /* WordPress */
  status: BlogStatus;
  wordpressPostId?: string;
  wordpressPostUrl?: string;

  /* Cluster context (when part of a 30-day plan) */
  clusterId?: string;
  clusterDay?: number;
  scheduledDate?: string;
  internalLinks?: { slug: string; anchor: string; url: string }[];

  createdAt: string;
  updatedAt: string;
}

/* ─── Cluster (Business) ──────────────────────────────── */
export type ClusterDayStatus = "pending" | "queued" | "generating" | "done" | "error";

export interface ClusterDay {
  day: number;
  date: string;
  title: string;
  intent: string;
  sentiment: string;
  targetQuery: string;
  nlpCategory: string;
  funnel: string;
  format: string;
  wordCount: string;
  cta: string;
  internalLinks: string;
  permalink: string;    // pre-registered day 1, immutable
  slug: string;         // url-safe duplicate, used as permalinks collection key
  primaryKeyword: string;
  secondaryKeywords: string;
  notes: string;
  /* execution state */
  status: ClusterDayStatus;
  blogId?: string;
  generatedAt?: string;
  scheduledFor?: string;
}

export type ClusterStatus = "draft" | "active" | "completed";

export interface ClusterPlan {
  id: string;
  userId: string;
  niche: string;
  topic: string;
  region: string;
  contentType: ContentType;
  days: ClusterDay[];
  permalinkIndex: Record<string, number>;  // slug → day# for O(1) internal-link resolve
  status: ClusterStatus;
  createdAt: string;
}

/* Global permalinks registry — `permalinks/{slug}` for platform-wide uniqueness */
export interface PermalinkRegistration {
  slug: string;
  userId: string;
  clusterId: string;
  clusterDay: number;
  blogId?: string;
  url: string;
  createdAt: string;
}

/* ─── NLP Workbook (Business) ─────────────────────────── */
export const NLP_CATEGORIES = [
  "Synonyms",
  "Antonyms",
  "Homonyms",
  "Homophones",
  "Homographs",
  "Hypernyms",
  "Hyponyms",
  "Meronyms",
  "Holonyms",
  "Acronyms",
] as const;

export type NlpCategory = typeof NLP_CATEGORIES[number];

export interface WorkbookSheet1 {
  /* 80+ keyword variations across all 10 linguistic categories */
  categories: Record<NlpCategory, string[]>;
}

export interface WorkbookSheet2Cluster {
  clusterName: string;
  priority: "high" | "medium" | "low";
  targetKeywords: string[];
  pages: { title: string; intent: string }[];
}

export interface WorkbookSheet3Serp {
  ranking: { title: string; url: string; strength: string }[];
  gaps: string[];
  opportunities: string[];
}

export interface WorkbookSheet4Semantic {
  groups: { group: string; keywords: string[] }[];
}

export interface Workbook {
  topic: string;
  region: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  semanticKeywords: string[];
  seoTitle: string;
  metaDescription: string;
  permalink: string;
  sheet1: WorkbookSheet1;
  sheet2: { clusters: WorkbookSheet2Cluster[] };
  sheet3: WorkbookSheet3Serp;
  sheet4: WorkbookSheet4Semantic;
}

/* ─── Scraping ────────────────────────────────────────── */
export interface ScrapedPage {
  url: string;
  title: string;
  content: string;
  blocked: boolean;
}

/* ─── Keyword Research ────────────────────────────────── */
export interface KeywordData {
  primaryKeyword: string;
  secondaryKeywords: string[];
  semanticKeywords: string[];
  seoTitle: string;
  metaDescription: string;
  permalink: string;
}

/* ─── Blog Structure ──────────────────────────────────── */
export type SectionType = "intro" | "body" | "conclusion" | "cta" | "faq";

export interface BlogSection {
  sectionType: SectionType;
  h2: string;
  intent: string;
}

/* ─── Generation progress steps ──────────────────────── */
export type StepStatus = "pending" | "running" | "done" | "error";

export interface PipelineStep {
  id: string;
  label: string;
  status: StepStatus;
  detail?: string;
}

/* ─── WordPress ───────────────────────────────────────── */
export interface WordPressCredentials {
  siteUrl: string;
  username: string;
  appPassword: string;
}

export interface WordPressPublishResult {
  postId: number;
  postUrl: string;
  slug: string;
}

/* ─── Admin Connected Sites ───────────────────────────── *
 * Sites owned by a BlogOS admin (not per-end-user WordPress).
 * Used to publish hand-crafted admin blogs to external targets
 * without counting against any quota. Stored at:
 *   users/{adminUid}/adminSites/{siteId}
 * ──────────────────────────────────────────────────────── */
export type AdminSiteKind = "wordpress" | "blogos-internal";

export interface AdminSite {
  id: string;
  label: string;          /* Display name, e.g. "Surah Baqarah" */
  kind: AdminSiteKind;
  siteUrl: string;        /* https://surahbaqarah.com */
  /* WordPress creds — only for kind === "wordpress" */
  username?: string;
  appPassword?: string;
  /* Optional author override when publishing */
  authorName?: string;
  createdAt: string;
  lastPublishedAt?: string;
}

/* ─── Company Blog (Admin) ────────────────────────────── */
export interface Article {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string; /* markdown */
  featuredImage: string;
  category: string;
  tags: string[];
  seoTitle: string;
  metaDescription: string;
  author: string; /* uid */
  published: boolean;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}
