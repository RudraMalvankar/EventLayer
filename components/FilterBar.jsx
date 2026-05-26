const categories = ["All", "Hackathon", "Meetup", "Workshop", "Conference"];
const modes = ["All", "Online", "Offline"];
const prices = ["All", "Free"];

function Pill({ active, children, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-sm transition ${active ? "bg-[var(--accent)] font-semibold text-white" : "bg-[var(--surface-2)] text-[var(--muted)] hover:text-[var(--text)]"}`}
    >
      {children}
    </button>
  );
}

export function FilterBar({ filters, onChange }) {
  const set = (k, v) => onChange?.({ ...filters, [k]: v });
  return (
    <div className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[0_12px_32px_rgba(24,24,20,0.08)]">
      <div>
        <div className="mb-2 text-xs uppercase tracking-[0.24em] text-[var(--muted)]">
          Categories
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {categories.map((c) => (
            <Pill
              key={c}
              active={(filters.category || "All") === c}
              onClick={() => set("category", c)}
            >
              {c}
            </Pill>
          ))}
        </div>
      </div>
      <div>
        <div className="mb-2 text-xs uppercase tracking-[0.24em] text-[var(--muted)]">
          Mode
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {modes.map((m) => (
            <Pill
              key={m}
              active={(filters.mode || "All") === m}
              onClick={() => set("mode", m)}
            >
              {m}
            </Pill>
          ))}
        </div>
      </div>
      <div>
        <div className="mb-2 text-xs uppercase tracking-[0.24em] text-[var(--muted)]">
          Pricing
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {prices.map((p) => (
            <Pill
              key={p}
              active={(filters.price || "All") === p}
              onClick={() => set("price", p)}
            >
              {p === "Free" ? "Free Only" : p}
            </Pill>
          ))}
        </div>
      </div>
      <input
        className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--muted)]"
        placeholder="City"
        value={filters.city || ""}
        onChange={(e) => set("city", e.target.value)}
      />
    </div>
  );
}
