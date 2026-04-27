import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminAuth, adminDb } from "@/lib/firebase/admin";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = cookies().get("session")?.value;
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = await adminAuth.verifySessionCookie(session, true).catch(() => null);
    if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const snap = await adminDb.collection("blogs").doc(params.id).get();

    if (!snap.exists) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const data = snap.data()!;
    if (data.userId !== decoded.uid) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({
      blog: {
        ...data,
        id: snap.id,
        createdAt: data.createdAt?.toDate?.()?.toISOString() ?? data.createdAt ?? "",
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() ?? data.updatedAt ?? "",
      },
    });
  } catch (err) {
    console.error("[api/blogs/[id]]", err);
    return NextResponse.json({ error: "Failed to load blog" }, { status: 500 });
  }
}
