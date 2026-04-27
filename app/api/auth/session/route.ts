import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { PLAN_LIMITS, TRIAL_DURATION_DAYS } from "@/types";

/* Admin users get unlimited generation + unlimited publishing. */
const ADMIN_BLOG_LIMIT = 99999;

const SESSION_DURATION_MS = 60 * 60 * 24 * 7 * 1000; // 7 days

function trialDates() {
  const startedAt = new Date();
  const endsAt = new Date(startedAt);
  endsAt.setDate(endsAt.getDate() + TRIAL_DURATION_DAYS);
  return {
    trialStartedAt: startedAt.toISOString(),
    trialEndsAt: endsAt.toISOString(),
  };
}

/* POST — sign in: verify ID token, create session cookie, init Firestore user */
export async function POST(req: NextRequest) {
  try {
    const { idToken } = await req.json();
    if (!idToken) {
      return NextResponse.json({ error: "Missing idToken" }, { status: 400 });
    }

    /* Verify the Firebase ID token first */
    const decoded = await adminAuth.verifyIdToken(idToken);

    /* Create long-lived session cookie */
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn: SESSION_DURATION_MS,
    });

    /* Create or update Firestore user document */
    const userRef = adminDb.collection("users").doc(decoded.uid);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      /* First login — bootstrap with a 30-day Pro trial */
      const userRecord = await adminAuth.getUser(decoded.uid);
      const { trialStartedAt, trialEndsAt } = trialDates();

      await userRef.set({
        uid: decoded.uid,
        email: decoded.email ?? "",
        name:
          userRecord.displayName ??
          (decoded.email?.split("@")[0] ?? "User"),
        plan: "free",
        blogsUsed: 0,
        /* Mirror Pro during trial — blog limit + WP access */
        blogsLimit: PLAN_LIMITS.pro.blogs,
        wordpressConnected: false,
        trialActive: true,
        trialStartedAt,
        trialEndsAt,
        createdAt: new Date().toISOString(),
        lastActive: new Date().toISOString(),
        isAdmin: false,
      });
    } else {
      /* Existing user — on login, re-evaluate trial expiry + admin quota */
      const existing = userSnap.data() as {
        plan: "free" | "pro" | "business";
        trialActive?: boolean;
        trialEndsAt?: string;
        blogsLimit?: number;
        isAdmin?: boolean;
      };

      const patch: Record<string, unknown> = { lastActive: new Date().toISOString() };

      /* Admin users always have unlimited generation + publishing. */
      if (existing.isAdmin && existing.blogsLimit !== ADMIN_BLOG_LIMIT) {
        patch.blogsLimit = ADMIN_BLOG_LIMIT;
      }

      if (existing.trialActive && existing.trialEndsAt) {
        const expired = new Date(existing.trialEndsAt) <= new Date();
        if (expired) {
          patch.trialActive = false;
          /* Drop blogsLimit back to the user's real plan — unless admin */
          if (!existing.isAdmin) {
            patch.blogsLimit = PLAN_LIMITS[existing.plan].blogs;
          }
        }
      }

      await userRef.update(patch);
    }

    /* Set HttpOnly session cookie */
    cookies().set("session", sessionCookie, {
      maxAge: SESSION_DURATION_MS / 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "lax",
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[session/POST]", err);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 401 }
    );
  }
}

/* DELETE — sign out: clear session cookie */
export async function DELETE() {
  cookies().delete("session");
  return NextResponse.json({ success: true });
}
