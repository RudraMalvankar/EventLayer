"use client";

import { useState } from "react";
import { supabase } from "../supabase/client";

export function FollowButton({
  userId,
  organizer,
  communitySlug,
  communityName,
  initialFollowing = false,
  variant = "solid",
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
      : variant === "ghost"
        ? "Follow"
        : "Follow community"
    : following
      ? "Following"
      : "Follow";

  const base =
    "rounded-lg px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider transition-all disabled:opacity-50";
  const styles =
    variant === "ghost"
      ? following
        ? `${base} border border-white/10 bg-white/[0.04] text-gray-400`
        : `${base} border border-orange-500/30 bg-orange-500/10 text-orange-400 hover:border-orange-500/50 hover:bg-orange-500/15`
      : following
        ? `${base} border border-white/20 bg-white/5 text-gray-300`
        : `${base} bg-orange-500 text-white hover:bg-orange-600`;

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={loading}
      className={styles}
    >
      {loading ? "..." : label}
    </button>
  );
}
