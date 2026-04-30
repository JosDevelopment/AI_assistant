"use client";

import { useEffect, useState } from "react";

export type Capabilities = {
  providers: { anthropic: boolean; openai: boolean; google: boolean };
  tts: boolean;
  stt: boolean;
  db: boolean;
  availableModels: { id: string; label: string; provider: string }[];
  hasAnyModel: boolean;
};

const FALLBACK: Capabilities = {
  providers: { anthropic: false, openai: false, google: false },
  tts: false,
  stt: false,
  db: false,
  availableModels: [],
  hasAnyModel: false,
};

export function useCapabilities(): {
  caps: Capabilities;
  loading: boolean;
  error: string | null;
} {
  const [caps, setCaps] = useState<Capabilities>(FALLBACK);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/config");
        if (!res.ok) throw new Error(`status ${res.status}`);
        const data = (await res.json()) as Capabilities;
        if (!cancelled) setCaps(data);
      } catch (err) {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "Could not load config");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { caps, loading, error };
}
