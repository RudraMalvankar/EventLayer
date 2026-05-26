'use client'

import { Navbar } from '../components/Navbar'

function FloatingCards() {
  return (
    <div className="relative h-[420px]">
      <div className="absolute inset-0 rounded-2xl opacity-40 [background-image:radial-gradient(circle,#2b3345_1px,transparent_1px)] [background-size:24px_24px]" />

      <div className="surface-card absolute left-6 top-6 w-[240px] rotate-[-4deg] overflow-hidden rounded-2xl shadow-lg">
        <div className="h-24 bg-gradient-to-br from-violet-700 to-indigo-600 p-3">
          <span className="rounded-full bg-white/15 px-2 py-1 text-[10px] font-semibold tracking-wider text-white">LUMA</span>
        </div>
        <div className="p-3">
          <div className="text-xs font-semibold">Builder Hack Night</div>
          <div className="mt-1 text-[11px] text-[var(--muted)]">Jun 14 · Online</div>
          <div className="mt-3 flex items-center justify-between">
            <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">Free</span>
            <span className="rounded-full bg-[var(--accent)] px-2 py-0.5 text-[10px] font-semibold text-white">Register</span>
          </div>
        </div>
      </div>

      <div className="surface-card absolute left-44 top-16 w-[240px] rotate-[1deg] overflow-hidden rounded-2xl shadow-lg">
        <div className="h-24 bg-gradient-to-br from-sky-600 to-cyan-700 p-3">
          <span className="rounded-full bg-white/15 px-2 py-1 text-[10px] font-semibold tracking-wider text-white">EVENTS</span>
        </div>
        <div className="p-3">
          <div className="text-xs font-semibold">Mumbai AI Meetup</div>
          <div className="mt-1 text-[11px] text-[var(--muted)]">Jun 20 · Mumbai</div>
          <div className="mt-3 flex items-center justify-between">
            <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">Free</span>
            <span className="rounded-full bg-[var(--accent)] px-2 py-0.5 text-[10px] font-semibold text-white">Register</span>
          </div>
        </div>
      </div>

      <div className="surface-card absolute left-24 top-56 w-[240px] rotate-[5deg] overflow-hidden rounded-2xl shadow-lg">
        <div className="h-24 bg-gradient-to-br from-amber-500 to-rose-600 p-3">
          <span className="rounded-full bg-white/15 px-2 py-1 text-[10px] font-semibold tracking-wider text-white">TRACK</span>
        </div>
        <div className="p-3">
          <div className="text-xs font-semibold">Workshop Weekend</div>
          <div className="mt-1 text-[11px] text-[var(--muted)]">Jun 28 · Hybrid</div>
          <div className="mt-3 flex items-center justify-between">
            <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">Free</span>
            <span className="rounded-full bg-[var(--accent)] px-2 py-0.5 text-[10px] font-semibold text-white">Register</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LandingPage() {
  return (
    <main className="min-h-screen">
      <Navbar />

      <section className="mx-auto grid w-full max-w-6xl gap-12 px-4 pb-14 pt-14 lg:grid-cols-2 lg:items-center">
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-orange-500/35 bg-[var(--accent-soft)] px-4 py-1.5 text-xs font-semibold text-orange-300">
            Now aggregating Luma first
          </div>
          <h1 className="serif mb-5 text-5xl leading-tight text-[var(--text)] md:text-6xl">
            Every tech event.
            <br />
            <span className="text-[var(--accent)]">One place.</span>
          </h1>
          <p className="mb-8 max-w-xl text-lg text-[var(--muted)]">
            Discover hackathons, meetups, and workshops across India. Search with natural language and jump straight to registration.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <a
              href="/events"
              className="rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--accent-h)]"
            >
              Explore Events →
            </a>
            <a
              href="/events"
              className="rounded-full border border-[var(--border)] bg-transparent px-6 py-3 text-sm text-[var(--text)] transition hover:bg-[var(--surface-2)]"
            >
              See how it works
            </a>
          </div>

          <div className="mt-7 text-sm text-[var(--muted)]">
            One feed · Luma-first ingestion · AI search powered by Gemini
          </div>
        </div>

        <div className="surface-card relative overflow-hidden rounded-2xl p-6">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(255,107,44,.22),transparent_55%)]" />
          <div className="relative">
            <FloatingCards />
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-16">
        <div className="mb-3 text-xs font-semibold tracking-[0.18em] text-[var(--accent)]">FEATURES</div>
        <h2 className="serif mb-8 text-4xl text-[var(--text)]">Everything you need to never miss an event.</h2>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="surface-card rounded-2xl p-6">
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-lg">🔎</div>
            <div className="text-sm font-semibold">AI Natural Search</div>
            <div className="mt-2 text-sm text-[var(--muted)]">“Free AI hackathons in Mumbai this weekend” works end-to-end.</div>
          </div>
          <div className="surface-card rounded-2xl p-6">
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-lg">⚡</div>
            <div className="text-sm font-semibold">Luma-First Aggregation</div>
            <div className="mt-2 text-sm text-[var(--muted)]">Scrape Luma reliably and keep the schema clean for your feed.</div>
          </div>
          <div className="surface-card rounded-2xl p-6">
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-lg">🎯</div>
            <div className="text-sm font-semibold">One-Click Register</div>
            <div className="mt-2 text-sm text-[var(--muted)]">Open the source platform and register instantly.</div>
          </div>
        </div>
      </section>
    </main>
  )
}

