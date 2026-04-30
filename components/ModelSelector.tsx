"use client";

import { MODELS } from "@/lib/models";
import { useApp } from "@/lib/store";
import type { Capabilities } from "@/lib/capabilities";

export default function ModelSelector({ caps }: { caps: Capabilities }) {
  const model = useApp((s) => s.model);
  const setModel = useApp((s) => s.setModel);

  const available = caps.availableModels;
  const noneConfigured = available.length === 0;

  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs uppercase tracking-wider text-white/50">
        Model
      </label>
      <select
        value={model.id}
        onChange={(e) => setModel(e.target.value)}
        disabled={noneConfigured}
        className="rounded-md border border-border bg-panel px-3 py-2 text-sm focus:border-accent focus:outline-none disabled:opacity-50"
      >
        {noneConfigured ? (
          <option>No providers configured</option>
        ) : (
          MODELS.map((m) => {
            const enabled = available.some((x) => x.id === m.id);
            return (
              <option key={m.id} value={m.id} disabled={!enabled}>
                {m.label}
                {enabled ? "" : " — no API key"}
              </option>
            );
          })
        )}
      </select>
      {noneConfigured ? (
        <p className="text-xs text-amber-300/80">
          Add at least one of <code>ANTHROPIC_API_KEY</code>,{" "}
          <code>OPENAI_API_KEY</code> or <code>GOOGLE_API_KEY</code> to{" "}
          <code>.env.local</code>.
        </p>
      ) : null}
    </div>
  );
}
