import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { publishBlog } from "@/lib/wordpress/api";
import type { AdminSite, Article } from "@/types";

export const runtime = "nodejs";
export const maxDuration = 90;

/* Payload: an admin-authored blog + the target site id. */
interface PublishPayload {
  siteId: string;
  title: string;
  slug: string;
  content: string;          /* markdown */
  excerpt: string;
  metaDescription: string;
  primaryKeyword: string;
  focusKeywords?: string[];
  featuredImageUrl?: string;
  category?: string;
  tags?: string[];
  status?: "publish" | "draft";
}

export async function POST(req: NextRequest) {
  const session = cookies().get("session")?.value;
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const decoded = await adminAuth.verifySessionCookie(session, true).catch(() => null);
  if (!decoded || !decoded.admin) {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const body = (await req.json()) as PublishPayload;
  if (!body.siteId || !body.title || !body.slug || !body.content) {
    return NextResponse.json(
      { error: "siteId, title, slug, content required" },
      { status: 400 }
    );
  }

  const siteSnap = await adminDb
    .collection("users")
    .doc(decoded.uid)
    .collection("adminSites")
    .doc(body.siteId)
    .get();

  const site = siteSnap.data() as AdminSite | undefined;
  if (!site) return NextResponse.json({ error: "Site not found" }, { status: 404 });

  const now = new Date().toISOString();

  if (site.kind === "wordpress") {
    if (!site.username || !site.appPassword) {
      return NextResponse.json({ error: "Site has no credentials" }, { status: 400 });
    }
    const result = await publishBlog(
      { siteUrl: site.siteUrl, username: site.username, appPassword: site.appPassword },
      {
        title: body.title,
        slug: body.slug,
        content: body.content,
        metaDescription: body.metaDescription,
        primaryKeyword: body.primaryKeyword,
        focusKeywords: body.focusKeywords,
        featuredImageUrl: body.featuredImageUrl,
        status: body.status ?? "publish",
      }
    );

    await siteSnap.ref.update({ lastPublishedAt: now });

    return NextResponse.json({
      kind: "wordpress",
      postId: result.postId,
      postUrl: result.postUrl,
      slug: result.slug,
    });
  }

  /* kind === "blogos-internal" — store in the Article collection, rendered at /blog/<slug> */
  const articleId = body.slug;
  const article: Article = {
    id: articleId,
    slug: body.slug,
    title: body.title,
    excerpt: body.excerpt ?? body.metaDescription,
    content: body.content,
    featuredImage: body.featuredImageUrl ?? "",
    category: body.category ?? "",
    tags: body.tags ?? [],
    seoTitle: body.title,
    metaDescription: body.metaDescription,
    author: decoded.uid,
    published: (body.status ?? "publish") === "publish",
    viewCount: 0,
    createdAt: now,
    updatedAt: now,
  };

  await adminDb.collection("articles").doc(articleId).set(article);
  await siteSnap.ref.update({ lastPublishedAt: now });

  return NextResponse.json({
    kind: "blogos-internal",
    postUrl: `/blog/${body.slug}`,
    slug: body.slug,
  });
}
