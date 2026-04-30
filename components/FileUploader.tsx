"use client";

import { useRef, useState } from "react";
import { useApp } from "@/lib/store";

export default function FileUploader() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const setContext = useApp((s) => s.setContext);
  const clearContext = useApp((s) => s.clearContext);
  const contextLabel = useApp((s) => s.contextLabel);

  async function onFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setBusy(true);
    try {
      const fd = new FormData();
      Array.from(files).forEach((f) => fd.append("files", f));
      const res = await fetch("/api/extract", { method: "POST", body: fd });
      const data = await res.json();
      if (data.context) {
        const label = (data.files as string[]).join(", ");
        setContext(data.context, label);
      }
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs uppercase tracking-wider text-white/50">
        Reference files
      </label>
      <div className="flex items-center gap-2">
        <button
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="flex-1 rounded-md border border-border bg-panel px-3 py-2 text-sm hover:border-accent disabled:opacity-50"
        >
          {busy ? "Reading..." : "Attach files (.txt .md .pdf .json .csv)"}
        </button>
        {contextLabel ? (
          <button
            onClick={clearContext}
            className="text-xs text-white/60 hover:text-white"
          >
            Clear
          </button>
        ) : null}
      </div>
      {contextLabel ? (
        <p className="truncate text-xs text-white/50" title={contextLabel}>
          Loaded: {contextLabel}
        </p>
      ) : null}
      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".txt,.md,.pdf,.json,.csv,text/*"
        onChange={(e) => onFiles(e.target.files)}
        className="hidden"
      />
    </div>
  );
}
