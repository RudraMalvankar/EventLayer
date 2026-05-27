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
        : "TBA";

  const timeDisplay = start ? formatDate(start, true) : "Time TBA";
  const platformColor =
    event?.platform === "luma"
      ? "bg-violet-600"
      : event?.platform === "devfolio"
        ? "bg-blue-600"
        : "bg-amber-600";
  const modeColor =
    event?.mode === "online" ? "bg-emerald-600" : "bg-slate-600";

  if (variant === "list") {
    return (
      <article className="group overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-[0_16px_48px_rgba(24,24,20,0.12)] transition duration-200 hover:-translate-y-0.5 hover:border-[var(--accent)]">
        <div className="flex flex-col gap-0 md:flex-row">
          <div className="relative h-56 w-full shrink-0 overflow-hidden bg-[var(--surface-2)] md:h-auto md:w-[260px] lg:w-[300px]">
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
                className="object-contain p-3 transition duration-500 group-hover:scale-[1.01]"
              />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-[#ECE9DF] via-[#F5F4F0] to-[#E1DDCF]" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/5" />
            <div className="absolute left-4 top-4 flex gap-2">
              <span
                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white ${platformColor}`}
              >
                {event?.platform}
              </span>
              <span
                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white/90 ${modeColor}`}
              >
                {event?.mode}
              </span>
              <span className="rounded-full border border-white/20 bg-black/40 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white backdrop-blur-sm">
                {locationDisplay}
              </span>
            </div>
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-4 p-5 md:p-6">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--muted)]">
                <span>{dateDisplay}</span>
                <span className="h-1 w-1 rounded-full bg-[var(--border)]" />
                <span>{timeDisplay}</span>
                <span className="h-1 w-1 rounded-full bg-[var(--border)]" />
                <span>{event?.city || "Online"}</span>
              </div>
              <h3 className="text-xl font-semibold leading-tight text-[var(--text)] line-clamp-2">
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
              <p className="text-sm text-[var(--muted)]">
                {event?.organizer || "Unknown organizer"}
              </p>
            </div>

            <p className="max-w-3xl text-sm leading-6 text-[var(--muted)] line-clamp-3">
              {event?.description || "No description available."}
            </p>

            <div className="mt-auto flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="flex flex-wrap gap-2">
                {(event?.tags || []).slice(0, 5).map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-2.5 py-1 text-xs text-[var(--accent)]"
                  >
                    {tag}
                  </span>
                ))}
                <span className="rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-2.5 py-1 text-xs text-[var(--muted)]">
                  {event?.is_free ? "Free" : "Paid"}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onSave?.(event)}
                  className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text)] transition hover:bg-[var(--surface-2)]"
                >
                  {isSaved ? "Saved" : "Save"}
                </button>
                {detailsHref ? (
                  <Link
                    href={detailsHref}
                    className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text)] transition hover:bg-[var(--surface-2)]"
                  >
                    Details
                  </Link>
                ) : null}
                <a
                  href={event?.event_url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--accent-h)]"
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
    <article className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-[0_16px_40px_rgba(24,24,20,0.12)] transition-transform duration-200 hover:scale-[1.01]">
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
            className="object-contain p-3"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-[#ECE9DF] to-[#F5F4F0]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />
        <div className="absolute left-4 bottom-4 right-4 flex items-end justify-between">
          <div>
            <h3 className="text-lg font-semibold text-[var(--text)] line-clamp-2">
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
            <p className="mt-1 text-sm text-[var(--muted)]">
              {event?.organizer || "Unknown"} · {dateDisplay}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span
              className={`rounded-full px-2 py-1 text-xs text-white ${platformColor}`}
            >
              {event?.platform}
            </span>
            <span
              className={`rounded-full px-2 py-1 text-xs text-white ${modeColor}`}
            >
              {event?.mode}
            </span>
            <span className="rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-2 py-1 text-xs text-[var(--text)]">
              {locationDisplay}
            </span>
          </div>
        </div>
      </div>
      <div className="space-y-3 bg-[var(--surface)] p-4">
        <p className="line-clamp-3 text-sm text-[var(--muted)]">
          {event?.description || "No description available."}
        </p>
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-2">
            {(event?.tags || []).slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-2 py-1 text-xs text-[var(--accent)]"
              >
                {tag}
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <span className="rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-2 py-1 text-xs text-[var(--muted)]">
              {event?.is_free ? "Free" : "Paid"}
            </span>
            <button
              onClick={() => onSave?.(event)}
              className="rounded-md border border-[var(--border)] px-3 py-1 text-sm text-[var(--text)]"
            >
              {isSaved ? "Saved" : "Save"}
            </button>
            {detailsHref ? (
              <Link
                href={detailsHref}
                className="rounded-md border border-[var(--border)] px-3 py-1 text-sm text-[var(--text)] transition hover:bg-[var(--surface-2)]"
              >
                Details
              </Link>
            ) : null}
            <a
              href={event?.event_url}
              target="_blank"
              rel="noreferrer"
              className="rounded-md bg-[var(--accent)] px-3 py-1 text-sm text-white"
            >
              Register
            </a>
          </div>
        </div>
      </div>
    </article>
  );
}
