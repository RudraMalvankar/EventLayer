"use client";

import Link from "next/link";
import { useState } from "react";
import { CommunityFollowButton } from "./CommunityFollowButton";

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
        className={`flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-sm font-black text-orange-400 ${className}`}
      >
        {initials}
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white p-1.5 ${className}`}
    >
      <img
        src={logoUrl}
        alt=""
        className="h-full w-full object-contain"
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
      />
    </div>
  );
}

export function CommunityCard({ community, detail = false }) {
  const slug = community?.slug || "";
  const count = community?.upcoming_count ?? 0;
  const eventsHref = `/community/${slug}#upcoming-events`;

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0c0e14] transition-all duration-300 hover:border-white/15 hover:shadow-[0_8px_40px_rgba(0,0,0,0.45)]">
      <div className="p-5 pb-0">
        <div className="flex items-start justify-between gap-3">
          <CommunityLogo community={community} className="h-12 w-12 shrink-0" />
          <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-gray-500">
            {community?.city || "Mumbai"}
          </span>
        </div>

        <h3 className="mt-4 text-lg font-bold tracking-tight text-white">
          {community?.name}
        </h3>
        <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-gray-500">
          {community?.description}
        </p>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {(community?.tags || []).slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="rounded-md border border-white/[0.06] bg-white/[0.03] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-gray-500"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-1 flex-col border-t border-white/[0.06] px-5 py-4">
        <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-wider text-gray-600">
          <span className="text-emerald-500/90">{count} upcoming</span>
          <span>·</span>
          <span>Live from scrapers</span>
        </div>

        {!detail ? (
          <div className="mt-4 flex flex-col gap-2">
            <Link
              href={eventsHref}
              className="flex w-full items-center justify-between rounded-lg border border-orange-500/25 bg-orange-500/[0.06] px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-orange-300 transition hover:border-orange-500/45 hover:bg-orange-500/10 hover:text-orange-200"
            >
              <span>View upcoming community events</span>
              <span>{count > 0 ? `${count} →` : "→"}</span>
            </Link>
            <div className="flex items-center gap-2">
              <Link
                href={`/community/${slug}`}
                className="inline-flex flex-1 items-center justify-center rounded-lg border border-white/10 px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-gray-400 transition hover:border-white/20 hover:text-white"
              >
                Open community
              </Link>
              <CommunityFollowButton slug={slug} name={community?.name} variant="ghost" />
            </div>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <Link
              href={eventsHref}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-orange-500/30 bg-orange-500/10 px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-orange-300 hover:bg-orange-500/15"
            >
              View upcoming events ({count}) →
            </Link>
            <CommunityFollowButton slug={slug} name={community?.name} variant="ghost" />
          </div>
        )}
      </div>
    </article>
  );
}
