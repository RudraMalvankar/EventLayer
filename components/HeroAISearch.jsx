"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function HeroAISearch() {
  const router = useRouter();
  const [value, setValue] = useState("");

  function go() {
    const q = value.trim();
    if (!q) {
      router.push("/events");
      return;
    }
    router.push(`/events?q=${encodeURIComponent(q)}`);
  }

  return (
    <div className="mb-10 max-w-xl">
      <div className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-2 sm:flex-row">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && go()}
          placeholder='Try "free hackathons in Mumbai this weekend"'
          className="flex-1 bg-transparent px-3 py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none"
        />
        <button
          type="button"
          onClick={go}
          className="rounded-xl bg-orange-500 px-6 py-3 text-[10px] font-black uppercase tracking-widest text-white hover:bg-orange-600"
        >
          AI Search →
        </button>
      </div>
    </div>
  );
}
