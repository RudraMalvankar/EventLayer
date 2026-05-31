"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "../../components/Navbar";
import { useUser } from "../../components/AuthProvider";
import { supabase } from "../../supabase/client";

export default function NotificationsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useUser();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login?redirect=/notifications");
      return;
    }

    async function load() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) return;

      const res = await fetch("/api/notifications", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      setItems(json?.data?.notifications || []);
      setLoading(false);

      await fetch("/api/notifications", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });
    }

    load();
  }, [user, authLoading, router]);

  return (
    <main className="min-h-screen bg-[#030407] text-white">
      <Navbar />
      <div className="mx-auto max-w-2xl px-6 py-12">
        <p className="mb-2 text-[10px] font-black uppercase tracking-[0.3em] text-orange-500">
          Notification Layer
        </p>
        <h1 className="mb-10 text-4xl font-black tracking-tighter">Notifications</h1>

        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : items.length ? (
          <ul className="space-y-3">
            {items.map((n) => (
              <li
                key={n.id}
                className={`rounded-2xl border p-5 ${
                  n.read_at
                    ? "border-white/5 bg-white/2"
                    : "border-orange-500/30 bg-orange-500/5"
                }`}
              >
                <p className="font-bold">{n.title}</p>
                {n.body && (
                  <p className="mt-1 text-sm text-gray-400">{n.body}</p>
                )}
                {n.link && (
                  <Link
                    href={n.link}
                    className="mt-3 inline-block text-xs font-bold uppercase tracking-widest text-orange-400"
                  >
                    Open →
                  </Link>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">
            You&apos;re all caught up. Digests and saves will notify you here.
          </p>
        )}
      </div>
    </main>
  );
}
