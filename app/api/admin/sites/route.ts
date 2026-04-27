import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { validateWordPress } from "@/lib/wordpress/api";
import type { AdminSite, AdminSiteKind } from "@/types";

export const runtime = "nodejs";

async function requireAdmin() {
  const session = cookies().get("session")?.value;
  if (!session) return null;
  const decoded = await adminAuth.verifySessionCookie(session, true).catch(() => null);
  if (!decoded || !decoded.admin) return null;
  return decoded;
}

function sitesRef(uid: string) {
  return adminDb.collection("users").doc(uid).collection("adminSites");
}

/* ─── GET — list all connected admin sites ─────────────── */
export async function GET() {
  const decoded = await requireAdmin();
  if (!decoded) return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const snap = await sitesRef(decoded.uid).orderBy("createdAt", "desc").get();
  const sites: AdminSite[] = snap.docs.map((d) => {
    const data = d.data() as AdminSite;
    /* Never leak the WP password back to the client */
    return {
      ...data,
      id: d.id,
      appPassword: data.appPassword ? "••••••••" : undefined,
    };
  });
  return NextResponse.json({ sites });
}

/* ─── POST — add a new site ──────────────────────────── */
export async function POST(req: NextRequest) {
  const decoded = await requireAdmin();
  if (!decoded) return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const { label, kind, siteUrl, username, appPassword, authorName } =
    (await req.json()) as {
      label: string;
      kind: AdminSiteKind;
      siteUrl: string;
      username?: string;
      appPassword?: string;
      authorName?: string;
    };

  if (!label || !kind || !siteUrl) {
    return NextResponse.json({ error: "label, kind, siteUrl required" }, { status: 400 });
  }

  const normalizedUrl = siteUrl.replace(/\/+$/, "");

  /* For WordPress sites, validate credentials before saving */
  if (kind === "wordpress") {
    if (!username || !appPassword) {
      return NextResponse.json(
        { error: "WordPress sites need username + appPassword" },
        { status: 400 }
      );
    }
    const check = await validateWordPress({ siteUrl: normalizedUrl, username, appPassword });
    if (!check.ok) {
      return NextResponse.json({ error: check.message }, { status: 400 });
    }
  }

  const id = `${kind}-${Date.now()}`;
  const doc: AdminSite = {
    id,
    label,
    kind,
    siteUrl: normalizedUrl,
    username: username ?? "",
    appPassword: appPassword ?? "",
    authorName: authorName ?? "",
    createdAt: new Date().toISOString(),
  };

  await sitesRef(decoded.uid).doc(id).set(doc);

  /* Echo without the secret */
  return NextResponse.json({
    site: { ...doc, appPassword: appPassword ? "••••••••" : undefined },
  });
}

/* ─── DELETE — remove a site ─────────────────────────── */
export async function DELETE(req: NextRequest) {
  const decoded = await requireAdmin();
  if (!decoded) return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  await sitesRef(decoded.uid).doc(id).delete();
  return NextResponse.json({ ok: true });
}
