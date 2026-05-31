"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Navbar } from "../../components/Navbar";
import { EventCard } from "../../components/EventCard";
import { CommunityCard } from "../../components/CommunityCard";
import { useUser } from "../../components/AuthProvider";
import { supabase } from "../../supabase/client";

export default function CommunityPage() {
  const { user, loading: authLoading } = useUser();
  const [communities, setCommunities] = useState([]);
  const [following, setFollowing] = useState({ users: [], organizers: [], communities: [] });
  const [followedEvents, setFollowedEvents] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const communitiesRes = await fetch("/api/communities?city=Mumbai");
      const communitiesJson = await communitiesRes.json();
      if (!cancelled) {
        setCommunities(communitiesJson?.data?.communities || []);
      }

      if (authLoading) return;

      if (user) {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (token && !cancelled) {
          const [followRes, activityRes, followedRes] = await Promise.all([
            fetch("/api/follow", { headers: { Authorization: `Bearer ${token}` } }),
            fetch("/api/feed?activity=1", {
              headers: { Authorization: `Bearer ${token}` },
            }),
            fetch("/api/communities?followed=1", {
              headers: { Authorization: `Bearer ${token}` },
            }),
          ]);
          const followJson = await followRes.json();
          const activityJson = await activityRes.json();
          const followedJson = await followedRes.json();
          if (!cancelled) {
            setFollowing({
              users: followJson?.data?.users || [],
              organizers: followJson?.data?.organizers || [],
              communities: followedJson?.data?.communities || [],
            });
            setFollowedEvents(followedJson?.data?.events || []);
            setActivity(activityJson?.data?.activity || []);
          }
        }
      }

      if (!cancelled) setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  return (
    <main className="min-h-screen bg-[#030407] text-white">
      <Navbar />
      <div className="mx-auto max-w-6xl px-6 py-12">
        <p className="mb-2 text-[10px] font-black uppercase tracking-[0.3em] text-orange-500">
          Mumbai Communities
        </p>
        <h1 className="mb-3 text-4xl font-black tracking-tighter">
          Discover & follow
        </h1>
        <p className="mb-10 max-w-2xl text-sm text-gray-500">
          eChai, GDG Cloud Mumbai, PyMumbai, Null, and more — events are matched
          from scraped Luma, Devfolio, Meetup, and Unstop feeds.
        </p>

        {loading ? (
          <p className="text-sm text-gray-500">Loading communities...</p>
        ) : (
          <>
            <section className="mb-16">
              <h2 className="mb-6 text-lg font-black uppercase tracking-tight">
                Active in Mumbai ({communities.length})
              </h2>
              <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {communities.map((c) => (
                  <CommunityCard key={c.slug} community={c} />
                ))}
              </div>
            </section>

            {user && (
              <div className="grid gap-12 lg:grid-cols-2">
                <section>
                  <h2 className="mb-4 text-lg font-black uppercase tracking-tight">
                    Communities you follow
                  </h2>
                  {following.communities?.length ? (
                    <div className="space-y-3">
                      {following.communities.map((c) => (
                        <Link
                          key={c.slug}
                          href={`/community/${c.slug}`}
                          className="block rounded-2xl border border-orange-500/20 bg-orange-500/5 p-4 font-bold hover:border-orange-500/40"
                        >
                          {c.name}
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">
                      Follow communities above to see their events in your feed.
                    </p>
                  )}

                  {followedEvents.length > 0 && (
                    <>
                      <h3 className="mb-4 mt-8 text-sm font-black uppercase tracking-widest text-gray-400">
                        Events from followed communities
                      </h3>
                      <div className="space-y-6">
                        {followedEvents.slice(0, 6).map((ev) => (
                          <div key={ev.id} className="space-y-1">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-orange-400">
                              {ev.community_name}
                            </p>
                            <EventCard event={ev} />
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </section>

                <section>
                  <h2 className="mb-4 text-lg font-black uppercase tracking-tight">
                    People & friend activity
                  </h2>
                  <div className="mb-6 space-y-2">
                    {(following.users || []).map((u) => (
                      <Link
                        key={u.id}
                        href={`/u/${u.id}`}
                        className="block rounded-xl border border-white/5 bg-white/2 px-4 py-3 text-sm font-bold hover:text-orange-400"
                      >
                        {u.display_name || u.name}
                      </Link>
                    ))}
                  </div>
                  <div className="space-y-6">
                    {activity.slice(0, 5).map((item, i) => (
                      <div key={`${item.event?.id}-${i}`} className="space-y-2">
                        <p className="text-xs text-gray-500">
                          <span className="font-bold text-white">
                            {item.user?.display_name || item.user?.name || "Someone"}
                          </span>{" "}
                          saved an event
                        </p>
                        {item.event && <EventCard event={item.event} />}
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            )}

            {!user && (
              <p className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-gray-400">
                <Link href="/login?redirect=/community" className="text-orange-400 hover:underline">
                  Sign in
                </Link>{" "}
                to follow communities and sync events to your personalized feed.
              </p>
            )}
          </>
        )}
      </div>
    </main>
  );
}
