"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function OrganizerRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/admin/login");
  }, [router]);
  return null;
}
