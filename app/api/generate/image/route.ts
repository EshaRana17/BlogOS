import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminAuth, adminDb } from "@/lib/firebase/admin";

export const runtime = "nodejs";
export const maxDuration = 90;

/* Replicate SDXL model — fast public version */
const MODEL_VERSION = "39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b";

export async function POST(req: NextRequest) {
  try {
    const session = cookies().get("session")?.value;
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const decoded = await adminAuth.verifySessionCookie(session, true).catch(() => null);
    if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { prompt, blogId } = (await req.json()) as { prompt: string; blogId?: string };
    if (!prompt) return NextResponse.json({ error: "prompt required" }, { status: 400 });

    const token = process.env.REPLICATE_API_KEY;
    if (!token) return NextResponse.json({ error: "REPLICATE_API_KEY missing" }, { status: 500 });

    /* Create prediction */
    const createRes = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        Authorization: `Token ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version: MODEL_VERSION,
        input: {
          prompt,
          width: 1024,
          height: 576,
          num_inference_steps: 25,
          refine: "expert_ensemble_refiner",
        },
      }),
    });

    if (!createRes.ok) {
      const text = await createRes.text();
      return NextResponse.json({ error: `Replicate error: ${text.slice(0, 200)}` }, { status: 500 });
    }

    const prediction = (await createRes.json()) as { id: string; urls: { get: string } };

    /* Poll until terminal state */
    let output: string | null = null;
    for (let i = 0; i < 60; i++) {
      await new Promise((r) => setTimeout(r, 1500));
      const pollRes = await fetch(prediction.urls.get, {
        headers: { Authorization: `Token ${token}` },
      });
      const data = (await pollRes.json()) as { status: string; output: string[] | null; error?: string };
      if (data.status === "succeeded") {
        output = Array.isArray(data.output) ? data.output[0] : null;
        break;
      }
      if (data.status === "failed" || data.status === "canceled") {
        return NextResponse.json({ error: data.error ?? "Image generation failed" }, { status: 500 });
      }
    }

    if (!output) return NextResponse.json({ error: "Image generation timed out" }, { status: 504 });

    /* Persist to blog doc if blogId given */
    if (blogId) {
      await adminDb.collection("blogs").doc(blogId).update({
        featuredImageUrl: output,
        featuredImagePrompt: prompt,
        updatedAt: new Date().toISOString(),
      }).catch(() => { /* best effort */ });
    }

    return NextResponse.json({ imageUrl: output, prompt });
  } catch (err) {
    console.error("[generate/image]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Image generation failed" },
      { status: 500 }
    );
  }
}
