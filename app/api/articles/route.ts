import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { doc, collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { Article, BlogOSUser } from "@/types";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");
  const published = searchParams.get("published");

  try {
    if (slug) {
      const snap = await getDocs(
        query(collection(db, "articles"), where("slug", "==", slug))
      );
      if (snap.empty) return NextResponse.json({ error: "Not found" }, { status: 404 });
      const article = snap.docs[0].data() as Article;
      article.viewCount = (article.viewCount || 0) + 1;
      await updateDoc(doc(db, "articles", snap.docs[0].id), { viewCount: article.viewCount });
      return NextResponse.json(article);
    }

    let q = query(collection(db, "articles"));
    if (published === "true") {
      q = query(collection(db, "articles"), where("published", "==", true));
    }
    const snap = await getDocs(q);
    const articles = snap.docs.map((d) => ({ ...d.data(), id: d.id } as Article));
    return NextResponse.json(articles);
  } catch (err) {
    console.error("[articles GET]", err);
    return NextResponse.json({ error: "Failed to fetch articles" }, { status: 500 });
  }
}

async function getAdminUser(req: NextRequest) {
  const sessionCookie = cookies().get("session")?.value;
  if (!sessionCookie) return null;
  const decoded = await adminAuth.verifySessionCookie(sessionCookie, true).catch(() => null);
  if (!decoded) return null;
  const userSnap = await adminDb.collection("users").doc(decoded.uid).get();
  const user = userSnap.data() as BlogOSUser | undefined;
  return user?.isAdmin ? { ...user, uid: decoded.uid } : null;
}

export async function POST(req: NextRequest) {
  const adminUser = await getAdminUser(req);
  if (!adminUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await req.json();
    const { title, slug, excerpt, content, featuredImage, category, tags, seoTitle, metaDescription, published } = data;

    if (!slug || !title) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    const existing = await getDocs(
      query(collection(db, "articles"), where("slug", "==", slug))
    );
    if (!existing.empty) {
      return NextResponse.json({ error: "Slug already exists" }, { status: 400 });
    }

    const now = new Date().toISOString();
    const article: Omit<Article, "id"> = {
      slug,
      title,
      excerpt,
      content,
      featuredImage,
      category,
      tags: tags || [],
      seoTitle: seoTitle || title,
      metaDescription: metaDescription || excerpt,
      author: adminUser.uid,
      published: published || false,
      viewCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await addDoc(collection(db, "articles"), article);
    return NextResponse.json({ id: docRef.id, ...article }, { status: 201 });
  } catch (err) {
    console.error("[articles POST]", err);
    return NextResponse.json({ error: "Failed to create article" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const adminUser = await getAdminUser(req);
  if (!adminUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await req.json();
    const { id, ...updates } = data;

    if (!id) {
      return NextResponse.json({ error: "Missing article id" }, { status: 400 });
    }

    updates.updatedAt = new Date().toISOString();
    await updateDoc(doc(db, "articles", id), updates);
    return NextResponse.json({ id, ...updates });
  } catch (err) {
    console.error("[articles PUT]", err);
    return NextResponse.json({ error: "Failed to update article" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const adminUser = await getAdminUser(req);
  if (!adminUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing article id" }, { status: 400 });
    }

    await deleteDoc(doc(db, "articles", id));
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[articles DELETE]", err);
    return NextResponse.json({ error: "Failed to delete article" }, { status: 500 });
  }
}
