"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "../../components/Navbar";
import { useUser } from "../../components/AuthProvider";

const ACCEPTED_PLATFORMS = [
  "Luma",
  "Meetup",
  "Eventbrite",
  "Devfolio",
  "Unstop",
  "HackCulture",
  "Other tech events",
];

const STORAGE_KEY = "eventlayer.submit-links";

function isValidUrl(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function loadStoredSubmissions() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function storeSubmission(submission) {
  if (typeof window === "undefined") return;
  try {
    const current = loadStoredSubmissions();
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([submission, ...current].slice(0, 25)),
    );
  } catch {
    // Ignore local storage failures.
  }
}

export default function SubmitPage() {
  const router = useRouter();
  const { user, session } = useUser();
  const [eventUrl, setEventUrl] = useState("");
  const [platform, setPlatform] = useState("Luma");
  const [eventTitle, setEventTitle] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [city, setCity] = useState("");
  const [note, setNote] = useState("");
  const [showManualDetails, setShowManualDetails] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [recentCount, setRecentCount] = useState(0);
  const isLoggedIn = Boolean(user || session?.user);

  useEffect(() => {
    setRecentCount(loadStoredSubmissions().length);
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();

    const trimmedUrl = eventUrl.trim();
    if (!trimmedUrl || !isValidUrl(trimmedUrl)) {
      setError("Please enter a valid event link.");
      setSuccess("");
      setStatus("");
      return;
    }

    const submission = {
      event_url: trimmedUrl,
      platform,
      title: eventTitle.trim(),
      start_date: eventDate || null,
      city: city.trim(),
      note: note.trim(),
      source: "submit-page",
      submitted_at: new Date().toISOString(),
    };

    if (!isLoggedIn) {
      router.push(`/login?redirect=${encodeURIComponent("/submit")}`);
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const token = session?.access_token || null;

      const headers = { "Content-Type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;

      const response = await fetch("/api/submit", {
        method: "POST",
        headers,
        body: JSON.stringify(submission),
      });

      const json = await response.json().catch(() => ({}));
      if (!response.ok || json?.error) {
        throw new Error(json?.error || "Could not submit event link.");
      }

      const savedSubmission = json?.data?.submission || submission;
      storeSubmission(savedSubmission);
      setRecentCount((count) => count + 1);
      const submitStatus = String(json?.data?.status || "received");
      setStatus(submitStatus);
      setSuccess(
        submitStatus === "added"
          ? "This event was added to EventLayer. Open /events to see it."
          : "We saved your link, but we need a few details to finish it.",
      );
      setShowManualDetails(submitStatus === "queued");
      setEventUrl("");
      setPlatform("Luma");
      setEventTitle("");
      setEventDate("");
      setCity("");
      setNote("");
      if (submitStatus === "added") {
        setTimeout(() => router.push("/events"), 1200);
      }
    } catch (submitError) {
      setError(
        submitError?.message ||
          "Could not submit event link. Check you are logged in and try again.",
      );
      setSuccess("");
      setStatus("");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen pb-24 text-white">
      <Navbar />

      <section className="mx-auto grid w-full max-w-5xl gap-10 px-6 py-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
        <div className="space-y-8">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500">
                Community submission
              </span>
            </div>
            <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
              Submit an event link
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-gray-400 sm:text-base">
              Found a tech event we missed? Paste the link below and we’ll
              review it.
            </p>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-orange-200/90">
              If it’s relevant to builders, developers, startups, AI,
              hackathons, or tech communities, we’ll add it to EventLayer within
              10 minutes.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="rounded-[32px] border border-white/10 bg-[#0a0c12]/90 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.28)] sm:p-7"
          >
            <label className="block">
              <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.25em] text-gray-500">
                Event link
              </span>
              <input
                type="url"
                value={eventUrl}
                onChange={(event) => setEventUrl(event.target.value)}
                placeholder="Paste Luma, Meetup, Eventbrite, Devfolio, or Unstop link..."
                className="h-14 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-orange-500/70"
              />
            </label>

            <div className="mt-5 rounded-3xl border border-white/10 bg-white/5 p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">
                    Auto-fill details
                  </p>
                  <p className="text-xs leading-relaxed text-gray-400">
                    We only need these if the link cannot be parsed.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowManualDetails((value) => !value)}
                  className="inline-flex h-10 items-center justify-center rounded-full border border-white/10 px-4 text-[11px] font-black uppercase tracking-[0.2em] text-orange-300 transition hover:border-orange-500/40 hover:bg-orange-500/10"
                >
                  {showManualDetails
                    ? "Hide details"
                    : "Enter details manually"}
                </button>
              </div>

              {showManualDetails ? (
                <div className="mt-5 grid gap-5 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.25em] text-gray-500">
                      Platform
                    </span>
                    <select
                      value={platform}
                      onChange={(event) => setPlatform(event.target.value)}
                      className="h-14 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-white outline-none transition focus:border-orange-500/70"
                    >
                      {ACCEPTED_PLATFORMS.map((item) => (
                        <option
                          key={item}
                          value={item}
                          className="bg-[#0a0c12] text-white"
                        >
                          {item}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.25em] text-gray-500">
                      Event date
                    </span>
                    <input
                      type="date"
                      value={eventDate}
                      onChange={(event) => setEventDate(event.target.value)}
                      className="h-14 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-white outline-none transition focus:border-orange-500/70"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.25em] text-gray-500">
                      Event title
                    </span>
                    <input
                      type="text"
                      value={eventTitle}
                      onChange={(event) => setEventTitle(event.target.value)}
                      placeholder="If the parser cannot read it, type the title here"
                      className="h-14 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-orange-500/70"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.25em] text-gray-500">
                      City
                    </span>
                    <input
                      type="text"
                      value={city}
                      onChange={(event) => setCity(event.target.value)}
                      placeholder="Mumbai, Pune, Bengaluru, Online..."
                      className="h-14 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-orange-500/70"
                    />
                  </label>
                </div>
              ) : null}
            </div>

            <label className="mt-5 block">
              <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.25em] text-gray-500">
                Optional note
              </span>
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Add a short note about this event..."
                rows={5}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-orange-500/70"
              />
            </label>

            {error ? (
              <p className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </p>
            ) : null}

            {success ? (
              <p className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                {success}
              </p>
            ) : null}

            {status ? (
              <p className="mt-3 text-[11px] font-black uppercase tracking-[0.22em] text-gray-500">
                Status:{" "}
                {status === "added"
                  ? "Added to feed"
                  : status === "queued"
                    ? "Needs details"
                    : "Received"}
              </p>
            ) : null}

            <button
              type={isLoggedIn ? "submit" : "button"}
              disabled={submitting}
              onClick={
                !isLoggedIn
                  ? () =>
                      router.push(
                        `/login?redirect=${encodeURIComponent("/submit")}`,
                      )
                  : undefined
              }
              className="mt-6 inline-flex h-12 items-center justify-center rounded-full bg-orange-500 px-7 text-xs font-black uppercase tracking-[0.22em] text-white transition-all hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isLoggedIn
                ? submitting
                  ? "Submitting..."
                  : "Submit event"
                : "Login to submit"}
            </button>

            <p className="mt-3 text-[11px] font-medium leading-relaxed text-gray-500">
              {isLoggedIn
                ? `Signed in as ${user?.email || "your account"}. This helps us track submissions and reduce abuse.`
                : "Sign in to submit so we can track who sent each link and reduce abuse."}
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              {ACCEPTED_PLATFORMS.map((platform) => (
                <span
                  key={platform}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-gray-300"
                >
                  {platform}
                </span>
              ))}
            </div>

            <p className="mt-4 text-[11px] font-medium leading-relaxed text-gray-500">
              {recentCount
                ? `${recentCount} submission${recentCount === 1 ? "" : "s"} saved locally on this device.`
                : "Submissions are saved locally if no backend table is available yet."}
            </p>

            <p className="mt-4 text-xs leading-relaxed text-gray-500">
              If the link does not parse cleanly, tap “Enter details manually”
              and add the missing title, date, and city.
            </p>
          </form>
        </div>

        <aside className="rounded-[32px] border border-white/10 bg-[#0a0c12]/90 p-6 sm:p-7">
          <div className="inline-flex rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em] text-orange-500">
            Accepted sources
          </div>
          <div className="mt-5 space-y-4 text-sm leading-relaxed text-gray-400">
            <p>
              We review community links from event platforms and general tech
              pages that fit the EventLayer ecosystem.
            </p>
            <p>
              Great fits include hackathons, founder meetups, workshops,
              conferences, AI gatherings, and builder community events.
            </p>
          </div>

          <div className="mt-8 rounded-[24px] border border-white/10 bg-white/5 p-5">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-500">
              What happens next
            </p>
            <ul className="mt-4 space-y-3 text-sm text-gray-300">
              <li>1. We receive the link.</li>
              <li>2. We review relevance and event details.</li>
              <li>3. If it fits, it enters the EventLayer feed.</li>
            </ul>
          </div>
        </aside>
      </section>
    </main>
  );
}
