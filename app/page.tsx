"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import ModelSelector from "@/components/ModelSelector";
import PromptPicker from "@/components/PromptPicker";
import FileUploader from "@/components/FileUploader";
import ChatPanel from "@/components/ChatPanel";
import { AudioReactor } from "@/lib/audio";
import { useApp } from "@/lib/store";

// The sphere uses Three.js; render only on the client.
const Sphere = dynamic(() => import("@/components/Sphere"), { ssr: false });

export default function Home() {
  const reactor = useMemo(() => new AudioReactor(), []);
  const [level, setLevel] = useState(0);
  const speaking = useApp((s) => s.speaking);

  useEffect(() => {
    const unsub = reactor.subscribe((v) => setLevel(v));
    return () => {
      unsub();
      reactor.disconnect();
    };
  }, [reactor]);

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
        <ModelSelector />
        <PromptPicker />
        <FileUploader />
      </aside>

      {/* Center: the orb */}
      <section className="relative overflow-hidden rounded-xl border border-border bg-gradient-to-b from-[#0b0b14] to-[#050507]">
        <Sphere level={level} active={speaking} />
        <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-border bg-panel/70 px-3 py-1 text-xs text-white/60 backdrop-blur">
          {speaking ? "Speaking" : "Idle"}
        </div>
      </section>

      {/* Right: chat */}
      <aside className="overflow-hidden rounded-xl border border-border bg-panel/40 p-4">
        <ChatPanel reactor={reactor} />
      </aside>
    </main>
  );
}
