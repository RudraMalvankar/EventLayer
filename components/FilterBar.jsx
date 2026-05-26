const categories = ['All', 'Hackathon', 'Meetup', 'Workshop', 'Conference']
const modes = ['All', 'Online', 'Offline']
const prices = ['All', 'Free']

function Pill({ active, children, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-sm transition ${active ? 'bg-[var(--accent)] font-semibold text-white' : 'bg-[var(--surface-2)] text-[var(--muted)] hover:text-[var(--text)]'}`}
    >
      {children}
    </button>
  )
}

export function FilterBar({ filters, onChange }) {
  const set = (k, v) => onChange?.({ ...filters, [k]: v })
  return (
    <div className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4 shadow-[0_12px_40px_rgba(0,0,0,0.12)] backdrop-blur">
      <div>
        <div className="mb-2 text-xs uppercase tracking-[0.24em] text-zinc-500">Categories</div>
        <div className="flex gap-2 overflow-x-auto pb-1">{categories.map((c) => <Pill key={c} active={(filters.category || 'All') === c} onClick={() => set('category', c)}>{c}</Pill>)}</div>
      </div>
      <div>
        <div className="mb-2 text-xs uppercase tracking-[0.24em] text-zinc-500">Mode</div>
        <div className="flex gap-2 overflow-x-auto pb-1">{modes.map((m) => <Pill key={m} active={(filters.mode || 'All') === m} onClick={() => set('mode', m)}>{m}</Pill>)}</div>
      </div>
      <div>
        <div className="mb-2 text-xs uppercase tracking-[0.24em] text-zinc-500">Pricing</div>
        <div className="flex gap-2 overflow-x-auto pb-1">{prices.map((p) => <Pill key={p} active={(filters.price || 'All') === p} onClick={() => set('price', p)}>{p === 'Free' ? 'Free Only' : p}</Pill>)}</div>
      </div>
      <input className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white placeholder:text-zinc-500" placeholder="City" value={filters.city || ''} onChange={(e) => set('city', e.target.value)} />
    </div>
  )
}
