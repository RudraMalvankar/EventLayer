"use client";

import { FollowButton } from "./FollowButton";

export function PublicProfileActions({ userId }) {
  return <FollowButton userId={userId} />;
}
