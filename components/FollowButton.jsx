"use client";

import { useState } from "react";
import { supabase } from "../supabase/client";

export function FollowButton({
  userId,
  organizer,
  communitySlug,
  communityName,
  initialFollowing = false,
}) {
  const [following, setFollowing] = useState(initialFollowing);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) {
      window.location.href = communitySlug
        ? `/login?redirect=/community/${communitySlug}`
        : "/login";
      return;
    }

    const method = following ? "DELETE" : "POST";
    let body;
    if (communitySlug) {
      body = { community_slug: communitySlug };
    } else if (organizer) {
      body = following ? { organizer_slug: organizer } : { organizer };
    } else {
      body = { following_id: userId };
    }

    const res = await fetch("/api/follow", {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    setLoading(false);
    if (!res.ok || json?.error) return;
    setFollowing(!following);
  }

  const label = communityName
    ? following
      ? "Following"
      : "Follow community"
    : following
      ? "Following"
      : "Follow";

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={loading}
      className={`rounded-full px-5 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${
        following
          ? "border border-white/20 bg-white/5 text-gray-300"
          : "bg-orange-500 text-white hover:bg-orange-600"
      }`}
    >
      {loading ? "..." : label}
    </button>
  );
}
