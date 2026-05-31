"use client";

import { useEffect, useRef, useState } from "react";

const EXAMPLES = [
  "Free AI hackathons in Mumbai this weekend",
  "React meetups in Mumbai",
  "Online workshops this week",
];

export function AISearchBar({
  onResults,
  onLoading,
  initialQuery = "",
  compact = false,
}) {
  const [value, setValue] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState("");
  const [parser, setParser] = useState("");
  const [error, setError] = useState("");
  const ranInitial = useRef(false);

  async function runSearch(queryText) {
    const q = String(queryText || value).trim();
    if (!q) return;

    setLoading(true);
    setError("");
    onLoading?.(true);

    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
      });
      const json = await res.json();

      if (!res.ok || json?.error) {
        setError(json?.error || "Search failed");
        onResults?.([], null, "");
        return;
      }

      const events = json?.data?.events || [];
      const filters = json?.data?.filters_applied || null;
      const aiSummary = json?.data?.ai_summary || "";
      setSummary(aiSummary);
      setParser(json?.data?.parser === "gemini" ? "Gemini" : "Smart rules");
      onResults?.(events, filters, aiSummary);
    } catch {
      setError("Could not reach search API");
      onResults?.([], null, "");
    } finally {
      setLoading(false);
      onLoading?.(false);
    }
  }

  useEffect(() => {
    if (!initialQuery || ranInitial.current) return;
    ranInitial.current = true;
    runSearch(initialQuery);
  }, [initialQuery]);

  return (
    <div className={compact ? "space-y-3" : "space-y-4"}>
      <div className="group flex w-full flex-col gap-2 rounded-[24px] border border-white/10 bg-white/[0.03] p-2 transition hover:border-orange-500/30 sm:flex-row sm:items-center">
        <div className="flex flex-1 items-center gap-2 px-2">
          <span className="shrink-0 rounded-lg bg-orange-500/15 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-orange-400">
            AI
          </span>
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && runSearch()}
            placeholder="e.g. Free AI hackathons in Mumbai this weekend"
            className="w-full bg-transparent py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none"
          />
        </div>
        <button
          type="button"
          onClick={() => runSearch()}
          disabled={loading}
          className="rounded-[18px] bg-orange-500 px-8 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-white transition hover:bg-orange-600 disabled:opacity-50"
        >
          {loading ? "Thinking..." : "AI Search"}
        </button>
      </div>

      {!compact && (
        <div className="flex flex-wrap gap-2">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => {
                setValue(ex);
                runSearch(ex);
              }}
              className="rounded-full border border-white/10 px-3 py-1.5 text-[10px] text-gray-500 transition hover:border-orange-500/30 hover:text-orange-300"
            >
              {ex}
            </button>
          ))}
        </div>
      )}

      {summary && (
        <p className="text-sm text-gray-400">
          <span className="text-orange-400/80">✦ {parser}:</span> {summary}
        </p>
      )}
      {error && (
        <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}
