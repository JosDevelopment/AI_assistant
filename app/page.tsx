"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import ModelSelector from "@/components/ModelSelector";
import PromptPicker from "@/components/PromptPicker";
import FileUploader from "@/components/FileUploader";
import ChatPanel from "@/components/ChatPanel";
import { AudioReactor } from "@/lib/audio";
import { useApp } from "@/lib/store";
import { useCapabilities } from "@/lib/capabilities";

// The sphere uses Three.js; render only on the client.
const Sphere = dynamic(() => import("@/components/Sphere"), { ssr: false });

export default function Home() {
  const reactor = useMemo(() => new AudioReactor(), []);
  const [level, setLevel] = useState(0);
  const speaking = useApp((s) => s.speaking);
  const ensureModel = useApp((s) => s.ensureModel);

  const { caps, loading } = useCapabilities();

  useEffect(() => {
    const unsub = reactor.subscribe((v) => setLevel(v));
    return () => {
      unsub();
      reactor.disconnect();
    };
  }, [reactor]);

  useEffect(() => {
    ensureModel(caps.availableModels.map((m) => m.id));
  }, [caps.availableModels, ensureModel]);

  return (
    <main className="grid h-screen grid-cols-1 gap-4 p-4 lg:grid-cols-[320px_1fr_400px]">
      {/* Left: configuration */}
      <aside className="flex flex-col gap-4 overflow-y-auto rounded-xl border border-border bg-panel/40 p-4">
        <header>
          <h1 className="text-lg font-semibold">Prompt Sphere</h1>
          <p className="text-xs text-white/50">
            Voice-reactive multi-model assistant
          </p>
        </header>
        <ModelSelector caps={caps} />
        <PromptPicker />
        <FileUploader />
        {!loading ? <StatusBadges caps={caps} /> : null}
      </aside>

      {/* Center: the orb */}
      <section className="relative overflow-hidden rounded-xl border border-border bg-gradient-to-b from-[#0b0b14] to-[#050507]">
        <Sphere level={level} active={speaking} />
        <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-border bg-panel/70 px-3 py-1 text-xs text-white/60 backdrop-blur">
          {speaking ? (caps.tts ? "Speaking" : "Speaking (silent)") : "Idle"}
        </div>
      </section>

      {/* Right: chat */}
      <aside className="overflow-hidden rounded-xl border border-border bg-panel/40 p-4">
        <ChatPanel reactor={reactor} caps={caps} />
      </aside>
    </main>
  );
}

function StatusBadges({ caps }: { caps: ReturnType<typeof useCapabilities>["caps"] }) {
  const items: { label: string; ok: boolean }[] = [
    { label: "Anthropic", ok: caps.providers.anthropic },
    { label: "OpenAI", ok: caps.providers.openai },
    { label: "Google", ok: caps.providers.google },
    { label: "TTS", ok: caps.tts },
    { label: "STT", ok: caps.stt },
    { label: "DB", ok: caps.db },
  ];
  return (
    <div className="mt-auto flex flex-wrap gap-1 pt-2">
      {items.map((it) => (
        <span
          key={it.label}
          className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider ${
            it.ok
              ? "bg-emerald-500/15 text-emerald-300"
              : "bg-white/5 text-white/40 line-through"
          }`}
          title={it.ok ? "Configured" : "Not configured — feature disabled"}
        >
          {it.label}
        </span>
      ))}
    </div>
  );
}
