"use client";

import { Navbar } from "../components/Navbar";

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
      <div className="absolute inset-0 rounded-2xl opacity-40 [background-image:radial-gradient(circle,#C8C5BC_1px,transparent_1px)] [background-size:24px_24px]" />

      {floatingEvents.map((event, index) => {
        const positions = [
          "left-2 top-4 sm:left-6 sm:top-6 rotate-[-4deg] animate-float-1",
          "left-24 top-16 sm:left-40 sm:top-14 rotate-[1deg] animate-float-2",
          "left-10 top-52 sm:left-24 sm:top-56 rotate-[5deg] animate-float-3",
        ];

        return (
          <div
            key={event.title}
            className={`absolute w-[220px] overflow-hidden rounded-2xl bg-white shadow-[0_12px_36px_rgba(24,24,20,0.14)] ${
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
              <span className="absolute left-3 top-3 rounded-full bg-white/20 px-2 py-1 text-[10px] font-semibold tracking-wider text-white">
                {event.platform}
              </span>
            </div>
            <div className="p-3">
              <div className="text-xs font-semibold text-[#1A1916]">
                {event.title}
              </div>
              <div className="mt-1 text-[11px] text-[#6B6860]">
                {event.meta}
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="rounded-full bg-[#ECFDF5] px-2 py-0.5 text-[10px] font-semibold text-[#16A34A]">
                  Free
                </span>
                <span className="rounded-full bg-[var(--accent)] px-2 py-0.5 text-[10px] font-semibold text-white">
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

export default function LandingPage() {
  return (
    <main
      className="min-h-screen bg-[var(--bg)] text-[var(--text)]"
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
      }}
    >
      <Navbar />

      <section className="mx-auto grid w-full max-w-6xl gap-10 px-4 pb-16 pt-14 sm:px-6 lg:grid-cols-2 lg:items-center">
        <div className="animate-fade-in-up">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#FFCFBF] bg-[var(--accent-soft)] px-4 py-1 text-xs font-semibold tracking-wide text-[var(--accent)]">
            Now aggregating Luma · Devfolio · Unstop
          </div>
          <h1 className="serif mb-6 text-4xl leading-tight sm:text-5xl lg:text-6xl">
            Every tech event.
            <br />
            <span className="text-[var(--accent)]">One place.</span>
          </h1>
          <p className="mb-7 max-w-xl text-base text-[var(--muted)] sm:text-lg">
            Discover hackathons, meetups, and workshops across India. Powered by
            AI that understands what you are looking for.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <a
              href="/events"
              className="rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--accent-h)] hover:-translate-y-0.5"
            >
              Explore Events →
            </a>
            <a
              href="#how"
              className="rounded-full border border-[var(--border)] px-6 py-3 text-sm text-[var(--text)] transition hover:bg-[var(--surface-2)]"
            >
              See how it works
            </a>
          </div>

          <div className="mt-6 flex items-center gap-3 text-xs text-[var(--muted)]">
            <div className="flex -space-x-2">
              {["R", "A", "S", "P", "K"].map((letter, index) => (
                <div
                  key={letter}
                  className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white text-[10px] font-semibold text-white"
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
            <span>Trusted by 2,000+ developers</span>
          </div>
        </div>

        <div className="relative rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_24px_48px_rgba(24,24,20,0.08)]">
          <div className="absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_20%_10%,rgba(255,79,23,0.18),transparent_55%)]" />
          <div className="relative">
            <FloatingCards />
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-5xl gap-6 px-4 pb-16 sm:px-6 md:grid-cols-2">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
          <div className="mb-4 text-xs font-semibold tracking-[0.2em] text-[var(--muted)]">
            BEFORE TECHPULSE
          </div>
          <div className="space-y-3 text-sm text-[var(--text)]">
            {beforeItems.map((item) => (
              <div key={item} className="flex items-start gap-2">
                <span className="text-base text-[#EF4444]">✗</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-[var(--accent)] bg-[var(--accent-soft)] p-6">
          <div className="mb-4 text-xs font-semibold tracking-[0.2em] text-[var(--accent)]">
            WITH TECHPULSE
          </div>
          <div className="space-y-3 text-sm text-[var(--text)]">
            {afterItems.map((item) => (
              <div key={item} className="flex items-start gap-2">
                <span className="text-base text-[#16A34A]">✓</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="features"
        className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6"
      >
        <div className="mb-2 text-xs font-semibold tracking-[0.3em] text-[var(--accent)]">
          FEATURES
        </div>
        <h2 className="serif mb-10 text-3xl sm:text-4xl">
          Everything you need to never miss an event.
        </h2>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featureCards.map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 transition hover:-translate-y-1 hover:border-[var(--accent)] hover:shadow-[0_12px_24px_rgba(255,79,23,0.12)]"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-lg">
                {feature.icon}
              </div>
              <div className="text-sm font-semibold">{feature.title}</div>
              <div className="mt-2 text-sm text-[var(--muted)]">
                {feature.description}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section
        id="events"
        className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6"
      >
        <div className="mb-2 text-xs font-semibold tracking-[0.3em] text-[var(--accent)]">
          MAP DISCOVERY
        </div>
        <div className="serif mb-5 text-2xl sm:text-3xl">
          Find events near you
        </div>
        <div className="relative h-64 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] sm:h-72">
          <div className="absolute inset-0 bg-[linear-gradient(120deg,#E8E4D8,#F6F4EF)]" />
          <div className="absolute inset-0 opacity-50 [background-image:linear-gradient(transparent_0,transparent_39px,#C8C5BC_40px),linear-gradient(90deg,transparent_0,transparent_39px,#C8C5BC_40px)] [background-size:40px_40px]" />
          <div className="absolute left-[25%] top-[55%] rounded-full bg-[var(--accent)] px-3 py-1 text-xs font-semibold text-white shadow-[0_8px_18px_rgba(255,79,23,0.3)]">
            Mumbai · 12
          </div>
          <div className="absolute left-[35%] top-[68%] rounded-full bg-[#7C3AED] px-3 py-1 text-xs font-semibold text-white shadow-[0_8px_18px_rgba(124,58,237,0.25)]">
            Bangalore · 8
          </div>
          <div className="absolute left-[31%] top-[58%] rounded-full bg-[#2563EB] px-3 py-1 text-xs font-semibold text-white shadow-[0_8px_18px_rgba(37,99,235,0.25)]">
            Pune · 5
          </div>
          <div className="absolute left-[42%] top-[30%] rounded-full bg-[var(--accent)] px-3 py-1 text-xs font-semibold text-white shadow-[0_8px_18px_rgba(255,79,23,0.3)]">
            Delhi · 6
          </div>
          <div className="absolute right-4 bottom-4 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-[11px] text-[var(--muted)]">
            Powered by MapKit JS
          </div>
        </div>
      </section>

      <section id="how" className="mx-auto w-full max-w-5xl px-4 pb-16 sm:px-6">
        <div className="mb-2 text-xs font-semibold tracking-[0.3em] text-[var(--accent)]">
          HOW IT WORKS
        </div>
        <div className="serif mb-6 text-2xl sm:text-3xl">
          Three steps to discovery.
        </div>
        <div className="grid gap-6 sm:grid-cols-3">
          {[
            {
              step: "1",
              title: "We Scrape",
              description:
                "Collect events from Luma, Devfolio, Unstop every 6 hours.",
            },
            {
              step: "2",
              title: "AI Normalizes",
              description:
                "GPT-4o tags, categorizes, and summarizes every event.",
            },
            {
              step: "3",
              title: "You Discover",
              description: "Search, filter, save, and register in one place.",
            },
          ].map((item) => (
            <div
              key={item.step}
              className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 text-center"
            >
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent)] text-lg font-semibold text-white">
                {item.step}
              </div>
              <div className="text-sm font-semibold">{item.title}</div>
              <div className="mt-2 text-sm text-[var(--muted)]">
                {item.description}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section
        id="about"
        className="bg-[#FFF5F2] px-4 py-16 text-center sm:px-6"
      >
        <h2 className="serif mb-3 text-3xl sm:text-4xl">
          Ready to stop missing events?
        </h2>
        <p className="mb-8 text-sm text-[var(--muted)]">
          No signup required to browse. Free forever.
        </p>
        <a
          href="/events"
          className="inline-flex rounded-full bg-[var(--accent)] px-7 py-3 text-sm font-semibold text-white transition hover:bg-[var(--accent-h)]"
        >
          Get Started Free →
        </a>
      </section>

      <footer className="border-t border-[var(--border)] bg-[var(--surface)] px-4 py-8 sm:px-6">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 text-sm text-[var(--muted)] sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="serif text-lg text-[var(--text)]">TechPulse</div>
            <div className="mt-1 text-xs">
              The discovery layer for India&#39;s tech ecosystem
            </div>
          </div>
          <div className="flex flex-wrap gap-5">
            <a href="/events" className="transition hover:text-[var(--text)]">
              Events
            </a>
            <a href="/explore" className="transition hover:text-[var(--text)]">
              Explore
            </a>
            <a href="/about" className="transition hover:text-[var(--text)]">
              About
            </a>
            <a
              href="https://github.com"
              className="transition hover:text-[var(--text)]"
            >
              GitHub
            </a>
          </div>
          <div className="text-xs text-[var(--faint)]">© 2025 TechPulse</div>
        </div>
      </footer>
    </main>
  );
}
