import { Navbar } from "../components/Navbar";
import { EventCard } from "../components/EventCard";
import {
  getEventsService,
  getTrendingEventsService,
} from "../src/features/events/service";

const MAP_PREVIEW_URL = process.env.NEXT_PUBLIC_MAPBOX_STATIC_PREVIEW_URL || "";

const floatingEvents = [
  {
    platform: "LUMA",
    title: "Builder Hack Night",
    meta: "Jun 14 · Online",
    accent: "from-[#6D28D9] to-[#4F46E5]",
    image:
      "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80",
  },
  {
    platform: "DEVFOLIO",
    title: "GDG Mumbai DevFest",
    meta: "Jun 20 · Mumbai",
    accent: "from-[#0EA5E9] to-[#0284C7]",
    image:
      "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80",
  },
  {
    platform: "UNSTOP",
    title: "Startup Weekend Pune",
    meta: "Jun 28 · Pune",
    accent: "from-[#F59E0B] to-[#F97316]",
    image:
      "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80",
  },
];

const featureCards = [
  {
    icon: "🔍",
    title: "AI Natural Search",
    description:
      '"Free AI hackathons in Mumbai this weekend" just works with GPT-4o.',
  },
  {
    icon: "⚡",
    title: "Real-time Aggregation",
    description:
      "Events from Luma, Devfolio, Unstop, and more synced every 6 hours.",
  },
  {
    icon: "🗺️",
    title: "Map Discovery",
    description:
      "Explore what is happening near you with quick city clustering.",
  },
  {
    icon: "🔔",
    title: "Smart Alerts",
    description: "Get a weekly digest tailored to your interests and location.",
  },
  {
    icon: "👥",
    title: "Community Graph",
    description: "Follow organizers, colleges, and communities in one place.",
  },
  {
    icon: "🎯",
    title: "One-Click Register",
    description: "Jump to the original platform and register instantly.",
  },
];

const beforeItems = [
  "Check Luma manually every day",
  "Check Devfolio separately",
  "Check Unstop too",
  "Scan LinkedIn, Twitter, Discord",
  "Miss the event anyway",
];

const afterItems = [
  "One unified feed, all platforms",
  "AI search that understands you",
  "Map view of events near you",
  "Weekly digest in your inbox",
  "Never miss an event again",
];

