import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Navbar } from '../../../components/Navbar'
import { getEventDetailsLiveService } from '../../../src/features/events/service'

export const dynamic = 'force-dynamic'

function formatDate(value, withTime = false) {
  if (!value) return 'TBA'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'TBA'
  return date.toLocaleDateString('en-US', withTime
    ? { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }
    : { month: 'short', day: 'numeric', year: 'numeric' })
}

export default async function EventDetailPage({ params }) {
  const { id } = params || {}
  if (!id) return notFound()

  const { data, error } = await getEventDetailsLiveService(id)
  if (error || !data?.event) return notFound()

  const { event, details } = data

  const dateRange = event?.start_date
    ? event?.end_date && new Date(event.start_date).toDateString() !== new Date(event.end_date).toDateString()
      ? `${formatDate(event.start_date, true)} — ${formatDate(event.end_date, true)}`
      : formatDate(event.start_date, true)
    : 'TBA'

  const tags = Array.isArray(event?.tags) ? event.tags : []
  const aboutText = details?.about || event?.description || 'No description available yet.'
  const hosts = Array.isArray(details?.hosts) ? details.hosts : []
  const speakers = Array.isArray(details?.speakers) ? details.speakers : []
  const registrationStatus = details?.registration_status || ''
  const ticketUrl = details?.ticket_url || event?.event_url
  const ticketLabel = details?.ticket_label || 'Register'
  const locationDetail = details?.location_detail || ''

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.08),transparent_28%),radial-gradient(circle_at_top_right,rgba(6,182,212,0.10),transparent_24%),var(--bg)]">
      <Navbar />
      <section className="mx-auto w-full max-w-6xl px-4 pb-16 pt-8 lg:px-6">
        <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-400">
          <Link href="/events" className="transition hover:text-cyan-200">Events</Link>
          <span className="h-1 w-1 rounded-full bg-zinc-600" />
          <span>{event?.title}</span>
        </div>

        <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-6">
            <div className="overflow-hidden rounded-[28px] border border-zinc-800 bg-zinc-950/80 shadow-[0_24px_80px_rgba(0,0,0,0.24)]">
              <div className="grid gap-0 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
                <div className="relative min-h-[240px] w-full overflow-hidden bg-zinc-950">
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
                    <div className="h-full w-full bg-gradient-to-br from-zinc-800 via-zinc-900 to-slate-950" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                </div>

                <div className="space-y-5 p-6 sm:p-7">
                  <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.2em] text-zinc-400">
                    <span className="rounded-full bg-violet-600/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-violet-200">
                      {event?.platform}
                    </span>
                    <span className="rounded-full bg-slate-600/40 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-200">
                      {event?.mode}
                    </span>
                    {registrationStatus ? (
                      <span className="rounded-full bg-zinc-900 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-200">
                        {registrationStatus}
                      </span>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">Event details</p>
                    <h1 className="text-3xl font-semibold leading-tight text-white sm:text-4xl">{event?.title}</h1>
                    <p className="text-sm text-zinc-400">{event?.organizer || 'Unknown organizer'}</p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Date & time</p>
                      <p className="mt-1 text-sm text-white">{dateRange}</p>
                    </div>
                    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Location</p>
                      <p className="mt-1 text-sm text-white">
                        {event?.city || 'Online'}{event?.country ? `, ${event.country}` : ''}
                      </p>
                      {locationDetail ? (
                        <p className="mt-1 text-xs text-zinc-400">{locationDetail}</p>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <a
                      href={ticketUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full bg-cyan-400 px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-cyan-300"
                    >
                      {ticketLabel}
                    </a>
                    <Link
                      href="/events"
                      className="rounded-full border border-zinc-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800"
                    >
                      Back to events
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[24px] border border-zinc-800 bg-zinc-900/90 p-6 shadow-[0_18px_60px_rgba(0,0,0,0.2)]">
              <h2 className="text-xl font-semibold text-white">About this event</h2>
              <p className="mt-3 whitespace-pre-line text-sm leading-6 text-zinc-300">
                {aboutText}
              </p>
            </div>

            {(hosts.length || speakers.length || registrationStatus) && (
              <div className="rounded-[24px] border border-zinc-800 bg-zinc-900/90 p-6 shadow-[0_18px_60px_rgba(0,0,0,0.2)]">
                <h2 className="text-xl font-semibold text-white">Highlights</h2>
                <div className="mt-4 grid gap-4 text-sm text-zinc-300 sm:grid-cols-2">
                  {registrationStatus ? (
                    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Registration</p>
                      <p className="mt-2 text-sm text-white">{registrationStatus}</p>
                    </div>
                  ) : null}
                  {hosts.length ? (
                    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Hosted by</p>
                      <p className="mt-2 text-sm text-white">{hosts.join(', ')}</p>
                    </div>
                  ) : null}
                  {speakers.length ? (
                    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 sm:col-span-2">
                      <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Speakers</p>
                      <p className="mt-2 text-sm text-white">{speakers.join(', ')}</p>
                    </div>
                  ) : null}
                </div>
              </div>
            )}
          </div>

          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-[24px] border border-zinc-800 bg-zinc-950/70 p-5 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">Event snapshot</p>
              <div className="mt-4 space-y-3 text-sm text-zinc-300">
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Date & time</p>
                  <p className="mt-1 text-sm text-white">{dateRange}</p>
                </div>
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Location</p>
                  <p className="mt-1 text-sm text-white">
                    {event?.city || 'Online'}{event?.country ? `, ${event.country}` : ''}
                  </p>
                  {locationDetail ? (
                    <p className="mt-1 text-xs text-zinc-400">{locationDetail}</p>
                  ) : null}
                </div>
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Organizer</p>
                  <p className="mt-1 text-sm text-white">{event?.organizer || 'Unknown organizer'}</p>
                </div>
              </div>
            </div>

            <div className="rounded-[24px] border border-zinc-800 bg-zinc-950/70 p-5 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">Tags</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {tags.length ? (
                  tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-zinc-800 bg-zinc-900/70 px-3 py-1 text-xs text-sky-300"
                    >
                      {tag}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-zinc-400">No tags available</span>
                )}
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  )
}
