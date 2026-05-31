"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "../../components/Navbar";
import { EventCard } from "../../components/EventCard";
import { useUser } from "../../components/AuthProvider";
import { supabase } from "../../supabase/client";

export default function CommunityPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useUser();
  const [following, setFollowing] = useState({ users: [], organizers: [] });
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login?redirect=/community");
      return;
    }

    let cancelled = false;

    async function load() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) return;

      const [followRes, activityRes] = await Promise.all([
        fetch("/api/follow", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/feed?activity=1", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      const followJson = await followRes.json();
      const activityJson = await activityRes.json();
      if (cancelled) return;
      setFollowing(followJson?.data || { users: [], organizers: [] });
      setActivity(activityJson?.data?.activity || []);
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [user, authLoading, router]);

  return (
    <main className="min-h-screen bg-[#030407] text-white">
      <Navbar />
      <div className="mx-auto max-w-6xl px-6 py-12">
        <p className="mb-2 text-[10px] font-black uppercase tracking-[0.3em] text-orange-500">
          Community Following
        </p>
        <h1 className="mb-10 text-4xl font-black tracking-tighter">Your network</h1>

        {loading ? (
          <p className="text-sm text-gray-500">Loading community...</p>
        ) : (
          <div className="grid gap-12 lg:grid-cols-2">
            <section>
              <h2 className="mb-4 text-lg font-black uppercase tracking-tight">
                People you follow
              </h2>
              <div className="space-y-3">
                {following.users?.length ? (
                  following.users.map((u) => (
                    <div
                      key={u.id}
                      className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/2 p-4"
                    >
                      <Link href={`/u/${u.id}`} className="font-bold hover:text-orange-400">
                        {u.display_name || u.name || "Member"}
                      </Link>
                      <span className="text-xs text-gray-500">{u.city || ""}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">
                    Visit public profiles and tap Follow to build your graph.
                  </p>
                )}
              </div>
              <h2 className="mb-4 mt-8 text-lg font-black uppercase tracking-tight">
                Organizers
              </h2>
              <div className="flex flex-wrap gap-2">
                {(following.organizers || []).map((o) => (
                  <span
                    key={o.slug}
                    className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold capitalize"
                  >
                    {o.name}
                  </span>
                ))}
              </div>
            </section>

            <section>
              <h2 className="mb-4 text-lg font-black uppercase tracking-tight">
                Friend activity
              </h2>
              <div className="space-y-6">
                {activity.length ? (
                  activity.map((item, i) => (
                    <div key={`${item.event?.id}-${i}`} className="space-y-2">
                      <p className="text-xs text-gray-500">
                        <span className="font-bold text-white">
                          {item.user?.display_name || item.user?.name || "Someone"}
                        </span>{" "}
                        saved an event
                      </p>
                      {item.event && <EventCard event={item.event} />}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">
                    Activity from people you follow appears here.
                  </p>
                )}
              </div>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
