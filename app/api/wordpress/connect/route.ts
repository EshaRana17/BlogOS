import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { validateWordPress } from "@/lib/wordpress/api";
import { getEffectivePlan, type BlogOSUser } from "@/types";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const session = cookies().get("session")?.value;
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const decoded = await adminAuth.verifySessionCookie(session, true).catch(() => null);
    if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userSnap = await adminDb.collection("users").doc(decoded.uid).get();
    const user = userSnap.data() as BlogOSUser | undefined;
    if (!user) return NextResponse.json({ error: "User missing" }, { status: 404 });

    /* Gate: Pro+ (trial mirrors Pro, so trialActive counts) */
    const effectivePlan = getEffectivePlan(user);
    if (effectivePlan === "free") {
      return NextResponse.json(
        { error: "WordPress requires Pro or Business (or active trial)." },
        { status: 403 }
      );
    }

    const { siteUrl, username, appPassword } = (await req.json()) as {
      siteUrl: string;
      username: string;
      appPassword: string;
    };

    if (!siteUrl || !username || !appPassword) {
      return NextResponse.json({ error: "siteUrl, username, appPassword are required" }, { status: 400 });
    }

    const validation = await validateWordPress({ siteUrl, username, appPassword });
    if (!validation.ok) {
      return NextResponse.json({ error: validation.message }, { status: 400 });
    }

    await adminDb.collection("users").doc(decoded.uid).update({
      wordpressConnected: true,
      wordpressSiteUrl: siteUrl.replace(/\/+$/, ""),
      wordpressUsername: username,
      wordpressAppPassword: appPassword,  // stored server-side only
      lastActive: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true, user: validation.user });
  } catch (err) {
    console.error("[wp/connect]", err);
    return NextResponse.json({ error: "WordPress connection failed" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const session = cookies().get("session")?.value;
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const decoded = await adminAuth.verifySessionCookie(session, true).catch(() => null);
    if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await adminDb.collection("users").doc(decoded.uid).update({
      wordpressConnected: false,
      wordpressSiteUrl: "",
      wordpressUsername: "",
      wordpressAppPassword: "",
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[wp/disconnect]", err);
    return NextResponse.json({ error: "Disconnect failed" }, { status: 500 });
  }
}
