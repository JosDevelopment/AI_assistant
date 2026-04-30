"use client";

import { useRef, useState } from "react";
import { useApp } from "@/lib/store";
import { AudioReactor } from "@/lib/audio";
import MicButton from "./MicButton";
import type { Capabilities } from "@/lib/capabilities";

export default function ChatPanel({
  reactor,
  caps,
}: {
  reactor: AudioReactor;
  caps: Capabilities;
}) {
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const attachedRef = useRef(false);

  const model = useApp((s) => s.model);
  const systemPrompt = useApp((s) => s.systemPrompt);
  const context = useApp((s) => s.context);
  const history = useApp((s) => s.history);
  const pushMessage = useApp((s) => s.pushMessage);
  const resetHistory = useApp((s) => s.resetHistory);
  const setSpeaking = useApp((s) => s.setSpeaking);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || thinking) return;
    if (!caps.hasAnyModel) {
      setError(
        "No model providers configured. Add at least one API key to .env.local and restart."
      );
      return;
    }
    setError(null);
    setInput("");
    pushMessage({ role: "user", content: trimmed });
    setThinking(true);
    try {
      let res: Response;
      try {
        res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            modelId: model.id,
            systemPrompt,
            context: context || undefined,
            history,
            message: trimmed,
          }),
        });
      } catch {
        throw new Error("Could not reach the server. Check your connection.");
      }
      let data: { text?: string; error?: string } = {};
      try {
        data = await res.json();
      } catch {
        // leave empty
      }
      if (!res.ok) throw new Error(data.error || `Chat failed (${res.status})`);
      const reply = (data.text ?? "").trim();
      if (!reply) throw new Error("The model returned an empty response.");
      pushMessage({ role: "assistant", content: reply });
      await speak(reply);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setThinking(false);
    }
  }

  async function speak(text: string) {
    // No TTS configured → still animate the sphere with a synthetic envelope
    // sized to the text length so it feels alive.
    if (!caps.tts) {
      const dur = Math.min(8000, Math.max(1200, text.length * 35));
      setSpeaking(true);
      reactor.simulate(dur);
      window.setTimeout(() => setSpeaking(false), dur);
      return;
    }
    const el = audioRef.current;
    if (!el) return;
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        // Fallback: still animate the orb so the response feels acknowledged.
        const dur = Math.min(8000, Math.max(1200, text.length * 35));
        setSpeaking(true);
        reactor.simulate(dur);
        window.setTimeout(() => setSpeaking(false), dur);
        setError(err.error || `TTS failed (${res.status}) — running in silent mode.`);
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      if (!attachedRef.current) {
        attachedRef.current = reactor.attachElement(el);
      }
      el.src = url;
      setSpeaking(true);
      try {
        await el.play();
      } catch {
        // Autoplay blocked or playback failed: fall back to simulated animation.
        const dur = Math.min(8000, Math.max(1200, text.length * 35));
        reactor.simulate(dur);
        window.setTimeout(() => setSpeaking(false), dur);
        return;
      }
      el.onended = () => {
        setSpeaking(false);
        URL.revokeObjectURL(url);
      };
      el.onerror = () => {
        setSpeaking(false);
        URL.revokeObjectURL(url);
      };
    } catch {
      setSpeaking(false);
      setError("TTS request failed — continuing in silent mode.");
    }
  }

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm uppercase tracking-wider text-white/50">
          Conversation
        </h2>
        {history.length > 0 ? (
          <button
            onClick={resetHistory}
            className="text-xs text-white/50 hover:text-white"
          >
            Reset
          </button>
        ) : null}
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto rounded-md border border-border bg-panel p-3">
        {history.length === 0 ? (
          <p className="text-sm text-white/40">
            {caps.hasAnyModel
              ? "Type or hold the mic button to start talking with the model."
              : "Configure an API key in .env.local to start chatting."}
          </p>
        ) : null}
        {history.map((m, i) => (
          <div
            key={i}
            className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
              m.role === "user"
                ? "ml-auto bg-accent/20 text-white"
                : "mr-auto bg-white/5 text-white/90"
            }`}
          >
            {m.content}
          </div>
        ))}
        {thinking ? (
          <div className="mr-auto rounded-lg bg-white/5 px-3 py-2 text-sm text-white/60">
            Thinking...
          </div>
        ) : null}
      </div>

      {error ? (
        <p className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-300">
          {error}
        </p>
      ) : null}

      <div className="flex items-center gap-2">
        <MicButton
          disabled={thinking || !caps.stt || !caps.hasAnyModel}
          available={caps.stt}
          onTranscribed={(t) => send(t)}
        />
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(input);
            }
          }}
          placeholder={
            caps.hasAnyModel ? "Type a message..." : "Add an API key to chat"
          }
          disabled={!caps.hasAnyModel}
          className="flex-1 rounded-md border border-border bg-panel px-3 py-2 text-sm focus:border-accent focus:outline-none disabled:opacity-50"
        />
        <button
          onClick={() => send(input)}
          disabled={thinking || !input.trim() || !caps.hasAnyModel}
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/80 disabled:opacity-40"
        >
          Send
        </button>
      </div>

      <audio ref={audioRef} hidden />
    </div>
  );
}
