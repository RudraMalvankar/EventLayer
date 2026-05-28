"use client";

import Image from "next/image";
import Link from "next/link";

export function EventCard({ event, onSave, isSaved, variant = "list" }) {
  const detailsHref = event?.id ? `/events/${event.id}` : null;
  const start = event?.start_date ? new Date(event.start_date) : null;
  const end = event?.end_date ? new Date(event.end_date) : null;
  const locationDisplay =
    [event?.city, event?.country].filter(Boolean).join(", ") || "Online";

  const formatDate = (date, includeTime = false) => {
    if (!date) return "";
    return date.toLocaleDateString(
      "en-US",
      includeTime
        ? { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }
        : { month: "short", day: "numeric" },
    );
  };

  const dateDisplay =
    start && end
      ? `${formatDate(start)}${start.toDateString() !== end.toDateString() ? ` — ${formatDate(end)}` : ""}`
      : start
        ? formatDate(start)
        : event?.raw_date || "TBA";

  const timeDisplay = start ? formatDate(start, true) : "Time TBA";
  const platformColor =
    event?.platform === "luma"
      ? "bg-violet-600"
      : event?.platform === "devfolio"
        ? "bg-blue-600"
        : event?.platform === "eventbrite"
          ? "bg-orange-600"
          : "bg-amber-600";
  const modeColor =
    event?.mode === "online" ? "bg-emerald-600" : "bg-slate-600";

  if (variant === "list") {
    return (
      <article className="group overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition duration-200 hover:-translate-y-0.5 hover:border-[var(--accent)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)]">
        <div className="flex flex-col gap-0 md:flex-row">
          <div className="relative h-52 w-full shrink-0 overflow-hidden bg-[var(--surface-2)] md:h-auto md:w-[240px] lg:w-[280px]">
            {detailsHref ? (
              <Link
                href={detailsHref}
                className="absolute inset-0 z-10"
                aria-label="View event details"
              />
            ) : null}
            {event?.banner_url ? (
              <Image
                src={event.banner_url}
                alt={event.title}
                fill
                className="object-cover transition duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-[#ECE9DF] via-[#F5F4F0] to-[#E1DDCF] flex items-center justify-center">
                <span className="text-4xl">🗓️</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white ${platformColor}`}
              >
                {event?.platform}
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white/90 ${modeColor}`}
              >
                {event?.mode}
              </span>
            </div>
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-3 p-5 md:p-6">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-[var(--muted)]">
                <span className="flex items-center gap-1">
                  <span className="text-sm">📅</span> {dateDisplay}
                </span>
                <span className="h-1 w-1 rounded-full bg-[var(--border)]" />
                <span className="flex items-center gap-1">
                  <span className="text-sm">📍</span> {event?.city || "Online"}
                </span>
              </div>
              <h3 className="text-lg font-bold leading-tight text-[var(--text)] line-clamp-2">
                {detailsHref ? (
                  <Link
                    href={detailsHref}
                    className="transition hover:text-[var(--accent)]"
                  >
                    {event?.title}
                  </Link>
                ) : (
                  event?.title
                )}
              </h3>
              <p className="text-sm font-medium text-[var(--muted)]">
                {event?.organizer || "Unknown organizer"}
              </p>
            </div>

            <p className="text-sm leading-relaxed text-[var(--muted)] line-clamp-2 opacity-80">
              {event?.description || "No description available."}
            </p>

            <div className="mt-auto flex flex-col gap-4 pt-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap gap-1.5">
                {(event?.tags || []).slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-[var(--surface-2)] px-2 py-0.5 text-[11px] font-medium text-[var(--accent)] border border-[var(--border)]"
                  >
                    #{tag}
                  </span>
                ))}
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-100 uppercase tracking-tight">
                  {event?.is_free ? "Free" : "Paid"}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onSave?.(event)}
                  className="flex h-9 items-center justify-center rounded-full border border-[var(--border)] bg-white px-4 text-sm font-semibold text-[var(--text)] transition hover:bg-[var(--surface-2)] active:scale-95"
                >
                  {isSaved ? "Saved" : "Save"}
                </button>
                <a
                  href={event?.event_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-9 items-center justify-center rounded-full bg-[var(--accent)] px-5 text-sm font-bold text-white shadow-lg shadow-orange-500/20 transition hover:bg-[var(--accent-h)] hover:shadow-orange-500/40 active:scale-95"
                >
                  Register
                </a>
              </div>
            </div>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="group h-full flex flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(0,0,0,0.12)] hover:border-[var(--accent)]">
      <div className="relative h-48 w-full overflow-hidden bg-[var(--surface-2)]">
        {detailsHref ? (
          <Link
            href={detailsHref}
            className="absolute inset-0 z-10"
            aria-label="View event details"
          />
        ) : null}
        {event?.banner_url ? (
          <Image
            src={event.banner_url}
            alt={event.title}
            fill
            className="object-cover transition duration-500 group-hover:scale-110"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-[#ECE9DF] to-[#F5F4F0] flex items-center justify-center">
            <span className="text-4xl opacity-50 group-hover:scale-110 transition duration-500">🗓️</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm ${platformColor}`}
          >
            {event?.platform}
          </span>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white/90 shadow-sm ${modeColor}`}
          >
            {event?.mode}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-3 flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">
          <span>{dateDisplay}</span>
          <span className="h-1 w-1 rounded-full bg-[var(--border)]" />
          <span className="text-[var(--accent)]">{event?.is_free ? "Free" : "Paid"}</span>
        </div>

        <div className="mb-3 space-y-1">
          <h3 className="text-base font-bold leading-snug text-[var(--text)] line-clamp-2 transition group-hover:text-[var(--accent)]">
            {detailsHref ? (
              <Link href={detailsHref}>{event?.title}</Link>
            ) : (
              event?.title
            )}
          </h3>
          <p className="text-xs font-medium text-[var(--muted)] truncate">
            {event?.organizer || "Unknown"} · {locationDisplay}
          </p>
        </div>

        <p className="mb-4 text-xs leading-relaxed text-[var(--muted)] line-clamp-2 opacity-80">
          {event?.description || "No description available."}
        </p>

        <div className="mt-auto space-y-4">
          <div className="flex flex-wrap gap-1.5">
            {(event?.tags || []).slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-[var(--surface-2)] px-2 py-0.5 text-[10px] font-semibold text-[var(--accent)] border border-[var(--border)]"
              >
                #{tag}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onSave?.(event)}
              className="flex-1 flex h-9 items-center justify-center rounded-full border border-[var(--border)] bg-white text-[11px] font-bold uppercase tracking-wider text-[var(--text)] transition hover:bg-[var(--surface-2)] active:scale-95"
            >
              {isSaved ? "Saved" : "Save"}
            </button>
            <a
              href={event?.event_url}
              target="_blank"
              rel="noreferrer"
              className="flex-1 flex h-9 items-center justify-center rounded-full bg-[var(--accent)] text-[11px] font-bold uppercase tracking-wider text-white shadow-lg shadow-orange-500/20 transition hover:bg-[var(--accent-h)] hover:shadow-orange-500/40 active:scale-95"
            >
              Register
            </a>
          </div>
        </div>
      </div>
    </article>
  );
}
