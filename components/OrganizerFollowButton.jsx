"use client";

import { FollowButton } from "./FollowButton";

export function OrganizerFollowButton({ organizerName }) {
  if (!organizerName) return null;
  const slug = String(organizerName)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return <FollowButton organizer={slug} />;
}
