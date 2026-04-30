import { NextRequest, NextResponse } from "next/server";
import { extractText } from "@/lib/extractText";

export const runtime = "nodejs";

const MAX_CHARS = 120_000;

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const files = form.getAll("files").filter((f): f is File => f instanceof File);
  if (files.length === 0) {
    return NextResponse.json({ error: "No files" }, { status: 400 });
  }

  const chunks: string[] = [];
  for (const file of files) {
    try {
      const text = await extractText(file);
      chunks.push(`### File: ${file.name}\n${text}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "extract error";
      chunks.push(`### File: ${file.name}\n[Could not extract text: ${msg}]`);
    }
  }

  let combined = chunks.join("\n\n");
  if (combined.length > MAX_CHARS) {
    combined = combined.slice(0, MAX_CHARS) + "\n\n[...truncated...]";
  }
  return NextResponse.json({ context: combined, files: files.map((f) => f.name) });
}
