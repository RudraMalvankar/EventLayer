"use client";

import { FollowButton } from "./FollowButton";

export function CommunityFollowButton({ slug, name }) {
  return <FollowButton communitySlug={slug} communityName={name} />;
}