function FloatingCards() {
  return (
    <div className="relative h-[380px] sm:h-[420px]">
      <div className="absolute inset-0 rounded-2xl opacity-10 [background-image:radial-gradient(circle,#ffffff_1px,transparent_1px)] [background-size:24px_24px]" />

      {floatingEvents.map((event, index) => {
        const positions = [
          "left-2 top-4 sm:left-6 sm:top-6 rotate-[-4deg] animate-float-1",
          "left-24 top-16 sm:left-40 sm:top-14 rotate-[1deg] animate-float-2",
          "left-10 top-52 sm:left-24 sm:top-56 rotate-[5deg] animate-float-3",
        ];

        return (
          <div
            key={event.title}
            className={`absolute w-[220px] overflow-hidden rounded-2xl bg-[#0a0c12] border border-white/10 shadow-[0_12px_36px_rgba(0,0,0,0.5)] ${
              positions[index]
            }`}
          >
            <div
              className={`relative h-24 bg-gradient-to-br ${event.accent}`}
              style={{
                backgroundImage: `linear-gradient(140deg, rgba(0,0,0,0.15), rgba(0,0,0,0.5)), url(${event.image})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              <span className="absolute left-3 top-3 rounded-full bg-white/10 backdrop-blur-md px-2 py-1 text-[10px] font-bold tracking-wider text-white uppercase border border-white/10">
                {event.platform}
              </span>
            </div>
            <div className="p-3">
              <div className="text-xs font-bold text-white uppercase tracking-tight">
                {event.title}
              </div>
              <div className="mt-1 text-[11px] text-gray-500 font-medium">
                {event.meta}
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
                  Free
                </span>
                <span className="rounded-full bg-orange-500 px-3 py-1 text-[10px] font-bold text-white uppercase tracking-widest shadow-lg shadow-orange-500/20">
                  Register
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default async function LandingPage() {
  let events = [];
  let trendingEvents = [];
  try {
    const [feedResult, trendingResult] = await Promise.all([
      getEventsService({ limit: 6 }),
      getTrendingEventsService(3),
    ]);
    events = (feedResult?.data?.events || []).filter((e) => e.start_date);
    trendingEvents = Array.isArray(trendingResult?.data?.events)
      ? trendingResult.data.events
      : [];
  } catch (err) {
    events = [];
    trendingEvents = [];
  }

  const featuredTrending = trendingEvents.length
    ? trendingEvents
    : events.slice(0, 3);
  return (
    <main className="min-h-screen text-white bg-[#030407]">
      <Navbar />

      <section className="mx-auto grid w-full max-w-6xl gap-16 px-6 pb-24 pt-20 lg:grid-cols-2 lg:items-center">
        <div className="animate-fade-in-up">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.3em] text-orange-500">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
            Now aggregating Luma · Meetup · Devfolio · Unstop
          </div>
          <h1 className="text-6xl font-black tracking-tighter leading-[0.95] mb-8">
            Every tech event.
            <br />
            <span className="text-orange-500">One ecosystem.</span>
          </h1>
          <p className="mb-10 max-w-lg text-lg text-gray-400 leading-relaxed">
            The ultimate discovery layer for India's tech ecosystem. Unified
            feed, AI-powered discovery, and zero noise.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <a
              href="/events"
              className="rounded-full bg-orange-500 px-10 py-5 text-xs font-black uppercase tracking-[0.2em] text-white transition-all hover:bg-orange-600 hover:-translate-y-1 active:scale-95 accent-glow"
            >
              Explore Events →
            </a>
            <a
              href="#how"
              className="rounded-full border border-white/10 bg-white/5 px-10 py-5 text-xs font-black uppercase tracking-[0.2em] text-white transition-all hover:bg-white/10 active:scale-95"
            >
              See how it works
            </a>
          </div>

          <div className="mt-12 flex items-center gap-6">
            <div className="flex -space-x-3">
              {[
                "R",
                "A",
                "S",
                "P",
                "K",
              ].map((letter, index) => (
                <div
                  key={letter}
                  className="flex h-10 w-10 items-center justify-center rounded-full border-4 border-[#030407] text-[10px] font-black text-white"
                  style={{
                    backgroundColor: [
                      "#7C3AED",
                      "#2563EB",
                      "#16A34A",
                      "#F59E0B",
                      "#EC4899",
                    ][index],
                  }}
                >
                  {letter}
                </div>
              ))}
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
              Trusted by <span className="text-white">2,000+</span> developers
            </span>
          </div>
        </div>

        <div className="relative glass p-10 rounded-[40px] border border-white/5 shadow-2xl">
          <div className="absolute inset-0 rounded-[40px] bg-[radial-gradient(circle_at_20%_10%,rgba(255,77,0,0.1),transparent_60%)]" />
          <div className="relative">
            <FloatingCards />
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-5xl gap-10 px-6 pb-32 sm:px-6 md:grid-cols-2">
        <div className="rounded-[32px] border border-white/5 bg-white/2 p-8 transition-all hover:border-white/10">
          <div className="mb-6 text-[10px] font-black tracking-[0.3em] text-gray-600 uppercase">
            BEFORE EVENTLAYER.DEV
          </div>
          <div className="space-y-4">
            {beforeItems.map((item) => (
              <div key={item} className="flex items-start gap-3">
                <span className="text-base text-red-500 font-bold">✗</span>
                <span className="text-sm text-gray-400 font-medium">
                  {item}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-[32px] border border-orange-500/30 bg-orange-500/5 p-8 transition-all hover:border-orange-500/50">
          <div className="mb-6 text-[10px] font-black tracking-[0.3em] text-orange-500 uppercase">
            WITH EVENTLAYER.DEV
          </div>
          <div className="space-y-4">
            {afterItems.map((item) => (
              <div key={item} className="flex items-start gap-3">
                <span className="text-base text-emerald-500 font-bold">✓</span>
                <span className="text-sm text-white font-bold">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 pb-32">
        <div className="mb-4 text-[10px] font-black tracking-[0.3em] text-orange-500 uppercase">
          MOST SAVED THIS WEEK
        </div>
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between mb-12">
          <div>
            <h2 className="text-4xl font-black tracking-tighter">
              Trending now.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-gray-500 font-medium">
              Events people are saving the most. If you want the safest bet for
              what the community is paying attention to, start here.
            </p>
          </div>
          <a
            href="/events"
            className="inline-flex w-fit rounded-full border border-white/10 bg-white/5 px-6 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-white transition-all hover:bg-white/10"
          >
            View all events
          </a>
        </div>

        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {featuredTrending.length ? (
            featuredTrending.map((event) => (
              <div key={event.id || event.event_url} className="relative">
                <div className="absolute left-4 top-4 z-20 rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-orange-300 backdrop-blur-sm">
                  {event.trending_saves || 0} saves
                </div>
                <EventCard event={event} />
              </div>
            ))
          ) : (
            <div className="text-xs font-black uppercase tracking-[0.3em] text-gray-700 py-20 border border-dashed border-white/5 rounded-[40px] text-center w-full col-span-full">
              Trending feed is warming up...
            </div>
          )}
        </div>
      </section>

      <section id="features" className="mx-auto w-full max-w-6xl px-6 pb-32">
        <div className="mb-4 text-[10px] font-black tracking-[0.3em] text-orange-500 uppercase">
          CORE CAPABILITIES
        </div>
        <h2 className="text-4xl font-black tracking-tighter mb-12">
          Everything you need to{" "}
          <span className="text-gray-700">stay ahead.</span>
        </h2>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featureCards.map((feature) => (
            <div
              key={feature.title}
              className="rounded-[32px] border border-white/5 bg-white/2 p-8 transition-all duration-500 hover:-translate-y-2 hover:border-orange-500/20 hover:bg-orange-500/5 group"
            >
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 border border-white/5 text-2xl group-hover:bg-orange-500 group-hover:text-white transition-all duration-500">
                {feature.icon}
              </div>
              <div className="text-lg font-black tracking-tight text-white mb-3 uppercase">
                {feature.title}
              </div>
              <div className="text-sm text-gray-500 leading-relaxed font-medium">
                {feature.description}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="events" className="mx-auto w-full max-w-6xl px-6 pb-32">
        <div className="mb-4 text-[10px] font-black tracking-[0.3em] text-orange-500 uppercase">
          GEOSPATIAL DISCOVERY
        </div>
        <div className="text-4xl font-black tracking-tighter mb-8">
          Find events <span className="text-gray-700">near you.</span>
        </div>
        <div className="relative h-[450px] overflow-hidden rounded-[48px] border border-white/5 bg-[#0a0c12] shadow-2xl group">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-60 transition-transform duration-[10s] group-hover:scale-110"
            style={
              MAP_PREVIEW_URL
                ? { backgroundImage: `url(${MAP_PREVIEW_URL})` }
                : {
                    background:
                      "linear-gradient(135deg, #111827 0%, #020617 100%)",
                  }
            }
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#030407] via-transparent to-transparent" />

          <div className="absolute left-[25%] top-[55%] rounded-full bg-orange-500 px-4 py-2 text-[10px] font-black text-white uppercase tracking-widest shadow-[0_8px_30px_rgba(255,77,0,0.4)] animate-bounce">
            Mumbai · 12
          </div>
          <div className="absolute left-[35%] top-[68%] rounded-full bg-[#7C3AED] px-4 py-2 text-[10px] font-black text-white uppercase tracking-widest shadow-[0_8px_30px_rgba(124,58,237,0.3)] animate-pulse">
            Bangalore · 8
          </div>
          <div className="absolute left-[31%] top-[58%] rounded-full bg-[#2563EB] px-4 py-2 text-[10px] font-black text-white uppercase tracking-widest shadow-[0_8px_30px_rgba(37,99,235,0.3)]">
            Pune · 5
          </div>

          <div className="absolute right-8 bottom-8 rounded-full border border-white/10 bg-black/60 backdrop-blur-xl px-6 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">
            Tech map of Mumbai ecosystem
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 pb-32">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between mb-12">
          <div>
            <div className="mb-4 text-[10px] font-black tracking-[0.3em] text-orange-500 uppercase">
              LIVE CURATION
            </div>
            <h2 className="text-4xl font-black tracking-tighter">
              Upcoming highlights.
            </h2>
          </div>
          <p className="max-w-md text-sm leading-relaxed text-gray-500 font-medium">
            Handpicked events with cinematic visuals and zero clutter. Verified
            metadata synced in real-time.
          </p>
        </div>

        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {events && events.length ? (
            events.map((ev) => (
              <EventCard key={ev.id || ev.event_url} event={ev} />
            ))
          ) : (
            <div className="text-xs font-black uppercase tracking-[0.3em] text-gray-700 py-20 border border-dashed border-white/5 rounded-[40px] text-center w-full col-span-full">
              Feeds are being refreshed...
            </div>
          )}
        </div>
      </section>

      <section id="how" className="mx-auto w-full max-w-5xl px-6 pb-32">
        <div className="mb-4 text-[10px] font-black tracking-[0.3em] text-orange-500 uppercase">
          OUR PROCESS
        </div>
        <div className="text-4xl font-black tracking-tighter mb-12">
          Three steps to <span className="text-gray-700">discovery.</span>
        </div>
        <div className="grid gap-10 sm:grid-cols-3">
          {[
            {
              step: "01",
              title: "Scrape",
              description:
                "Distributed workers collect raw data from 10+ platforms every 6 hours.",
            },
            {
              step: "02",
              title: "Normalize",
              description:
                "AI pipelines clean, tag, and categorize events for maximum searchability.",
            },
            {
              step: "03",
              title: "Discover",
              description:
                "Search, filter, and save events in one high-performance interface.",
            },
          ].map((item) => (
            <div key={item.step} className="relative group">
              <div className="text-6xl font-black text-white/5 mb-4 group-hover:text-orange-500/10 transition-colors duration-500">
                {item.step}
              </div>
              <div className="text-lg font-black tracking-tight text-white mb-3 uppercase">
                {item.title}
              </div>
              <div className="text-sm text-gray-500 leading-relaxed font-medium">
                {item.description}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="about" className="mx-auto max-w-6xl px-6 mb-32">
        <div className="bg-orange-500 rounded-[60px] p-20 text-center relative overflow-hidden shadow-2xl accent-glow">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.2),transparent_70%)]" />
          <div className="relative z-10">
            <h2 className="text-5xl font-black tracking-tighter text-white mb-6 leading-none">
              Stop missing out on <br />
              the tech ecosystem.
            </h2>
            <p className="mb-10 text-orange-100 font-bold uppercase tracking-widest text-[10px]">
              No signup required to browse. Open access for everyone.
            </p>
            <a
              href="/events"
              className="inline-flex rounded-full bg-white px-12 py-5 text-xs font-black uppercase tracking-[0.2em] text-orange-500 transition-all hover:bg-gray-100 hover:scale-105 active:scale-95 shadow-2xl"
            >
              Get Started Now →
            </a>
          </div>
        </div>
      </section>

    </main>
  );
}