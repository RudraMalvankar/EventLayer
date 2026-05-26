import { useState } from 'react'

export function SearchBar({ onSearch, loading }) {
  const [value, setValue] = useState('')
  const run = () => onSearch?.(value)
  return (
    <div className="flex w-full items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-950/70 p-2 shadow-[0_12px_40px_rgba(0,0,0,0.12)]">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && run()}
        placeholder='Try "Free AI hackathons in Mumbai this weekend"'
        className="accent-ring w-full rounded-xl border border-transparent bg-zinc-900 px-4 py-3 text-sm text-white placeholder:text-zinc-500"
      />
      <button onClick={run} className="rounded-xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-black transition hover:bg-cyan-300">
        {loading ? '...' : 'Search'}
      </button>
    </div>
  )
}
