import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";

export type ChatMessage = { role: "user" | "assistant"; content: string };

export type ModelOption = {
  id: string;
  label: string;
  provider: "anthropic" | "openai" | "google";
  modelId: string;
};

export const MODELS: ModelOption[] = [
  { id: "claude-opus-4-7", label: "Claude Opus 4.7", provider: "anthropic", modelId: "claude-opus-4-7" },
  { id: "claude-sonnet-4-6", label: "Claude Sonnet 4.6", provider: "anthropic", modelId: "claude-sonnet-4-6" },
  { id: "claude-haiku-4-5", label: "Claude Haiku 4.5", provider: "anthropic", modelId: "claude-haiku-4-5-20251001" },
  { id: "gpt-4o", label: "GPT-4o", provider: "openai", modelId: "gpt-4o" },
  { id: "gpt-4-1", label: "GPT-4.1", provider: "openai", modelId: "gpt-4.1" },
  { id: "gemini-2-5-pro", label: "Gemini 2.5 Pro", provider: "google", modelId: "gemini-2.5-pro" },
  { id: "gemini-2-5-flash", label: "Gemini 2.5 Flash", provider: "google", modelId: "gemini-2.5-flash" },
];

export function findModel(id: string): ModelOption | undefined {
  return MODELS.find((m) => m.id === id);
}

export type ReasonInput = {
  systemPrompt: string;
  context?: string;
  history: ChatMessage[];
  userMessage: string;
};

export async function reason(model: ModelOption, input: ReasonInput): Promise<string> {
  const fullSystem = input.context
    ? `${input.systemPrompt}\n\n--- Reference context provided by the user ---\n${input.context}`
    : input.systemPrompt;

  if (model.provider === "anthropic") {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");
    const client = new Anthropic({ apiKey });
    const res = await client.messages.create({
      model: model.modelId,
      max_tokens: 1024,
      system: fullSystem,
      messages: [
        ...input.history.map((m) => ({ role: m.role, content: m.content })),
        { role: "user", content: input.userMessage },
      ],
    });
    const block = res.content.find((b) => b.type === "text");
    return block && block.type === "text" ? block.text : "";
  }

  if (model.provider === "openai") {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY not set");
    const client = new OpenAI({ apiKey });
    const res = await client.chat.completions.create({
      model: model.modelId,
      messages: [
        { role: "system", content: fullSystem },
        ...input.history.map((m) => ({ role: m.role, content: m.content })),
        { role: "user", content: input.userMessage },
      ],
    });
    return res.choices[0]?.message?.content ?? "";
  }

  if (model.provider === "google") {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) throw new Error("GOOGLE_API_KEY not set");
    const genAI = new GoogleGenerativeAI(apiKey);
    const gModel = genAI.getGenerativeModel({
      model: model.modelId,
      systemInstruction: fullSystem,
    });
    const chat = gModel.startChat({
      history: input.history.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      })),
    });
    const res = await chat.sendMessage(input.userMessage);
    return res.response.text();
  }

  throw new Error(`Unknown provider: ${(model as ModelOption).provider}`);
}
