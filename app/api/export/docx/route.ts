import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import {
  Document,
  Packer,
  Paragraph,
  HeadingLevel,
  TextRun,
  AlignmentType,
} from "docx";
import type { Blog } from "@/types";

export const runtime = "nodejs";
export const maxDuration = 60;

interface InlineRun {
  text: string;
  bold?: boolean;
  italic?: boolean;
}

/* Parse inline markdown into docx TextRuns */
function parseInline(line: string): InlineRun[] {
  const runs: InlineRun[] = [];
  /* Regex — order matters: bold first (**), then italic (*) */
  const pattern = /(\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = pattern.exec(line)) !== null) {
    if (m.index > lastIndex) {
      runs.push({ text: line.slice(lastIndex, m.index) });
    }
    const tok = m[0];
    if (tok.startsWith("**")) {
      runs.push({ text: tok.slice(2, -2), bold: true });
    } else {
      runs.push({ text: tok.slice(1, -1), italic: true });
    }
    lastIndex = pattern.lastIndex;
  }
  if (lastIndex < line.length) runs.push({ text: line.slice(lastIndex) });
  if (runs.length === 0) runs.push({ text: line });
  return runs;
}

function toTextRuns(runs: InlineRun[]): TextRun[] {
  return runs.map((r) => new TextRun({ text: r.text, bold: r.bold, italics: r.italic }));
}

function markdownToParagraphs(markdown: string): Paragraph[] {
  const lines = markdown.split(/\r?\n/);
  const paragraphs: Paragraph[] = [];

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      paragraphs.push(new Paragraph({ children: [new TextRun("")] }));
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      const level = heading[1].length;
      const headingLevels = [
        HeadingLevel.HEADING_1,
        HeadingLevel.HEADING_2,
        HeadingLevel.HEADING_3,
        HeadingLevel.HEADING_4,
        HeadingLevel.HEADING_5,
        HeadingLevel.HEADING_6,
      ];
      paragraphs.push(
        new Paragraph({
          heading: headingLevels[level - 1] ?? HeadingLevel.HEADING_2,
          children: toTextRuns(parseInline(heading[2])),
          spacing: { before: 200, after: 120 },
        })
      );
      continue;
    }

    const listItem = line.match(/^[-*]\s+(.*)$/);
    if (listItem) {
      paragraphs.push(
        new Paragraph({
          bullet: { level: 0 },
          children: toTextRuns(parseInline(listItem[1])),
        })
      );
      continue;
    }

    paragraphs.push(
      new Paragraph({
        children: toTextRuns(parseInline(line)),
        spacing: { after: 120 },
      })
    );
  }

  return paragraphs;
}

export async function POST(req: NextRequest) {
  try {
    const session = cookies().get("session")?.value;
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const decoded = await adminAuth.verifySessionCookie(session, true).catch(() => null);
    if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { blogId } = (await req.json()) as { blogId: string };
    if (!blogId) return NextResponse.json({ error: "blogId required" }, { status: 400 });

    const snap = await adminDb.collection("blogs").doc(blogId).get();
    if (!snap.exists) return NextResponse.json({ error: "Blog not found" }, { status: 404 });
    const blog = snap.data() as Blog;
    if (blog.userId !== decoded.uid) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    /* Header — title + meta */
    const header: Paragraph[] = [
      new Paragraph({
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.LEFT,
        children: [new TextRun({ text: blog.seoTitle, bold: true })],
        spacing: { after: 160 },
      }),
      new Paragraph({
        children: [new TextRun({ text: blog.metaDescription, italics: true })],
        spacing: { after: 240 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "Primary keyword: ", bold: true }),
          new TextRun({ text: blog.primaryKeyword }),
        ],
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "Region: ", bold: true }),
          new TextRun({ text: blog.region }),
        ],
        spacing: { after: 240 },
      }),
    ];

    const body = markdownToParagraphs(blog.content || "");

    const doc = new Document({
      creator: "BlogOS",
      title: blog.seoTitle,
      description: blog.metaDescription,
      sections: [{ children: [...header, ...body] }],
    });

    const buffer = await Packer.toBuffer(doc);
    const filename = `${blog.permalink || "blog"}.docx`;

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("[export/docx]", err);
    return NextResponse.json({ error: "DOCX export failed" }, { status: 500 });
  }
}
