import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminAuth, adminDb } from "@/lib/firebase/admin";

export const runtime = "nodejs";

export async function GET(_req: NextRequest) {
  try {
    const session = cookies().get("session")?.value;
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = await adminAuth.verifySessionCookie(session, true).catch(() => null);
    if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const snap = await adminDb
      .collection("blogs")
      .where("userId", "==", decoded.uid)
      .get();

    const blogs = snap.docs
      .map((d) => {
        const data = d.data();
        return {
          ...data,
          id: d.id,
          createdAt: data.createdAt?.toDate?.()?.toISOString() ?? data.createdAt ?? "",
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() ?? data.updatedAt ?? "",
        };
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ blogs });
  } catch (err) {
    console.error("[api/blogs]", err);
    return NextResponse.json({ error: "Failed to load blogs" }, { status: 500 });
  }
}
