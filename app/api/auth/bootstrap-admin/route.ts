import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";

/**
 * One-time admin bootstrap endpoint.
 *
 * Usage (run once after first deployment):
 *   POST /api/auth/bootstrap-admin
 *   Body: { "secret": "<ADMIN_BOOTSTRAP_SECRET>" }
 *
 * After success: log out and log back in so the new admin claim appears
 * in the session cookie.
 */
export async function POST(req: NextRequest) {
  try {
    const { secret } = await req.json();

    if (!secret || secret !== process.env.ADMIN_BOOTSTRAP_SECRET) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) {
      return NextResponse.json(
        { error: "ADMIN_EMAIL not set in environment" },
        { status: 500 }
      );
    }

    const userRecord = await adminAuth.getUserByEmail(adminEmail);
    await adminAuth.setCustomUserClaims(userRecord.uid, { admin: true });

    return NextResponse.json({
      success: true,
      message: `Admin claim set on ${adminEmail}. Log out and log back in to activate.`,
    });
  } catch (err) {
    console.error("[bootstrap-admin]", err);
    return NextResponse.json({ error: "Failed to set admin claim" }, { status: 500 });
  }
}
