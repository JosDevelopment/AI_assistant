"use client";

import { create } from "zustand";
import type { ChatMessage, ModelOption } from "./models";
import { MODELS } from "./models";

export type Prompt = { id: string; title: string; content: string };

type State = {
  model: ModelOption;
  setModel: (id: string) => void;

  systemPrompt: string;
  setSystemPrompt: (v: string) => void;

  context: string;
  contextLabel: string;
  setContext: (v: string, label: string) => void;
  clearContext: () => void;

  history: ChatMessage[];
  pushMessage: (m: ChatMessage) => void;
  resetHistory: () => void;

  speaking: boolean;
  setSpeaking: (v: boolean) => void;

  level: number;
  setLevel: (v: number) => void;
};

export const useApp = create<State>((set) => ({
  model: MODELS[0],
  setModel: (id) => {
    const m = MODELS.find((x) => x.id === id);
    if (m) set({ model: m });
  },
  systemPrompt: "You are a helpful, conversational assistant. Keep replies concise and natural to listen to.",
  setSystemPrompt: (v) => set({ systemPrompt: v }),
  context: "",
  contextLabel: "",
  setContext: (v, label) => set({ context: v, contextLabel: label }),
  clearContext: () => set({ context: "", contextLabel: "" }),
  history: [],
  pushMessage: (m) => set((s) => ({ history: [...s.history, m] })),
  resetHistory: () => set({ history: [] }),
  speaking: false,
  setSpeaking: (v) => set({ speaking: v }),
  level: 0,
  setLevel: (v) => set({ level: v }),
}));
