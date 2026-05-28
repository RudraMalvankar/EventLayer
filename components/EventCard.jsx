"use client";

import Image from "next/image";
import Link from "next/link";

export function EventCard({ event, onSave, isSaved }) {
  const detailsHref = event?.id ? `/events/${event.id}` : null;
  const start = event?.start_date ? new Date(event.start_date) : null;
  const displayPlatform = String(
    event?.raw_data?.sourcePlatform ||
      event?.raw_data?.originalPlatform ||
      event?.platform ||
      "scraper",
  ).toLowerCase();

  const formatDate = (date) => {
    if (!date) return "TBA";
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

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
          {event?.description || "Join us for this exclusive event."}
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
