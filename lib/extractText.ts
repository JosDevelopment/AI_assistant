/**
 * Server-side text extraction from uploaded files. Supports plain text,
 * markdown, JSON, CSV and PDF. Anything else is best-effort decoded as UTF-8.
 */
export async function extractText(file: File): Promise<string> {
  const name = (file.name || "").toLowerCase();
  const ext = name.split(".").pop() ?? "";
  const buf = Buffer.from(await file.arrayBuffer());

  if (ext === "pdf") {
    // Lazy-import to keep cold start fast and avoid bundling issues.
    const pdfParse = (await import("pdf-parse")).default;
    const parsed = await pdfParse(buf);
    return parsed.text;
  }

  return buf.toString("utf-8");
}
