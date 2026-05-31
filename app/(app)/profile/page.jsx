"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { EventCard } from "../../../components/EventCard";
import { Navbar } from "../../../components/Navbar";
import { useUser } from "../../../components/AuthProvider";
import { supabase } from "../../../supabase/client";

const interestOptions = [
  "AI",
  "Startups",
  "Hackathons",
  "Design",
  "Web3",
  "DevOps",
  "Data",
  "Product",
  "Networking",
  "Open Source",
];

const cityOptions = [
  "Mumbai",
  "Pune",
  "Bangalore",
  "Delhi",
  "Hyderabad",
  "Chennai",
  "Online",
];

const platformOptions = ["luma", "meetup", "devfolio", "unstop", "eventbrite"];
const SUBMISSION_STORAGE_KEY = "eventlayer.submit-links";

const hubLinks = [
  { href: "/feed", label: "My Feed", desc: "AI-ranked for you" },
  { href: "/community", label: "Community", desc: "Follow & activity" },
  { href: "/digest", label: "Digest", desc: "Weekly summary" },
  { href: "/notifications", label: "Alerts", desc: "Notifications" },
];

function initialsFrom(profile, user) {
  const source =
    profile?.first_name ||
    profile?.display_name ||
    profile?.name ||
    user?.email ||
    "U";
  return source.trim().charAt(0).toUpperCase();
}

function displayNameFrom(profile, user) {
  return (
    profile?.display_name ||
    profile?.name ||
    profile?.first_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "EventLayer User"
  );
}

function firstNameFrom(displayName) {
  return displayName.trim().split(/\s+/)[0] || "";
}

function normalizeList(value) {
  return Array.isArray(value)
    ? value.map((item) => String(item).trim()).filter(Boolean)
    : [];
}

function normalizeSavedEvents(json) {
  if (Array.isArray(json?.data)) return json.data;
  if (Array.isArray(json?.data?.events)) return json.data.events;
  if (Array.isArray(json?.data?.saved_events)) return json.data.saved_events;
  return [];
}

function normalizeSubmissions(json) {
  if (Array.isArray(json?.data)) return json.data;
  if (Array.isArray(json?.data?.submissions)) return json.data.submissions;
  return [];
}

