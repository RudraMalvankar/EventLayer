export function Navbar() {
  return (
    <nav className="sticky top-0 z-20 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 lg:px-6">
        <div className="text-2xl font-semibold tracking-tight text-white">TechPulse</div>
        <div className="hidden gap-6 text-sm text-zinc-400 md:flex">
          <a href="/events">Events</a>
          <a href="/explore">Explore</a>
          <a href="/saved">Saved</a>
        </div>
        <a href="/login" className="rounded-full border border-zinc-700 px-4 py-1.5 text-sm text-white transition hover:border-zinc-500 hover:bg-zinc-900">
          Sign In
        </a>
      </div>
    </nav>
  )
}
