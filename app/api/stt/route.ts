import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Speech-to-text using ElevenLabs' Scribe model. Accepts a multipart/form-data
 * upload with an `audio` file field and returns the transcribed text.
 */
export async function POST(req: NextRequest) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "ELEVENLABS_API_KEY not set" }, { status: 500 });
  }

  const form = await req.formData();
  const file = form.get("audio");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing audio file" }, { status: 400 });
  }

  const upstream = new FormData();
  upstream.append("file", file, file.name || "audio.webm");
  upstream.append("model_id", "scribe_v1");

  const res = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
    method: "POST",
    headers: { "xi-api-key": apiKey },
    body: upstream,
  });

  if (!res.ok) {
    const errText = await res.text();
    return NextResponse.json(
      { error: `ElevenLabs STT failed: ${res.status} ${errText}` },
      { status: 502 }
    );
  }

  const data = (await res.json()) as { text?: string };
  return NextResponse.json({ text: data.text ?? "" });
}
