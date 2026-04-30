import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "ELEVENLABS_API_KEY not set" }, { status: 500 });
  }

  const { text, voiceId, modelId } = (await req.json()) as {
    text: string;
    voiceId?: string;
    modelId?: string;
  };

  if (!text || !text.trim()) {
    return NextResponse.json({ error: "Empty text" }, { status: 400 });
  }

  const voice = voiceId || process.env.ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM";
  const model = modelId || process.env.ELEVENLABS_MODEL_ID || "eleven_multilingual_v2";

  const elRes = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voice}?output_format=mp3_44100_128`,
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: model,
        voice_settings: { stability: 0.45, similarity_boost: 0.8, style: 0.2 },
      }),
    }
  );

  if (!elRes.ok) {
    const errText = await elRes.text();
    return NextResponse.json(
      { error: `ElevenLabs TTS failed: ${elRes.status} ${errText}` },
      { status: 502 }
    );
  }

  const audio = await elRes.arrayBuffer();
  return new NextResponse(audio, {
    status: 200,
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "no-store",
    },
  });
}
