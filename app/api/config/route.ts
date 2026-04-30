import { NextResponse } from "next/server";
import { MODELS } from "@/lib/models";
import { isDbConfigured } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  const providers = {
    anthropic: Boolean(process.env.ANTHROPIC_API_KEY),
    openai: Boolean(process.env.OPENAI_API_KEY),
    google: Boolean(process.env.GOOGLE_API_KEY),
  };
  const tts = Boolean(process.env.ELEVENLABS_API_KEY);
  const stt = tts;
  const db = isDbConfigured();

  const availableModels = MODELS.filter((m) => providers[m.provider]).map((m) => ({
    id: m.id,
    label: m.label,
    provider: m.provider,
  }));

  return NextResponse.json({
    providers,
    tts,
    stt,
    db,
    availableModels,
    hasAnyModel: availableModels.length > 0,
  });
}
