import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { publishBlog } from "@/lib/wordpress/api";
import type { Blog, BlogOSUser } from "@/types";

export const runtime = "nodejs";
export const maxDuration = 90;

export async function POST(req: NextRequest) {
  try {
    const session = cookies().get("session")?.value;
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const decoded = await adminAuth.verifySessionCookie(session, true).catch(() => null);
    if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { blogId } = (await req.json()) as { blogId: string };
    if (!blogId) return NextResponse.json({ error: "blogId required" }, { status: 400 });

    const [userSnap, blogSnap] = await Promise.all([
      adminDb.collection("users").doc(decoded.uid).get(),
      adminDb.collection("blogs").doc(blogId).get(),
    ]);

    const user = userSnap.data() as BlogOSUser | undefined;
    const blog = blogSnap.data() as Blog | undefined;

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    if (!blog) return NextResponse.json({ error: "Blog not found" }, { status: 404 });
    if (blog.userId !== decoded.uid) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    if (!user.wordpressConnected || !user.wordpressSiteUrl || !user.wordpressUsername || !user.wordpressAppPassword) {
      return NextResponse.json({ error: "WordPress is not connected" }, { status: 400 });
    }

    const result = await publishBlog(
      {
        siteUrl: user.wordpressSiteUrl,
        username: user.wordpressUsername,
        appPassword: user.wordpressAppPassword,
      },
      {
        title: blog.seoTitle,
        content: blog.content,
        slug: blog.permalink,
        metaDescription: blog.metaDescription,
        primaryKeyword: blog.primaryKeyword,
        focusKeywords: blog.secondaryKeywords,
        featuredImageUrl: blog.featuredImageUrl,
        status: "publish",
      }
    );

    await adminDb.collection("blogs").doc(blogId).update({
      status: "published",
      wordpressPostId: String(result.postId),
      wordpressPostUrl: result.postUrl,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("[wp/publish]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Publish failed" },
      { status: 500 }
    );
  }
}
