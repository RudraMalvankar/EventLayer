"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useUser } from "../../../components/AuthProvider";

const cityOptions = ["Mumbai", "Bangalore", "Pune", "Delhi", "Other"];
const interestOptions = [
  "AI/ML",
  "Web3",
  "Mobile Dev",
  "Cloud",
  "Startup",
  "Design",
  "Open Source",
  "Competitive Programming",
];
const eventTypeOptions = ["Hackathons", "Meetups", "Workshops", "Conferences"];

function toggleValue(list, value) {
  return list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value];
}

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, session, loading: authLoading } = useUser();
  const [step, setStep] = useState(1);
  const [city, setCity] = useState("");
  const [otherCity, setOtherCity] = useState("");
  const [interests, setInterests] = useState([]);
  const [eventTypes, setEventTypes] = useState([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);

  const selectedCity = useMemo(
    () => (city === "Other" ? otherCity.trim() : city),
    [city, otherCity],
  );

  useEffect(() => {
    // Allow anonymous users to access onboarding UI. If not signed in,
    // we'll save a draft locally and ask them to sign in to persist.
    if (!authLoading && !user) {
      // do nothing: allow filling onboarding as guest
    }
  }, [authLoading, user, router]);

  function goNext() {
    setError("");

    if (step === 1 && !selectedCity) {
      setError("Choose your city to continue.");
      return;
    }

    if (step === 2 && interests.length < 1) {
      setError("Pick at least one interest.");
      return;
    }

    setStep((current) => Math.min(current + 1, 3));
  }

  async function finishOnboarding() {
    setError("");

    if (!eventTypes.length) {
      setError("Pick at least one event type.");
      return;
    }

    setSaving(true);
    const payload = {
      city: selectedCity,
      interests,
      event_types: eventTypes,
    };

    if (!session?.access_token) {
      // Save draft locally and prompt user to sign in to persist
      try {
        localStorage.setItem("onboardingDraft", JSON.stringify(payload));
        setNotice("Draft saved. Sign in to apply your onboarding preferences.");
      } catch (e) {
        // ignore localStorage errors
      }
      setSaving(false);
      // Redirect to login so user can sign in and we'll auto-apply draft
      const target = `/login?redirect=/onboarding`;
      router.push(target);
      router.refresh();
      return;
    }

    const response = await fetch("/api/profile", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify(payload),
    });

    const json = await response.json();
    setSaving(false);

    if (!response.ok || json?.error) {
      setError(json?.error || "Could not save onboarding preferences.");
      return;
    }

    // Respect redirect query param if provided, otherwise go to /events
    const rawRedirect = searchParams?.get?.("redirect");
    const redirectTo =
      rawRedirect &&
      rawRedirect.startsWith("/") &&
      !rawRedirect.startsWith("//")
        ? rawRedirect
        : "/events";

    router.push(redirectTo);
    router.refresh();
  }

  // If a draft exists in localStorage and we now have a session, apply it
  useEffect(() => {
    let cancelled = false;
    async function applyDraft() {
      if (!session?.access_token) return;
      try {
        const raw = localStorage.getItem("onboardingDraft");
        if (!raw) return;
        const draft = JSON.parse(raw);
        setSaving(true);
        const resp = await fetch("/api/profile", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(draft),
        });
        const j = await resp.json();
        if (resp.ok && !j?.error) {
          localStorage.removeItem("onboardingDraft");
          const rawRedirect = searchParams?.get?.("redirect");
          const redirectTo =
            rawRedirect &&
            rawRedirect.startsWith("/") &&
            !rawRedirect.startsWith("//")
              ? rawRedirect
              : "/events";
          if (!cancelled) {
            setSaving(false);
            router.push(redirectTo);
            router.refresh();
          }
        } else {
          if (!cancelled) setSaving(false);
        }
      } catch (e) {
        if (!cancelled) setSaving(false);
      }
    }

    applyDraft();
    return () => {
      cancelled = true;
    };
  }, [session?.access_token, router, searchParams]);

  if (authLoading) {
    return (
      <main className="min-h-screen px-6 py-16 text-white flex items-center justify-center">
        <div className="h-80 w-full max-w-xl animate-pulse rounded-3xl border border-white/10 bg-white/5" />
      </main>
    );
  }

  return (
    <main className="min-h-screen px-6 py-12 text-white flex items-center justify-center">
      <section className="w-full max-w-2xl">
        <div className="mb-8 flex items-center justify-center gap-3">
          {[1, 2, 3].map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setStep(item)}
              className={`h-3 rounded-full transition-all ${
                step === item ? "w-10 bg-orange-500" : "w-3 bg-white/15"
              }`}
              aria-label={`Go to step ${item}`}
            />
          ))}
        </div>

        <div className="rounded-[32px] border border-white/10 bg-[#0a0c12]/95 p-6 shadow-[0_24px_100px_rgba(0,0,0,0.35)] md:p-8">
          {step === 1 && (
            <div>
              <p className="mb-3 text-xs font-black uppercase tracking-[0.25em] text-orange-500">
                Step 1 of 3
              </p>
              <h1 className="mb-8 text-3xl font-black tracking-tight md:text-4xl">
                What city are you in?
              </h1>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {cityOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setCity(option)}
                    className={`min-h-24 rounded-3xl border px-6 text-left text-lg font-black transition-all ${
                      city === option
                        ? "border-orange-500 bg-orange-500 text-white shadow-[0_18px_50px_rgba(255,77,0,0.25)]"
                        : "border-white/10 bg-white/5 text-gray-300 hover:border-white/20 hover:bg-white/10"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
              {city === "Other" && (
                <input
                  value={otherCity}
                  onChange={(event) => setOtherCity(event.target.value)}
                  placeholder="Type your city"
                  className="mt-4 h-14 w-full rounded-2xl border border-white/10 bg-white/5 px-5 text-white outline-none focus:border-orange-500/70"
                />
              )}
            </div>
          )}

          {step === 2 && (
            <div>
              <p className="mb-3 text-xs font-black uppercase tracking-[0.25em] text-orange-500">
                Step 2 of 3
              </p>
              <h1 className="mb-8 text-3xl font-black tracking-tight md:text-4xl">
                What are you interested in?
              </h1>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {interestOptions.map((interest) => {
                  const selected = interests.includes(interest);
                  return (
                    <button
                      key={interest}
                      type="button"
                      onClick={() =>
                        setInterests((current) =>
                          toggleValue(current, interest),
                        )
                      }
                      className={`min-h-20 rounded-3xl border px-5 text-left text-base font-black transition-all ${
                        selected
                          ? "border-orange-500 bg-orange-500 text-white"
                          : "border-white/10 bg-white/5 text-gray-300 hover:border-white/20 hover:bg-white/10"
                      }`}
                    >
                      {interest}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <p className="mb-3 text-xs font-black uppercase tracking-[0.25em] text-orange-500">
                Step 3 of 3
              </p>
              <h1 className="mb-8 text-3xl font-black tracking-tight md:text-4xl">
                What kind of events?
              </h1>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {eventTypeOptions.map((type) => {
                  const selected = eventTypes.includes(type);
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() =>
                        setEventTypes((current) => toggleValue(current, type))
                      }
                      className={`min-h-24 rounded-3xl border px-6 text-left text-lg font-black transition-all ${
                        selected
                          ? "border-orange-500 bg-orange-500 text-white shadow-[0_18px_50px_rgba(255,77,0,0.25)]"
                          : "border-white/10 bg-white/5 text-gray-300 hover:border-white/20 hover:bg-white/10"
                      }`}
                    >
                      {type}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {error && (
            <p className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </p>
          )}
          {notice && (
            <p className="mt-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
              {notice}
            </p>
          )}

          <div className="mt-8 flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => setStep((current) => Math.max(current - 1, 1))}
              disabled={step === 1 || saving}
              className="rounded-full border border-white/10 px-6 py-3 text-xs font-black uppercase tracking-[0.2em] text-gray-300 transition-colors hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Back
            </button>
            {step < 3 ? (
              <button
                type="button"
                onClick={goNext}
                className="rounded-full bg-orange-500 px-8 py-3 text-xs font-black uppercase tracking-[0.2em] text-white transition-colors hover:bg-orange-600"
              >
                Continue
              </button>
            ) : (
              <button
                type="button"
                onClick={finishOnboarding}
                disabled={saving}
                className="rounded-full bg-orange-500 px-8 py-3 text-xs font-black uppercase tracking-[0.2em] text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Saving..." : "Finish"}
              </button>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen px-6 py-16 text-white flex items-center justify-center">
          <div className="h-80 w-full max-w-xl animate-pulse rounded-3xl border border-white/10 bg-white/5" />
        </main>
      }
    >
      <OnboardingContent />
    </Suspense>
  );
}
