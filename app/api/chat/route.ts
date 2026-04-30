import { NextRequest, NextResponse } from "next/server";
import { findModel, reason, type ChatMessage } from "@/lib/models";

export const runtime = "nodejs";

type Body = {
  modelId: string;
  systemPrompt: string;
  context?: string;
  history: ChatMessage[];
  message: string;
};

export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const model = findModel(body.modelId);
  if (!model) {
    return NextResponse.json({ error: `Unknown model: ${body.modelId}` }, { status: 400 });
  }

  try {
    const text = await reason(model, {
      systemPrompt: body.systemPrompt || "You are a helpful assistant.",
      context: body.context,
      history: body.history || [],
      userMessage: body.message,
    });
    return NextResponse.json({ text });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
