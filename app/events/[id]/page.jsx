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
      <section className="mx-auto w-full max-w-5xl px-4 pb-20 pt-10 lg:px-6">
        <div className="mb-8 flex items-center justify-between">
          <Link 
            href="/events" 
            className="group flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-[var(--muted)] transition hover:text-[var(--accent)]"
          >
            <span className="transition-transform group-hover:-translate-x-1">←</span> Back to Events
          </Link>
          <div className="flex gap-2">
            <span className="rounded-full bg-[var(--surface-2)] px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[var(--muted)] border border-[var(--border)]">
              {event?.platform}
            </span>
          </div>
        </div>

        <div className="overflow-hidden rounded-[40px] border border-[var(--border)] bg-[var(--surface)] shadow-[0_40px_100px_rgba(0,0,0,0.08)]">
          <div className="relative h-[300px] w-full overflow-hidden bg-[var(--surface-2)] sm:h-[400px]">
            {event?.banner_url ? (
              <Image
                src={event.banner_url}
                alt={event.title}
                fill
                className="object-cover"
                priority
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#ECE9DF] to-[#E1DDCF]">
                <span className="text-8xl">🗓️</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-8 left-8 right-8 text-white sm:bottom-12 sm:left-12 sm:right-12">
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.3em] text-orange-400">
                {event?.mode} • {event?.is_free ? "Free Event" : "Paid Event"}
              </p>
              <h1 className="max-w-3xl text-3xl font-bold leading-tight sm:text-5xl lg:text-6xl">
                {event?.title}
              </h1>
            </div>
          </div>

          <div className="grid lg:grid-cols-[1fr_320px]">
            <div className="p-8 sm:p-12">
              <div className="mb-12 grid gap-8 sm:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--faint)]">Date & Time</p>
                  <p className="text-lg font-semibold text-[var(--text)]">{dateRange}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--faint)]">Location</p>
                  <p className="text-lg font-semibold text-[var(--text)]">
                    {event?.city || "Online"}
                    {event?.country ? `, ${event.country}` : ""}
                  </p>
                  {locationDetail && <p className="text-sm text-[var(--muted)]">{locationDetail}</p>}
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--faint)]">Hosted By</p>
                  <p className="text-lg font-semibold text-[var(--text)]">{event?.organizer || "Community Host"}</p>
                </div>
                <div className="flex items-center">
                  <a
                    href={ticketUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex h-12 items-center justify-center rounded-2xl bg-[var(--accent)] px-8 text-sm font-bold text-white shadow-xl shadow-orange-500/20 transition hover:bg-[var(--accent-h)] hover:shadow-orange-500/40 active:scale-95"
                  >
                    {ticketLabel}
                  </a>
                </div>
              </div>

              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-[var(--text)]">About this event</h2>
                <div className="prose prose-sm max-w-none text-[var(--muted)] leading-relaxed">
                  <p className="whitespace-pre-line">{aboutText}</p>
                </div>
              </div>

              {(hosts.length > 0 || speakers.length > 0) && (
                <div className="mt-12 space-y-6 pt-12 border-t border-[var(--border)]">
                  <h2 className="text-2xl font-bold text-[var(--text)]">Highlights</h2>
                  <div className="grid gap-6 sm:grid-cols-2">
                    {hosts.length > 0 && (
                      <div className="rounded-[24px] bg-[var(--surface-2)] p-6">
                        <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-[var(--faint)]">Hosts</p>
                        <div className="flex flex-wrap gap-2">
                          {hosts.map(host => (
                            <span key={host} className="rounded-full bg-white px-3 py-1 text-xs font-semibold shadow-sm">{host}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {speakers.length > 0 && (
                      <div className="rounded-[24px] bg-[var(--surface-2)] p-6">
                        <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-[var(--faint)]">Speakers</p>
                        <div className="flex flex-wrap gap-2">
                          {speakers.map(speaker => (
                            <span key={speaker} className="rounded-full bg-white px-3 py-1 text-xs font-semibold shadow-sm">{speaker}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <aside className="border-l border-[var(--border)] bg-[var(--surface-2)]/50 p-8 sm:p-10">
              <div className="space-y-10">
                <div className="space-y-4">
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--muted)]">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {tags.length ? (
                      tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-[var(--surface)] px-3 py-1 text-[11px] font-bold text-[var(--accent)] shadow-sm border border-[var(--border)]"
                        >
                          #{tag}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-[var(--muted)]">No tags available</span>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--muted)]">Location Map</h3>
                  <div className="overflow-hidden rounded-[24px] border border-[var(--border)] grayscale transition duration-500 hover:grayscale-0 shadow-lg">
                    <iframe
                      title="Event map"
                      src={`https://maps.google.com/maps?q=${encodeURIComponent(event?.city || "Mumbai")}&t=&z=13&ie=UTF8&iwloc=&output=embed`}
                      className="h-64 w-full"
                      loading="lazy"
                    />
                  </div>
                </div>

                <div className="rounded-[24px] bg-white p-6 shadow-sm border border-[var(--border)]">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--faint)] mb-4">Registration</p>
                  <p className="text-sm font-semibold mb-6">{registrationStatus || "Open for registration"}</p>
                  <a
                    href={ticketUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex h-11 w-full items-center justify-center rounded-xl bg-[var(--text)] text-[11px] font-bold uppercase tracking-widest text-white transition hover:bg-black"
                  >
                    Join Event
                  </a>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
}
