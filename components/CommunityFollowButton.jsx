"use client";

import { FollowButton } from "./FollowButton";

export function CommunityFollowButton({ slug, name, variant }) {
  return (
    <FollowButton
      communitySlug={slug}
      communityName={name}
      variant={variant}
    />
  );
}
