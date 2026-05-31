"use client";

import Link from "next/link";
import { useState } from "react";
import { CommunityFollowButton } from "./CommunityFollowButton";

const ACCENTS = {
  echai: "from-violet-600 via-purple-600 to-fuchsia-700",
  "gdg-cloud-mumbai": "from-sky-500 via-blue-600 to-indigo-700",
  "gdg-mumbai": "from-blue-500 via-cyan-500 to-teal-600",
  "mumbai-js": "from-yellow-400 via-amber-500 to-orange-600",
  default: "from-orange-500 via-rose-500 to-purple-700",
};

function CommunityLogo({ community, className = "" }) {
  const [failed, setFailed] = useState(false);
  const logoUrl = community?.logo_url;
  const initials = (community?.name || "C")
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  if (!logoUrl || failed) {
    return (
      <div
        className={`flex items-center justify-center rounded-2xl bg-white/15 text-lg font-black text-white backdrop-blur-md ${className}`}
      >
        {initials}
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-center overflow-hidden rounded-2xl border border-white/25 bg-white p-2 shadow-lg ${className}`}
    >
      <img
        src={logoUrl}
        alt=""
        className="h-full w-full object-contain"
        onError={() => setFailed(true)}
      />
    </div>
  );
}

export function CommunityCard({ community, detail = false }) {
  const slug = community?.slug || "";
  const accent = ACCENTS[slug] || ACCENTS.default;
  const count = community?.upcoming_count ?? 0;

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-[32px] border border-white/10 bg-[#141824] transition-all duration-500 hover:-translate-y-1 hover:border-orange-500/35 hover:shadow-[0_24px_80px_rgba(255,107,0,0.14)]">
      <div className={`relative aspect-[16/9] bg-gradient-to-br ${accent}`}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.22),transparent_55%)]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#141824] via-[#141824]/25 to-transparent" />

        <CommunityLogo
          community={community}
          className="absolute left-5 top-5 h-16 w-16"
        />

        <div className="absolute right-5 top-5 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white backdrop-blur-md">
          {community?.city || "Mumbai"}
        </div>

        <div className="absolute bottom-4 left-5 flex flex-wrap gap-2">
          {(community?.tags || []).slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-white/20 bg-black/20 px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-white/90 backdrop-blur-md"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="relative flex flex-1 flex-col bg-gradient-to-b from-[#181c28] to-[#12151e] px-6 pb-6 pt-5">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        <h3 className="text-xl font-black tracking-tight text-white transition-colors group-hover:text-orange-300">
          {community?.name}
        </h3>
        <p className="mt-2 line-clamp-2 flex-1 text-sm leading-relaxed text-gray-400">
          {community?.description}
        </p>

        <div className="mt-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-500">
          <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-emerald-400">
            {count} upcoming
          </span>
          <span className="text-gray-600">·</span>
          <span>Live from scrapers</span>
        </div>

        {!detail ? (
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href={`/community/${slug}`}
              className="flex-1 rounded-full bg-orange-500 py-3 text-center text-[10px] font-black uppercase tracking-[0.2em] text-white transition hover:bg-orange-600 active:scale-[0.98]"
            >
              Open community →
            </Link>
            <div className="shrink-0">
              <CommunityFollowButton slug={slug} name={community?.name} />
            </div>
          </div>
        ) : (
          <div className="mt-5">
            <CommunityFollowButton slug={slug} name={community?.name} />
          </div>
        )}
      </div>
    </article>
  );
}
