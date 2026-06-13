"use client";

import Link from "next/link";

export default function Error({ error, reset }) {
  return (
    <main className="min-h-screen bg-[#030407] text-white flex items-center justify-center">
      <div className="max-w-lg mx-auto px-6 text-center">
        <div className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-500 mb-8">
          Error 500
        </div>
        <h1 className="text-7xl font-black tracking-tighter mb-6">
          Something went
          <br />
          <span className="text-orange-500">wrong</span>
        </h1>
        <p className="text-gray-500 leading-relaxed mb-10 max-w-sm mx-auto">
          An unexpected error occurred. It's not you, it's us. Try
          again or head back home.
        </p>
        <div className="flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => reset()}
            className="rounded-full bg-orange-500 px-8 py-4 text-xs font-black uppercase tracking-[0.2em] text-white transition-all hover:bg-orange-600 hover:-translate-y-1 active:scale-95"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="rounded-full border border-white/10 bg-white/5 px-8 py-4 text-xs font-black uppercase tracking-[0.2em] text-white transition-all hover:bg-white/10 active:scale-95"
          >
            Go Home
          </Link>
        </div>
        {process.env.NODE_ENV === "development" && error && (
          <pre className="mt-10 max-w-full overflow-auto rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-left text-xs text-red-300">
            {error.message}
            {error.stack && `\n\n${error.stack}`}
          </pre>
        )}
      </div>
    </main>
  );
}