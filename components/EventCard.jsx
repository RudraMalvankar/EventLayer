"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

function resolveStartDate(event) {
  const value = event?.starts_at || event?.start_date || null;
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function resolveEndDate(event) {
  const value = event?.ends_at || event?.end_date || null;
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function getCountdownLabel(startDate, endDate, nowMs) {
  if (!startDate) return "TBA";

  const startMs = startDate.getTime();
  const endMs = endDate?.getTime() || startMs + 2 * 60 * 60 * 1000;

  if (nowMs >= endMs) return "Ended";
  if (nowMs >= startMs && nowMs < endMs) return "Live now";

  const diff = startMs - nowMs;
  const totalMinutes = Math.floor(diff / (60 * 1000));
  const days = Math.floor(totalMinutes / (24 * 60));
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) {
    return `Starts in ${days} day${days > 1 ? "s" : ""} ${hours} hour${hours !== 1 ? "s" : ""}`;
  }
  if (hours > 0) {
    return `Starts in ${hours} hour${hours > 1 ? "s" : ""}`;
  }
  return `Starts in ${Math.max(minutes, 0)} minute${minutes === 1 ? "" : "s"}`;
}

export function EventCard({ event, onSave, isSaved }) {
  const detailsHref = event?.id ? `/events/${event.id}` : null;
  const start = resolveStartDate(event);
  const end = resolveEndDate(event);
  const displayPlatform = String(
    event?.raw_data?.sourcePlatform ||
      event?.raw_data?.originalPlatform ||
      event?.platform ||
      "scraper",
  ).toLowerCase();
  const [nowMs, setNowMs] = useState(Date.now());
  const [shareMessage, setShareMessage] = useState("");

  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 60000);
    return () => clearInterval(id);
  }, []);

  const countdownLabel = useMemo(
    () => getCountdownLabel(start, end, nowMs),
    [start, end, nowMs],
  );

  const summary =
    event?.ai_summary ||
    // TODO: Populate ai_summary during ingestion/scraping using server-side AI.
    event?.description ||
    "Join this curated tech event on EventLayer.";

  const formatDate = (date) => {
    if (!date) return "TBA";
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  async function handleShare(eventData) {
    const shareUrl =
      (eventData?.id && typeof window !== "undefined"
        ? `${window.location.origin}/events/${eventData.id}`
        : eventData?.event_url) || "";

    const title = eventData?.title || "Event";
    const city = eventData?.city || "your city";
    const text =
      city && city.toLowerCase() !== "online"
        ? `Found this on EventLayer.dev - ${title} in ${city} this weekend` 
        : `Found this on EventLayer.dev - ${title}`;

    try {
      if (navigator.share) {
        await navigator.share({ title, text, url: shareUrl });
        setShareMessage("Shared");
      } else {
        await navigator.clipboard.writeText(shareUrl);
        setShareMessage("Link copied");
      }
    } catch {
      setShareMessage("Could not share");
    } finally {
      setTimeout(() => setShareMessage(""), 1500);
    }
  }

  const platformEmoji =
    displayPlatform === "luma"
      ? "✨"
      : displayPlatform === "meetup"
        ? "🤝"
        : displayPlatform === "devfolio"
          ? "⚡"
          : displayPlatform === "unstop"
            ? "🚀"
            : "📅";

  const platformColor =
    displayPlatform === "luma"
      ? "text-purple-400"
      : displayPlatform === "meetup"
        ? "text-red-400"
        : displayPlatform === "devfolio"
          ? "text-blue-400"
          : displayPlatform === "unstop"
            ? "text-yellow-400"
            : "text-orange-400";

  return (
    <article className="group flex flex-col bg-[#0a0c12] rounded-[32px] overflow-hidden border border-white/5 hover:border-white/10 transition-all duration-500 hover:shadow-[0_20px_80px_rgba(0,0,0,0.4)] relative">
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#121620]">
        {detailsHref ? (
          <Link href={detailsHref} className="absolute inset-0 z-10" />
        ) : (
          <a
            href={event?.event_url}
            target="_blank"
            rel="noreferrer"
            className="absolute inset-0 z-10"
          />
        )}

        {event?.banner_url ? (
          <Image
            src={event.banner_url}
            alt={event.title}
            fill
            className="object-cover transition duration-1000 group-hover:scale-110 opacity-80 group-hover:opacity-100"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-[#121620] to-[#0a0c12] flex items-center justify-center">
            <span className="text-5xl opacity-10 group-hover:scale-110 transition duration-700">
              {platformEmoji}
            </span>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0c12] via-transparent to-transparent opacity-60" />

        <div className="absolute top-5 right-5 z-20">
          <div className="flex flex-col gap-2">
            <button
              onClick={(e) => {
                e.preventDefault();
                onSave?.(event);
              }}
              className={`w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-xl transition-all duration-300 ${
                isSaved
                  ? "bg-orange-500 text-white"
                  : "bg-black/20 text-white/70 hover:bg-black/40 hover:text-white border border-white/10"
              }`}
              aria-label="Save event"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill={isSaved ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
              </svg>
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                handleShare(event);
              }}
              className="w-10 h-10 rounded-full flex items-center justify-center bg-black/20 text-white/70 hover:bg-black/40 hover:text-white border border-white/10 backdrop-blur-xl transition-all duration-300"
              aria-label="Share event"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
            </button>
          </div>
        </div>

        <div className="absolute bottom-5 left-5 z-20 flex items-center gap-2">
          <span
            className={`text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 ${platformColor}`}
          >
            {displayPlatform}
          </span>
        </div>
      </div>

      <div className="p-7 flex flex-col flex-1">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-[10px] font-bold text-orange-500 uppercase tracking-[0.2em]">
            {start ? formatDate(start) : ""}
          </span>
          <span className="w-1 h-1 rounded-full bg-white/10" />
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] line-clamp-1">
            {event?.city || "Online"}
          </span>
        </div>
        <div className="mb-4">
          <span
            className={`text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full ${
              countdownLabel === "Live now"
                ? "text-emerald-300 bg-emerald-500/15"
                : countdownLabel === "Ended"
                  ? "text-gray-400 bg-white/5"
                  : "text-orange-300 bg-orange-500/10"
            }`}
          >
            {countdownLabel}
          </span>
          {shareMessage && (
            <span className="ml-2 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-300">
              {shareMessage}
            </span>
          )}
        </div>

        <h3 className="text-xl font-bold text-white mb-3 leading-tight group-hover:text-orange-400 transition-colors duration-300 line-clamp-2">
          {detailsHref ? (
            <Link href={detailsHref}>{event?.title}</Link>
          ) : (
            <a href={event?.event_url} target="_blank" rel="noreferrer">
              {event?.title}
            </a>
          )}
        </h3>

        <p className="text-sm text-gray-400 line-clamp-2 mb-8 flex-1 leading-relaxed">
          {summary}
        </p>

        <div className="flex items-center justify-between pt-6 border-t border-white/5">
          <div className="flex -space-x-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="w-6 h-6 rounded-full border-2 border-[#0a0c12] bg-[#121620] overflow-hidden"
              >
                <div className="w-full h-full bg-gradient-to-br from-orange-500/20 to-transparent" />
              </div>
            ))}
            <div className="pl-4 text-[10px] font-bold text-gray-500 flex items-center uppercase tracking-widest">
              +12 joined
            </div>
          </div>
          <span
            className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-[0.2em] ${
              event?.is_free
                ? "text-emerald-400 bg-emerald-400/10"
                : "text-blue-400 bg-blue-400/10"
            }`}
          >
            {event?.is_free ? "Free" : "Paid"}
          </span>
        </div>
      </div>
    </article>
  );
}
