export function Navbar() {
  return (
    <nav className="sticky top-0 z-20 border-b border-[var(--border)] bg-[var(--surface)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 lg:px-6">
        <div className="text-2xl font-semibold tracking-tight text-[var(--text)]">
          TechPulse
        </div>
        <div className="hidden gap-6 text-sm text-[var(--muted)] md:flex">
          <a href="/events" className="transition hover:text-[var(--text)]">
            Events
          </a>
          <a href="/explore" className="transition hover:text-[var(--text)]">
            Explore
          </a>
          <a href="/saved" className="transition hover:text-[var(--text)]">
            Saved
          </a>
        </div>
        <a
          href="/login"
          className="rounded-full border border-[var(--border)] px-4 py-1.5 text-sm text-[var(--text)] transition hover:bg-[var(--surface-2)]"
        >
          Sign In
        </a>
      </div>
    </nav>
  );
}
