"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/lib/store";
import type { PromptRow } from "@/lib/db";

export default function PromptPicker() {
  const [prompts, setPrompts] = useState<PromptRow[]>([]);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const setSystemPrompt = useApp((s) => s.setSystemPrompt);
  const systemPrompt = useApp((s) => s.systemPrompt);

  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      const res = await fetch("/api/prompts");
      const data = await res.json().catch(() => ({}));
      setConfigured(Boolean(data.configured));
      setPrompts(data.prompts || []);
      if (data.error) setError(data.error);
    } catch {
      setConfigured(false);
      setPrompts([]);
      setError("Could not load prompts — running in file-upload mode.");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function savePrompt() {
    if (!title.trim() || !content.trim()) return;
    setError(null);
    try {
      const res = await fetch("/api/prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content }),
      });
      if (res.ok) {
        setTitle("");
        setContent("");
        setCreating(false);
        load();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Could not save prompt.");
      }
    } catch {
      setError("Could not save prompt.");
    }
  }

  async function deletePrompt(id: string) {
    try {
      await fetch(`/api/prompts?id=${id}`, { method: "DELETE" });
      load();
    } catch {
      setError("Could not delete prompt.");
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="text-xs uppercase tracking-wider text-white/50">
          Prompt base
        </label>
        {configured ? (
          <button
            onClick={() => setCreating((v) => !v)}
            className="text-xs text-accent hover:underline"
          >
            {creating ? "Cancel" : "+ New"}
          </button>
        ) : null}
      </div>

      {configured === false ? (
        <p className="rounded-md border border-border bg-panel px-3 py-2 text-xs text-white/60">
          No database connected. The system prompt below is editable manually,
          and you can attach files for the assistant to read.
        </p>
      ) : null}

      {error ? (
        <p className="rounded-md border border-amber-400/30 bg-amber-400/10 px-2 py-1 text-xs text-amber-200">
          {error}
        </p>
      ) : null}

      {configured && prompts.length > 0 ? (
        <ul className="max-h-40 space-y-1 overflow-y-auto rounded-md border border-border bg-panel p-2">
          {prompts.map((p) => (
            <li
              key={p.id}
              className="group flex items-center justify-between gap-2 rounded px-2 py-1 text-sm hover:bg-white/5"
            >
              <button
                onClick={() => setSystemPrompt(p.content)}
                className="truncate text-left flex-1"
                title={p.content}
              >
                {p.title}
              </button>
              <button
                onClick={() => deletePrompt(p.id)}
                className="opacity-0 group-hover:opacity-100 text-xs text-red-400 hover:text-red-300"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {creating ? (
        <div className="space-y-2 rounded-md border border-border bg-panel p-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            className="w-full rounded bg-bg px-2 py-1 text-sm focus:outline-none"
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="System prompt content..."
            rows={4}
            className="w-full rounded bg-bg px-2 py-1 text-sm focus:outline-none"
          />
          <button
            onClick={savePrompt}
            className="w-full rounded bg-accent/20 py-1 text-sm text-accent hover:bg-accent/30"
          >
            Save
          </button>
        </div>
      ) : null}

      <textarea
        value={systemPrompt}
        onChange={(e) => setSystemPrompt(e.target.value)}
        rows={5}
        className="rounded-md border border-border bg-panel px-3 py-2 text-sm focus:border-accent focus:outline-none"
        placeholder="System prompt..."
      />
    </div>
  );
}