function loadLocalSubmissions() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(SUBMISSION_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function normalizeLocalSubmission(item = {}) {
  return {
    id: item.id || item.event_url,
    event_url: item.event_url || item.url || "",
    title: item.title || item.event_title || item.event_url || "Submitted link",
    note: item.note || null,
    status: item.status || "received",
    submitted_at: item.submitted_at || item.created_at || null,
    reviewed_at: item.reviewed_at || null,
    event_id: item.event_id || null,
    event: item.event || null,
    source: "local",
  };
}

function mergeSubmissions(primary = [], secondary = []) {
  const map = new Map();

  for (const item of [...secondary, ...primary]) {
    const key = String(item?.event_url || item?.id || "").trim();
    if (!key) continue;
    const previous = map.get(key);
    const current = {
      ...previous,
      ...item,
      event_url: item?.event_url || previous?.event_url || "",
      title:
        item?.title || previous?.title || item?.event_url || "Submitted link",
      status: item?.status || previous?.status || "received",
    };
    map.set(key, current);
  }

  return Array.from(map.values());
}

function submissionStatusLabel(status) {
  const value = String(status || "received");
  if (value === "added") return "Added to feed";
  if (value === "queued") return "Queued for review";
  if (value === "rejected") return "Rejected";
  return "Received";
}

function submissionStatusTone(status) {
  const value = String(status || "received");
  if (value === "added")
    return "border-emerald-500/20 bg-emerald-500/10 text-emerald-200";
  if (value === "queued")
    return "border-amber-500/20 bg-amber-500/10 text-amber-200";
  if (value === "rejected")
    return "border-red-500/20 bg-red-500/10 text-red-200";
  return "border-white/10 bg-white/5 text-gray-300";
}

function toggleValue(list, value) {
  return list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value];
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, session, loading: authLoading, initialized } = useUser();
  const [activeSession, setActiveSession] = useState(null);
  const [sessionResolved, setSessionResolved] = useState(false);
  const [activeTab, setActiveTab] = useState("saved");
  const [profile, setProfile] = useState(null);
  const [savedEvents, setSavedEvents] = useState([]);
  const [submittedEvents, setSubmittedEvents] = useState([]);
  const [localSubmittedEvents, setLocalSubmittedEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [form, setForm] = useState({
    display_name: "",
    first_name: "",
    bio: "",
    city: "Mumbai",
    interests: [],
    platforms_followed: [],
    profile_picture_url: "",
    digest_enabled: true,
  });

  const displayName = useMemo(
    () => displayNameFrom(profile, user),
    [profile, user],
  );
  const publicProfilePath = user?.id ? `/u/${user.id}` : null;

  const platformsFollowedCount = useMemo(() => {
    const value = profile?.platforms_followed;
    if (Array.isArray(value)) return value.length;
    if (typeof value === "number") return value;
    return 0;
  }, [profile]);

  const displayedSubmittedEvents = useMemo(
    () => mergeSubmissions(submittedEvents, localSubmittedEvents),
    [submittedEvents, localSubmittedEvents],
  );

  useEffect(() => {
    let cancelled = false;

    async function loadDirectSession() {
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();
      if (cancelled) return;
      setActiveSession(currentSession || null);
      setSessionResolved(true);
    }

    loadDirectSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setActiveSession(nextSession || null);
      setSessionResolved(true);
    });

    return () => {
      cancelled = true;
      subscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!sessionResolved || authLoading) return;
    if (!activeSession) {
      router.replace("/login?redirect=/profile");
    }
  }, [sessionResolved, authLoading, activeSession, router]);

  useEffect(() => {
    const token = activeSession?.access_token || session?.access_token;
    if (!token) return;

    let cancelled = false;

    async function loadProfile() {
      setLoading(true);
      setError("");

      try {
        const headers = {
          Authorization: `Bearer ${token}`,
        };
        const [profileResponse, savedResponse, submissionsResponse] =
          await Promise.all([
            fetch("/api/profile", { headers }),
            fetch("/api/saved", { headers }),
            fetch("/api/submissions", { headers }),
          ]);
        const [profileJson, savedJson, submissionJson] = await Promise.all([
          profileResponse.json(),
          savedResponse.json(),
          submissionsResponse.json(),
        ]);

        if (cancelled) return;

        if (!profileResponse.ok || profileJson?.error) {
          throw new Error(profileJson?.error || "Could not load profile.");
        }

        const nextProfile = profileJson?.data?.profile || {};
        const nextName = displayNameFrom(nextProfile, user);
        setProfile(nextProfile);
        setForm({
          display_name: nextName,
          first_name: nextProfile.first_name || firstNameFrom(nextName),
          bio: nextProfile.bio || "",
          city: nextProfile.city || "Mumbai",
          interests: Array.isArray(nextProfile.interests)
            ? nextProfile.interests
            : [],
          platforms_followed: normalizeList(nextProfile.platforms_followed),
          profile_picture_url: nextProfile.profile_picture_url || "",
          digest_enabled: nextProfile.digest_enabled !== false,
        });

        if (savedResponse.ok && !savedJson?.error) {
          setSavedEvents(normalizeSavedEvents(savedJson));
        } else {
          setSavedEvents([]);
        }

        if (submissionsResponse.ok && !submissionJson?.error) {
          setSubmittedEvents(normalizeSubmissions(submissionJson));
        } else {
          setSubmittedEvents([]);
        }
      } catch (loadError) {
        if (!cancelled) setError(loadError.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, [activeSession?.access_token, session?.access_token, user]);

  useEffect(() => {
    const localSubmissions = loadLocalSubmissions().map(
      normalizeLocalSubmission,
    );
    if (!localSubmissions.length) return;

    let cancelled = false;

    async function reconcileLocalSubmissions() {
      try {
        const urls = localSubmissions
          .map((item) => item.event_url)
          .filter(Boolean);
        let matchedEvents = [];

        if (urls.length) {
          const { data } = await supabase
            .from("events")
            .select("id, event_url, title")
            .in("event_url", urls);

          matchedEvents = Array.isArray(data) ? data : [];
        }

        const matchedMap = new Map(
          matchedEvents.map((event) => [String(event.event_url), event]),
        );

        const reconciled = localSubmissions.map((item) => {
          const matched = matchedMap.get(String(item.event_url));
          if (matched) {
            return {
              ...item,
              title: item.title || matched.title || item.event_url,
              status: "added",
              event_id: matched.id,
              event: matched,
            };
          }
          return item;
        });

        if (!cancelled) {
          setLocalSubmittedEvents(reconciled);
        }
      } catch {
        if (!cancelled) {
          setLocalSubmittedEvents(localSubmissions);
        }
      }
    }

    reconcileLocalSubmissions();

    return () => {
      cancelled = true;
    };
  }, []);

  function updateForm(field, value) {
    setSuccess("");
    setError("");
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function uploadProfilePicture() {
    if (!selectedFile || !user?.id) return form.profile_picture_url;

    const extension = selectedFile.name.split(".").pop() || "jpg";
    const filePath = `${user.id}/${Date.now()}.${extension}`;

    // TODO: Ensure a public Supabase Storage bucket named "profile-pictures"
    // exists. If your project uses a different bucket, change it here.
    const { error: uploadError } = await supabase.storage
      .from("profile-pictures")
      .upload(filePath, selectedFile, { upsert: true });

    if (uploadError) {
      throw new Error(
        `Profile picture upload failed: ${uploadError.message}. Configure the profile-pictures storage bucket or save without changing the image.`,
      );
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("profile-pictures").getPublicUrl(filePath);

    return publicUrl;
  }

  async function savePreferences() {
    const token = activeSession?.access_token || session?.access_token;
    if (!token) return;

    setSaving(true);
    setSuccess("");
    setError("");

    try {
      const profilePictureUrl = await uploadProfilePicture();
      const payload = {
        display_name: form.display_name,
        first_name: form.first_name || firstNameFrom(form.display_name),
        bio: form.bio,
        city: form.city,
        interests: form.interests,
        platforms_followed: form.platforms_followed,
        profile_picture_url: profilePictureUrl,
        digest_enabled: form.digest_enabled,
      };

      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const json = await response.json();

      if (!response.ok || json?.error) {
        throw new Error(json?.error || "Could not save profile.");
      }

      const nextProfile = json?.data?.profile || { ...profile, ...payload };
      setProfile(nextProfile);
      setForm((current) => ({
        ...current,
        profile_picture_url:
          nextProfile.profile_picture_url || profilePictureUrl,
        platforms_followed: normalizeList(nextProfile.platforms_followed),
      }));
      setSelectedFile(null);
      setSuccess("Profile updated.");
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  }

  if (
    !initialized ||
    authLoading ||
    !sessionResolved ||
    loading ||
    !activeSession
  ) {
    return (
      <main className="min-h-screen text-white">
        <Navbar />
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="h-56 animate-pulse rounded-[32px] border border-white/10 bg-white/5" />
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="h-28 animate-pulse rounded-3xl border border-white/10 bg-white/5" />
            <div className="h-28 animate-pulse rounded-3xl border border-white/10 bg-white/5" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen pb-24 text-white">
      <Navbar />

      <div className="mx-auto max-w-6xl px-6 py-10 md:py-14">
        <section className="rounded-[32px] border border-white/10 bg-[#0a0c12]/90 p-6 shadow-[0_24px_100px_rgba(0,0,0,0.35)] md:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="relative h-24 w-24 shrink-0 rounded-full border border-white/10 bg-gradient-to-br from-[#ff6a00] via-[#ff3d81] to-[#6d5dfc] p-1 shadow-[0_0_45px_rgba(255,77,0,0.25)]">
                <div className="h-full w-full overflow-hidden rounded-full bg-[#0a0c12]">
                  {profile?.profile_picture_url ? (
                    <img
                      src={profile.profile_picture_url}
                      alt={displayName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-orange-500 via-pink-500 to-purple-600 text-4xl font-black text-white">
                      {initialsFrom(profile, user)}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-black uppercase tracking-[0.25em] text-orange-500">
                  Profile
                </p>
                <h1 className="text-3xl font-black tracking-tight md:text-5xl">
                  {displayName}
                </h1>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-gray-400">
                  <span>{profile?.city || "City not set"}</span>
                  {user?.email && (
                    <>
                      <span className="h-1 w-1 rounded-full bg-white/20" />
                      <span>{user.email}</span>
                    </>
                  )}
                  {Array.isArray(profile?.interests) &&
                    profile.interests.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {profile.interests.slice(0, 5).map((interest) => (
                          <span
                            key={interest}
                            className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-orange-300"
                          >
                            {interest}
                          </span>
                        ))}
                      </div>
                    )}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveTab("preferences")}
              className="rounded-full border border-white/10 bg-white/5 px-6 py-3 text-xs font-black uppercase tracking-[0.2em] text-white transition-colors hover:bg-white/10"
            >
              Edit Profile
            </button>
            {publicProfilePath ? (
              <Link
                href={publicProfilePath}
                className="rounded-full border border-orange-500/20 bg-orange-500/10 px-6 py-3 text-xs font-black uppercase tracking-[0.2em] text-orange-300 transition-colors hover:bg-orange-500/20"
              >
                View Public Profile
              </Link>
            ) : null}
          </div>
        </section>

        <section className="mt-6">
          <p className="mb-4 text-[10px] font-black uppercase tracking-[0.3em] text-orange-500">
            Your hub
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {hubLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-2xl border border-white/10 bg-white/5 p-4 transition-colors hover:border-orange-500/30 hover:bg-orange-500/5"
              >
                <p className="text-sm font-black text-white">{item.label}</p>
                <p className="mt-1 text-xs text-gray-500">{item.desc}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#0f1724] to-[#0a0c12] p-6 shadow-[0_16px_60px_rgba(0,0,0,0.25)]">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-gray-500">
              Events Saved
            </p>
            <p className="mt-3 text-4xl font-black text-white">
              {savedEvents.length}
            </p>
            <p className="mt-2 text-sm text-gray-500">
              Events you bookmarked to revisit later.
            </p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#0f1724] to-[#0a0c12] p-6 shadow-[0_16px_60px_rgba(0,0,0,0.25)]">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-gray-500">
              Platforms Followed
            </p>
            <p className="mt-3 text-4xl font-black text-white">
              {platformsFollowedCount}
            </p>
            <p className="mt-2 text-sm text-gray-500">
              Powers better recommendations in Explore.
            </p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#0f1724] to-[#0a0c12] p-6 shadow-[0_16px_60px_rgba(0,0,0,0.25)]">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-gray-500">
              Event Submissions
            </p>
            <p className="mt-3 text-4xl font-black text-white">
              {displayedSubmittedEvents.length}
            </p>
            <p className="mt-2 text-sm text-gray-500">
              Links you sent and their review state.
            </p>
          </div>
        </section>

        <section className="mt-8">
          <div className="inline-flex rounded-full border border-white/10 bg-white/5 p-1">
            {[
              ["saved", "Saved Events"],
              ["submissions", "My Submissions"],
              ["preferences", "Preferences"],
            ].map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTab(key)}
                className={`rounded-full px-5 py-3 text-xs font-black uppercase tracking-[0.18em] transition-colors ${
                  activeTab === key
                    ? "bg-orange-500 text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        {error && (
          <p className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </p>
        )}
        {success && (
          <p className="mt-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            {success}
          </p>
        )}

        {activeTab === "saved" && (
          <section className="mt-8">
            {savedEvents.length ? (
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                {savedEvents.map((event) => (
                  <EventCard
                    key={event.id || event.event_url}
                    event={event}
                    isSaved
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-[32px] border border-white/10 bg-[#0a0c12]/80 p-10 text-center">
                <h2 className="text-2xl font-black tracking-tight">
                  No saved events yet
                </h2>
                <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-gray-500">
                  Start exploring events and save the ones you do not want to
                  miss.
                </p>
                <Link
                  href="/events"
                  className="mt-8 inline-flex rounded-full bg-orange-500 px-7 py-3 text-xs font-black uppercase tracking-[0.2em] text-white transition-colors hover:bg-orange-600"
                >
                  Explore events
                </Link>
              </div>
            )}
          </section>
        )}

        {activeTab === "submissions" && (
          <section className="mt-8">
            {displayedSubmittedEvents.length ? (
              <div className="grid gap-4 lg:grid-cols-2">
                {displayedSubmittedEvents.map((submission) => (
                  <article
                    key={submission.id || submission.event_url}
                    className="rounded-[28px] border border-white/10 bg-[#0a0c12]/90 p-5 shadow-[0_16px_60px_rgba(0,0,0,0.2)]"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-gray-500">
                          Submitted link
                        </p>
                        <h3 className="mt-2 text-lg font-black tracking-tight text-white">
                          {submission.title || submission.event_url}
                        </h3>
                      </div>
                      <span
                        className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] ${submissionStatusTone(submission.status)}`}
                      >
                        {submissionStatusLabel(submission.status)}
                      </span>
                    </div>

                    <a
                      href={submission.event_url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-4 block break-all text-sm text-orange-300 transition-colors hover:text-orange-200"
                    >
                      {submission.event_url}
                    </a>

                    {submission.note ? (
                      <p className="mt-4 text-sm leading-relaxed text-gray-400">
                        {submission.note}
                      </p>
                    ) : null}

                    <div className="mt-5 flex flex-wrap items-center gap-2 text-[11px] font-medium text-gray-500">
                      <span>
                        Sent{" "}
                        {submission.submitted_at
                          ? new Date(submission.submitted_at).toLocaleString()
                          : "recently"}
                      </span>
                      {submission.event_id ? (
                        <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-emerald-200">
                          Added to website
                        </span>
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="rounded-[32px] border border-white/10 bg-[#0a0c12]/80 p-10 text-center">
                <h2 className="text-2xl font-black tracking-tight">
                  No submissions yet
                </h2>
                <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-gray-500">
                  When you submit a link, it will appear here with its review
                  status.
                </p>
                <Link
                  href="/submit"
                  className="mt-8 inline-flex rounded-full bg-orange-500 px-7 py-3 text-xs font-black uppercase tracking-[0.2em] text-white transition-colors hover:bg-orange-600"
                >
                  Submit a link
                </Link>
              </div>
            )}
          </section>
        )}

        {activeTab === "preferences" && (
          <section className="mt-8 rounded-[32px] border border-white/10 bg-[#0a0c12]/90 p-6 md:p-8">
            <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
              <div>
                <h2 className="text-2xl font-black tracking-tight">
                  Preferences
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-gray-500">
                  Tune your profile so EventLayer can keep the right events
                  close.
                </p>
              </div>

              <div className="space-y-6">
                <label className="block">
                  <span className="mb-2 block text-xs font-black uppercase tracking-[0.2em] text-gray-400">
                    Display name
                  </span>
                  <input
                    value={form.display_name}
                    onChange={(event) =>
                      updateForm("display_name", event.target.value)
                    }
                    className="h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-white outline-none focus:border-orange-500/70"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-xs font-black uppercase tracking-[0.2em] text-gray-400">
                    First name
                  </span>
                  <input
                    value={form.first_name}
                    onChange={(event) =>
                      updateForm("first_name", event.target.value)
                    }
                    className="h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-white outline-none focus:border-orange-500/70"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-xs font-black uppercase tracking-[0.2em] text-gray-400">
                    Bio
                  </span>
                  <textarea
                    value={form.bio}
                    onChange={(event) => updateForm("bio", event.target.value)}
                    rows={3}
                    maxLength={280}
                    placeholder="Builder in Mumbai. Into AI hackathons and meetups."
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-orange-500/70"
                  />
                </label>

                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={form.digest_enabled}
                    onChange={(event) =>
                      updateForm("digest_enabled", event.target.checked)
                    }
                    className="h-4 w-4 rounded border-white/20"
                  />
                  <span className="text-xs font-bold uppercase tracking-widest text-gray-400">
                    Weekly digest emails & alerts
                  </span>
                </label>

                <label className="block">
                  <span className="mb-2 block text-xs font-black uppercase tracking-[0.2em] text-gray-400">
                    City
                  </span>
                  <select
                    value={form.city}
                    onChange={(event) => updateForm("city", event.target.value)}
                    className="h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-white outline-none focus:border-orange-500/70"
                  >
                    {cityOptions.map((city) => (
                      <option key={city} value={city} className="bg-[#0a0c12]">
                        {city}
                      </option>
                    ))}
                  </select>
                </label>

                <div>
                  <span className="mb-3 block text-xs font-black uppercase tracking-[0.2em] text-gray-400">
                    Interests
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {interestOptions.map((interest) => {
                      const selected = form.interests.includes(interest);
                      return (
                        <button
                          key={interest}
                          type="button"
                          onClick={() =>
                            updateForm(
                              "interests",
                              toggleValue(form.interests, interest),
                            )
                          }
                          className={`rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors ${
                            selected
                              ? "border-orange-500 bg-orange-500 text-white"
                              : "border-white/10 bg-white/5 text-gray-400 hover:text-white"
                          }`}
                        >
                          {interest}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <span className="mb-3 block text-xs font-black uppercase tracking-[0.2em] text-gray-400">
                    Platforms followed
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {platformOptions.map((platform) => {
                      const selected =
                        form.platforms_followed.includes(platform);
                      return (
                        <button
                          key={platform}
                          type="button"
                          onClick={() =>
                            updateForm(
                              "platforms_followed",
                              toggleValue(form.platforms_followed, platform),
                            )
                          }
                          className={`rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors ${
                            selected
                              ? "border-orange-500 bg-orange-500 text-white"
                              : "border-white/10 bg-white/5 text-gray-400 hover:text-white"
                          }`}
                        >
                          {platform}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <label className="block">
                  <span className="mb-2 block text-xs font-black uppercase tracking-[0.2em] text-gray-400">
                    Profile picture URL
                  </span>
                  <input
                    value={form.profile_picture_url}
                    onChange={(event) =>
                      updateForm("profile_picture_url", event.target.value)
                    }
                    placeholder="https://..."
                    className="h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-white outline-none placeholder:text-gray-600 focus:border-orange-500/70"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-xs font-black uppercase tracking-[0.2em] text-gray-400">
                    Upload profile picture
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) =>
                      setSelectedFile(event.target.files?.[0] || null)
                    }
                    className="block w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-gray-300 file:mr-4 file:rounded-full file:border-0 file:bg-orange-500 file:px-4 file:py-2 file:text-xs file:font-black file:uppercase file:tracking-widest file:text-white"
                  />
                  {form.profile_picture_url && !selectedFile && (
                    <p className="mt-2 text-xs text-gray-500">
                      Current image is saved on your profile.
                    </p>
                  )}
                  {selectedFile && (
                    <p className="mt-2 text-xs text-gray-500">
                      Selected: {selectedFile.name}
                    </p>
                  )}
                </label>

                <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-gradient-to-br from-orange-500 via-pink-500 to-purple-600 text-lg font-black text-white">
                      {initialsFrom(profile, user)}
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">
                        Preview
                      </p>
                      <p className="mt-1 text-sm text-gray-300">
                        {form.display_name || displayName}
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={savePreferences}
                  disabled={saving}
                  className="rounded-full bg-orange-500 px-8 py-3 text-xs font-black uppercase tracking-[0.2em] text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save Preferences"}
                </button>
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
