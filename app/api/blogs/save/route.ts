import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import type { Blog } from "@/types";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const session = cookies().get("session")?.value;
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = await adminAuth.verifySessionCookie(session, true).catch(() => null);
    if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = (await req.json()) as Blog & { blogId: string };
    const { blogId, ...blogData } = body;

    if (!blogId || decoded.uid !== blogData.userId) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    await adminDb.collection("blogs").doc(blogId).set({
      ...blogData,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    await adminDb
      .collection("users")
      .doc(decoded.uid)
      .update({ blogsUsed: FieldValue.increment(1), lastActive: new Date().toISOString() })
      .catch(() => {});

    return NextResponse.json({ blogId });
  } catch (err) {
    console.error("[blogs/save]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to save blog" },
      { status: 500 }
    );
  }
}
