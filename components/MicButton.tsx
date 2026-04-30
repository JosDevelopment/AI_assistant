"use client";

import { useRef, useState } from "react";

type Props = {
  onTranscribed: (text: string) => void;
  disabled?: boolean;
  available?: boolean;
};

export default function MicButton({ onTranscribed, disabled, available = true }: Props) {
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  async function start() {
    setHint(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setHint("Microphone not supported in this browser.");
      return;
    }
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setHint("Microphone permission denied.");
      return;
    }
    try {
      streamRef.current = stream;
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        if (blob.size === 0) return;
        setBusy(true);
        try {
          const fd = new FormData();
          fd.append("audio", blob, "speech.webm");
          const res = await fetch("/api/stt", { method: "POST", body: fd });
          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            setHint(err.error || `Transcription failed (${res.status})`);
            return;
          }
          const data = (await res.json()) as { text?: string };
          if (data.text?.trim()) onTranscribed(data.text);
          else setHint("Couldn't hear anything — try again.");
        } catch {
          setHint("Transcription request failed.");
        } finally {
          setBusy(false);
        }
      };
      mr.start();
      mediaRef.current = mr;
      setRecording(true);
    } catch {
      setHint("Couldn't start recording.");
      stream.getTracks().forEach((t) => t.stop());
    }
  }

  function stop() {
    try {
      mediaRef.current?.stop();
    } catch {}
    mediaRef.current = null;
    setRecording(false);
  }

  const title = !available
    ? "Speech-to-text not configured (set ELEVENLABS_API_KEY)"
    : recording
    ? "Stop recording"
    : "Record and transcribe";

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        onClick={recording ? stop : start}
        disabled={disabled || busy || !available}
        title={title}
        className={`rounded-full px-4 py-2 text-sm transition ${
          recording
            ? "bg-red-500/30 text-red-200 hover:bg-red-500/40"
            : "bg-accent/20 text-accent hover:bg-accent/30"
        } disabled:opacity-40`}
      >
        {!available
          ? "Mic off"
          : busy
          ? "Transcribing..."
          : recording
          ? "■ Stop"
          : "● Talk"}
      </button>
      {hint ? <span className="text-[10px] text-amber-300/80">{hint}</span> : null}
    </div>
  );
}
