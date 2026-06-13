import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#030407] text-white flex items-center justify-center">
      <div className="max-w-lg mx-auto px-6 text-center">
        <div className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-500 mb-8">
          Error 404
        </div>
        <h1 className="text-7xl font-black tracking-tighter mb-6">
          Page not
          <br />
          <span className="text-orange-500">found</span>
        </h1>
        <p className="text-gray-500 leading-relaxed mb-10 max-w-sm mx-auto">
          The page you're looking for doesn't exist or has been
          moved. Try checking the URL or heading back.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/"
            className="rounded-full bg-orange-500 px-8 py-4 text-xs font-black uppercase tracking-[0.2em] text-white transition-all hover:bg-orange-600 hover:-translate-y-1 active:scale-95"
          >
            Go Home
          </Link>
          <Link
            href="/events"
            className="rounded-full border border-white/10 bg-white/5 px-8 py-4 text-xs font-black uppercase tracking-[0.2em] text-white transition-all hover:bg-white/10 active:scale-95"
          >
            Browse Events
          </Link>
        </div>
      </div>
    </main>
  );
}