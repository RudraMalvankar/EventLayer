import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Navbar } from "../../../components/Navbar";
import { getEventDetailsLiveService } from "../../../src/features/events/service";

export const dynamic = "force-dynamic";

function formatDate(value, withTime = false) {
  if (!value) return "TBA";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "TBA";
  return date.toLocaleDateString(
    "en-US",
    withTime
      ? {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
        }
      : { month: "short", day: "numeric", year: "numeric" },
  );
}

export default async function EventDetailPage({ params }) {
  const { id } = params || {};
  if (!id) return notFound();

  const { data, error } = await getEventDetailsLiveService(id);
  if (error || !data?.event) return notFound();

  const { event, details } = data;

  const dateRange = event?.start_date
    ? event?.end_date &&
      new Date(event.start_date).toDateString() !==
        new Date(event.end_date).toDateString()
      ? `${formatDate(event.start_date, true)} — ${formatDate(event.end_date, true)}`
      : formatDate(event.start_date, true)
    : "TBA";

  const tags = Array.isArray(event?.tags) ? event.tags : [];
  const aboutText =
    details?.about || event?.description || "No description available yet.";
  const hosts = Array.isArray(details?.hosts) ? details.hosts : [];
  const speakers = Array.isArray(details?.speakers) ? details.speakers : [];
  const registrationStatus = details?.registration_status || "";
  const ticketUrl = details?.ticket_url || event?.event_url;
  const ticketLabel = details?.ticket_label || "Register";
  const locationDetail = details?.location_detail || "";

  return (
    <main
      className="min-h-screen text-[var(--text)]"
      style={{
        "--bg": "#FAFAF8",
        "--surface": "#FFFFFF",
        "--surface-2": "#F5F4F0",
        "--border": "#E8E6E0",
        "--text": "#1A1916",
        "--muted": "#6B6860",
        "--faint": "#9B9890",
        "--accent": "#FF4F17",
        "--accent-h": "#E64410",
        "--accent-soft": "#FFF2EE",
        background:
          "radial-gradient(1200px 420px at 10% -20%, rgba(255,79,23,0.12) 0%, transparent 60%), radial-gradient(900px 380px at 85% 10%, rgba(255,143,94,0.12) 0%, transparent 60%), var(--bg)",
      }}
    >
      <Navbar />
      <section className="mx-auto w-full max-w-6xl px-4 pb-16 pt-8 lg:px-6">
        <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--muted)]">
          <Link href="/events" className="transition hover:text-[var(--text)]">
            Events
          </Link>
          <span className="h-1 w-1 rounded-full bg-[var(--border)]" />
          <span>{event?.title}</span>
        </div>

        <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-6">
            <div className="overflow-hidden rounded-[28px] border border-[var(--border)] bg-[var(--surface)] shadow-[0_24px_80px_rgba(24,24,20,0.12)]">
              <div className="grid gap-0 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
                <div className="relative min-h-[240px] w-full overflow-hidden bg-[var(--surface-2)]">
                  {event?.banner_url ? (
                    <Image
                      src={event.banner_url}
                      alt={event.title}
                      fill
                      sizes="(max-width: 1024px) 100vw, 55vw"
                      className="object-contain p-6"
                      priority
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-[#ECE9DF] via-[#F5F4F0] to-[#E1DDCF]" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-black/5" />
                </div>

                <div className="space-y-5 p-6 sm:p-7">
                  <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                    <span className="rounded-full bg-[#EDE9FE] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#4C1D95]">
                      {event?.platform}
                    </span>
                    <span className="rounded-full bg-[var(--surface-2)] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">
                      {event?.mode}
                    </span>
                    {registrationStatus ? (
                      <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--accent)]">
                        {registrationStatus}
                      </span>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-[0.3em] text-[var(--accent)]">
                      Event details
                    </p>
                    <h1 className="text-3xl font-semibold leading-tight text-[var(--text)] sm:text-4xl">
                      {event?.title}
                    </h1>
                    <p className="text-sm text-[var(--muted)]">
                      {event?.organizer || "Unknown organizer"}
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-[var(--faint)]">
                        Date & time
                      </p>
                      <p className="mt-1 text-sm text-[var(--text)]">
                        {dateRange}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-[var(--faint)]">
                        Location
                      </p>
                      <p className="mt-1 text-sm text-[var(--text)]">
                        {event?.city || "Online"}
                        {event?.country ? `, ${event.country}` : ""}
                      </p>
                      {locationDetail ? (
                        <p className="mt-1 text-xs text-[var(--muted)]">
                          {locationDetail}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <a
                      href={ticketUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--accent-h)]"
                    >
                      {ticketLabel}
                    </a>
                    <Link
                      href="/events"
                      className="rounded-full border border-[var(--border)] px-5 py-2.5 text-sm font-semibold text-[var(--text)] transition hover:bg-[var(--surface-2)]"
                    >
                      Back to events
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_18px_60px_rgba(24,24,20,0.12)]">
              <h2 className="text-xl font-semibold text-[var(--text)]">
                About this event
              </h2>
              <p className="mt-3 whitespace-pre-line text-sm leading-6 text-[var(--muted)]">
                {aboutText}
              </p>
            </div>

            {(hosts.length || speakers.length || registrationStatus) && (
              <div className="rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_18px_60px_rgba(24,24,20,0.12)]">
                <h2 className="text-xl font-semibold text-[var(--text)]">
                  Highlights
                </h2>
                <div className="mt-4 grid gap-4 text-sm text-[var(--muted)] sm:grid-cols-2">
                  {registrationStatus ? (
                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-[var(--faint)]">
                        Registration
                      </p>
                      <p className="mt-2 text-sm text-[var(--text)]">
                        {registrationStatus}
                      </p>
                    </div>
                  ) : null}
                  {hosts.length ? (
                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-[var(--faint)]">
                        Hosted by
                      </p>
                      <p className="mt-2 text-sm text-[var(--text)]">
                        {hosts.join(", ")}
                      </p>
                    </div>
                  ) : null}
                  {speakers.length ? (
                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-4 sm:col-span-2">
                      <p className="text-xs uppercase tracking-[0.2em] text-[var(--faint)]">
                        Speakers
                      </p>
                      <p className="mt-2 text-sm text-[var(--text)]">
                        {speakers.join(", ")}
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>
            )}
          </div>

          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[0_18px_60px_rgba(24,24,20,0.1)]">
              <p className="text-xs uppercase tracking-[0.28em] text-[var(--faint)]">
                Event snapshot
              </p>
              <div className="mt-4 space-y-3 text-sm text-[var(--muted)]">
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--faint)]">
                    Date & time
                  </p>
                  <p className="mt-1 text-sm text-[var(--text)]">{dateRange}</p>
                </div>
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--faint)]">
                    Location
                  </p>
                  <p className="mt-1 text-sm text-[var(--text)]">
                    {event?.city || "Online"}
                    {event?.country ? `, ${event.country}` : ""}
                  </p>
                  {locationDetail ? (
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      {locationDetail}
                    </p>
                  ) : null}
                </div>
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--faint)]">
                    Organizer
                  </p>
                  <p className="mt-1 text-sm text-[var(--text)]">
                    {event?.organizer || "Unknown organizer"}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[0_18px_60px_rgba(24,24,20,0.1)]">
              <p className="text-xs uppercase tracking-[0.28em] text-[var(--faint)]">
                Tags
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {tags.length ? (
                  tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1 text-xs text-[var(--accent)]"
                    >
                      {tag}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-[var(--muted)]">
                    No tags available
                  </span>
                )}
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
