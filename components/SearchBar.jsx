import { useState } from "react";

export function SearchBar({ onSearch, loading }) {
  const [value, setValue] = useState("");
  const run = () => onSearch?.(value);
  return (
    <div className="flex w-full items-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-2 shadow-[0_12px_32px_rgba(24,24,20,0.08)]">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && run()}
        placeholder='Try "Free AI hackathons in Mumbai this weekend"'
        className="accent-ring w-full rounded-xl border border-transparent bg-[var(--surface-2)] px-4 py-3 text-sm text-[var(--text)] placeholder:text-[var(--muted)]"
      />
      <button
        onClick={run}
        className="rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--accent-h)]"
      >
        {loading ? "..." : "Search"}
      </button>
    </div>
  );
}
