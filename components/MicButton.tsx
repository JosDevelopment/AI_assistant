"use client";

import { useRef, useState } from "react";

type Props = {
  onTranscribed: (text: string) => void;
  disabled?: boolean;
};

export default function MicButton({ onTranscribed, disabled }: Props) {
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  async function start() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
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
        setBusy(true);
        try {
          const fd = new FormData();
          fd.append("audio", blob, "speech.webm");
          const res = await fetch("/api/stt", { method: "POST", body: fd });
          const data = await res.json();
          if (data.text) onTranscribed(data.text);
        } finally {
          setBusy(false);
        }
      };
      mr.start();
      mediaRef.current = mr;
      setRecording(true);
    } catch (err) {
      console.error(err);
    }
  }

  function stop() {
    mediaRef.current?.stop();
    mediaRef.current = null;
    setRecording(false);
  }

  return (
    <button
      onClick={recording ? stop : start}
      disabled={disabled || busy}
      className={`rounded-full px-4 py-2 text-sm transition ${
        recording
          ? "bg-red-500/30 text-red-200 hover:bg-red-500/40"
          : "bg-accent/20 text-accent hover:bg-accent/30"
      } disabled:opacity-50`}
      title={recording ? "Stop recording" : "Hold to talk"}
    >
      {busy ? "Transcribing..." : recording ? "■ Stop" : "● Talk"}
    </button>
  );
}
