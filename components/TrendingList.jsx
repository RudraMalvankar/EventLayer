"use client";

import { useEffect, useState } from "react";
import { subscribeToSavedEventsUpdated } from "../src/shared/events/refresh";
import { EventCard } from "./EventCard";

export default function TrendingList({ initial = [] }) {
  const [items, setItems] = useState(initial || []);

  async function fetchTrending() {
    try {
      const res = await fetch('/api/trending');
      if (!res.ok) return;
      const json = await res.json();
      const events = Array.isArray(json?.data?.events) ? json.data.events : [];
      setItems(events);
    } catch (e) {
      // ignore
    }
  }

  useEffect(() => {
    const unsub = subscribeToSavedEventsUpdated(() => {
      // re-fetch trending when saves change
      fetchTrending();
    });
    return unsub;
  }, []);

  return (
    <>
      {items.length ? (
        items.map((event) => (
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
    </>
  );
}
