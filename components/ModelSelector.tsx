"use client";

import { MODELS } from "@/lib/models";
import { useApp } from "@/lib/store";

export default function ModelSelector() {
  const model = useApp((s) => s.model);
  const setModel = useApp((s) => s.setModel);
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs uppercase tracking-wider text-white/50">
        Model
      </label>
      <select
        value={model.id}
        onChange={(e) => setModel(e.target.value)}
        className="rounded-md border border-border bg-panel px-3 py-2 text-sm focus:border-accent focus:outline-none"
      >
        {MODELS.map((m) => (
          <option key={m.id} value={m.id}>
            {m.label}
          </option>
        ))}
      </select>
    </div>
  );
}
