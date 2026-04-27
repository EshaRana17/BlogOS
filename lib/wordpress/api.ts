import type { WordPressCredentials, WordPressPublishResult } from "@/types";

/**
 * WordPress REST API helpers — uses Application Passwords.
 * The user creates an app password under Users → Profile → Application Passwords.
 */

function authHeader({ username, appPassword }: WordPressCredentials) {
  const token = Buffer.from(`${username}:${appPassword}`).toString("base64");
  return `Basic ${token}`;
}

function normalizeSiteUrl(siteUrl: string): string {
  return siteUrl.replace(/\/+$/, "");
}

export async function validateWordPress(creds: WordPressCredentials): Promise<{ ok: boolean; message: string; user?: { name: string; id: number } }> {
  const base = normalizeSiteUrl(creds.siteUrl);
  try {
    const res = await fetch(`${base}/wp-json/wp/v2/users/me?context=edit`, {
      headers: { Authorization: authHeader(creds) },
      cache: "no-store",
    });
    if (!res.ok) {
      const text = await res.text();
      return { ok: false, message: `WordPress rejected credentials (${res.status}). ${text.slice(0, 200)}` };
    }
    const data = (await res.json()) as { id: number; name: string };
    return { ok: true, message: "Connected", user: { id: data.id, name: data.name } };
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : "Cannot reach site" };
  }
}

/**
 * Upload a featured image from a remote URL → returns WP media id.
 * Accepts either an https URL or a base64 data URI.
 */
export async function uploadFeaturedImage(
  creds: WordPressCredentials,
  imageUrl: string,
  filename = "featured.jpg"
): Promise<number | null> {
  if (!imageUrl) return null;
  const base = normalizeSiteUrl(creds.siteUrl);

  let buffer: Buffer;
  let contentType = "image/jpeg";

  if (imageUrl.startsWith("data:")) {
    const match = imageUrl.match(/^data:(.+);base64,(.*)$/);
    if (!match) return null;
    contentType = match[1];
    buffer = Buffer.from(match[2], "base64");
  } else {
    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) return null;
    contentType = imgRes.headers.get("content-type") ?? "image/jpeg";
    buffer = Buffer.from(await imgRes.arrayBuffer());
  }

  const uploadRes = await fetch(`${base}/wp-json/wp/v2/media`, {
    method: "POST",
    headers: {
      Authorization: authHeader(creds),
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
    body: new Uint8Array(buffer),
  });
  if (!uploadRes.ok) {
    console.warn("[wp] media upload failed", uploadRes.status, await uploadRes.text());
    return null;
  }
  const data = (await uploadRes.json()) as { id: number };
  return data.id;
}

export interface PublishBlogInput {
  title: string;
  content: string;          // markdown or HTML
  slug: string;
  metaDescription: string;
  primaryKeyword: string;
  focusKeywords?: string[];
  featuredImageUrl?: string;
  status?: "publish" | "draft";
}

/**
 * Publish a blog to WordPress with featured image + Yoast meta.
 * Yoast meta keys are written via `meta` (Yoast registers them on the REST API).
 */
export async function publishBlog(
  creds: WordPressCredentials,
  blog: PublishBlogInput
): Promise<WordPressPublishResult> {
  const base = normalizeSiteUrl(creds.siteUrl);

  let featuredMediaId: number | null = null;
  if (blog.featuredImageUrl) {
    featuredMediaId = await uploadFeaturedImage(creds, blog.featuredImageUrl, `${blog.slug}.jpg`);
  }

  /* Minimal markdown → HTML so content renders decently if user pastes markdown. */
  const html = markdownToHtml(blog.content);

  const yoastMeta: Record<string, string> = {
    _yoast_wpseo_title: blog.title,
    _yoast_wpseo_metadesc: blog.metaDescription,
    _yoast_wpseo_focuskw: blog.primaryKeyword,
    "_yoast_wpseo_meta-robots-noindex": "0",
  };
  if (blog.focusKeywords?.length) {
    yoastMeta["_yoast_wpseo_keywordsynonyms"] = JSON.stringify(blog.focusKeywords);
  }

  const payload: Record<string, unknown> = {
    title: blog.title,
    slug: blog.slug,
    content: html,
    status: blog.status ?? "publish",
    excerpt: blog.metaDescription,
    meta: yoastMeta,
  };
  if (featuredMediaId) payload.featured_media = featuredMediaId;

  const res = await fetch(`${base}/wp-json/wp/v2/posts`, {
    method: "POST",
    headers: {
      Authorization: authHeader(creds),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`WP publish failed (${res.status}): ${text.slice(0, 300)}`);
  }
  const data = (await res.json()) as { id: number; link: string; slug: string };
  return { postId: data.id, postUrl: data.link, slug: data.slug };
}

/* Lightweight markdown → HTML (paragraphs, headings, bold, italic, links, lists) */
export function markdownToHtml(md: string): string {
  const lines = md.split(/\r?\n/);
  const out: string[] = [];
  let inList = false;

  const closeList = () => {
    if (inList) {
      out.push("</ul>");
      inList = false;
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    if (!line.trim()) {
      closeList();
      continue;
    }

    /* Headings */
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      closeList();
      const level = h[1].length;
      out.push(`<h${level}>${inline(h[2])}</h${level}>`);
      continue;
    }

    /* Unordered list */
    const li = line.match(/^[-*]\s+(.*)$/);
    if (li) {
      if (!inList) {
        out.push("<ul>");
        inList = true;
      }
      out.push(`<li>${inline(li[1])}</li>`);
      continue;
    }

    closeList();
    out.push(`<p>${inline(line)}</p>`);
  }
  closeList();
  return out.join("\n");
}

function inline(s: string): string {
  return s
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" rel="noopener">$1</a>');
}
