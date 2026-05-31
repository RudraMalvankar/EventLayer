import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseAdmin } from "../../../src/shared/clients/supabase.js";
import { PublicProfileActions } from "../../../components/PublicProfileActions";

function displayNameFrom(profile) {
  return (
    profile?.display_name ||
    profile?.name ||
    profile?.first_name ||
    "EventLayer User"
  );
}

function initialsFrom(profile) {
  const source = displayNameFrom(profile);
  return String(source || "U")
    .trim()
    .charAt(0)
    .toUpperCase();
}

function normalizeList(value) {
  return Array.isArray(value)
    ? value.map((item) => String(item).trim()).filter(Boolean)
    : [];
}

async function loadProfile(userId) {
  const [{ data: profile, error: profileError }, savedResult, submittedResult] =
    await Promise.all([
      supabaseAdmin.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabaseAdmin
        .from("saved_events")
        .select("id", { count: "exact", head: false })
        .eq("user_id", userId),
      supabaseAdmin
        .from("event_submissions")
        .select("id", { count: "exact", head: false })
        .eq("user_id", userId),
    ]);

  if (profileError) {
    throw profileError;
  }

  return {
    profile: profile || null,
    savedCount: Array.isArray(savedResult?.data) ? savedResult.data.length : 0,
    submissionCount: Array.isArray(submittedResult?.data)
      ? submittedResult.data.length
      : 0,
  };
}

export default async function PublicProfilePage({ params }) {
  const userId = String(params?.id || "").trim();
  if (!userId) notFound();

  const { profile, savedCount, submissionCount } = await loadProfile(userId);
  if (!profile) notFound();

  const interests = normalizeList(profile.interests);
  const platforms = normalizeList(profile.platforms_followed);
  const city = profile.city || "City not set";
  const displayName = displayNameFrom(profile);
  const initials = initialsFrom(profile);
  const profileUrl = `/u/${userId}`;

  return (
    <main className="min-h-screen pb-24 text-white">
      <div className="mx-auto max-w-5xl px-6 py-12">
        <div className="mb-8 flex items-center justify-between gap-4">
          <Link
            href="/profile"
            className="inline-flex rounded-full border border-white/10 bg-white/5 px-5 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
          >
            Back to profile
          </Link>
          <span className="rounded-full border border-orange-500/20 bg-orange-500/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-orange-300">
            Public profile
          </span>
        </div>

        <section className="rounded-[32px] border border-white/10 bg-[#0a0c12]/90 p-6 shadow-[0_24px_100px_rgba(0,0,0,0.35)] md:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="relative h-24 w-24 shrink-0 rounded-full border border-white/10 bg-gradient-to-br from-[#ff6a00] via-[#ff3d81] to-[#6d5dfc] p-1 shadow-[0_0_45px_rgba(255,77,0,0.25)]">
                <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-[#0a0c12]">
                  {profile?.profile_picture_url ? (
                    <img
                      src={profile.profile_picture_url}
                      alt={displayName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-orange-500 via-pink-500 to-purple-600 text-4xl font-black text-white">
                      {initials}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-black uppercase tracking-[0.25em] text-orange-500">
                  Creator
                </p>
                <h1 className="text-3xl font-black tracking-tight md:text-5xl">
                  {displayName}
                </h1>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-gray-400">
                  <span>{city}</span>
                  <span className="h-1 w-1 rounded-full bg-white/20" />
                  <span>{platforms.length} platforms followed</span>
                </div>
                {profile?.bio && (
                  <p className="mt-4 max-w-xl text-sm leading-relaxed text-gray-400">
                    {profile.bio}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col items-end gap-4">
              <PublicProfileActions userId={userId} />
              <div className="rounded-[24px] border border-white/10 bg-white/5 p-4 text-sm text-gray-300">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-gray-500">
                  Profile link
                </p>
                <p className="mt-2 break-all text-orange-300">{profileUrl}</p>
              </div>
            </div>
          </div>

          <section className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#0f1724] to-[#0a0c12] p-6">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-gray-500">
                Saved Events
              </p>
              <p className="mt-3 text-4xl font-black text-white">
                {savedCount}
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#0f1724] to-[#0a0c12] p-6">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-gray-500">
                Submitted Links
              </p>
              <p className="mt-3 text-4xl font-black text-white">
                {submissionCount}
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#0f1724] to-[#0a0c12] p-6">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-gray-500">
                Interest Tags
              </p>
              <p className="mt-3 text-4xl font-black text-white">
                {interests.length}
              </p>
            </div>
          </section>

          <section className="mt-8 grid gap-8 lg:grid-cols-[1fr_1.1fr]">
            <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-gray-500">
                Interests
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {interests.length ? (
                  interests.map((interest) => (
                    <span
                      key={interest}
                      className="rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-orange-300"
                    >
                      {interest}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No interests added.</p>
                )}
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-gray-500">
                Platforms followed
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {platforms.length ? (
                  platforms.map((platform) => (
                    <span
                      key={platform}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-gray-300"
                    >
                      {platform}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">
                    No followed platforms yet.
                  </p>
                )}
              </div>
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}
