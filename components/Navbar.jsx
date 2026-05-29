"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useUser } from "./AuthProvider";
import { supabase } from "../supabase/client";

function getInitials(user) {
  const name =
    user?.user_metadata?.name ||
    user?.user_metadata?.full_name ||
    user?.email ||
    "";
  const parts = name
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2);

  return parts.map((part) => part[0]?.toUpperCase()).join("") || "U";
}

function AuthMenu({ mobile = false, onNavigate }) {
  const router = useRouter();
  const { user, loading } = useUser();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleOutsideClick(event) {
      if (!menuRef.current?.contains(event.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    setOpen(false);
    onNavigate?.();
    router.push("/");
    router.refresh();
  }

  if (loading) {
    return (
      <div
        className={
          mobile
            ? "h-10 w-full animate-pulse rounded-full bg-white/10"
            : "h-10 w-24 animate-pulse rounded-full bg-white/10"
        }
      />
    );
  }

  if (!user) {
    return (
      <Link
        href="/login"
        onClick={onNavigate}
        className={
          mobile
            ? "block rounded-full bg-white/5 px-5 py-3 text-center text-xs font-bold uppercase tracking-widest text-white transition-colors hover:bg-white/10"
            : "text-xs font-bold uppercase tracking-widest px-6 py-2.5 rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all duration-300"
        }
      >
        Sign in
      </Link>
    );
  }

  const displayName =
    user?.user_metadata?.name || user?.user_metadata?.full_name || "Account";

  if (mobile) {
    return (
      <div className="space-y-2 border-t border-white/10 pt-4">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-500 text-xs font-black text-white">
            {getInitials(user)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-white">
              {user.user_metadata?.name || user.email}
            </p>
            <p className="truncate text-xs text-gray-500">{user.email}</p>
          </div>
        </div>
        <Link
          href="/profile"
          onClick={onNavigate}
          className="block rounded-xl px-4 py-3 text-sm font-bold text-gray-300 hover:bg-white/5 hover:text-white"
        >
          Profile
        </Link>
        <Link
          href="/saved"
          onClick={onNavigate}
          className="block rounded-xl px-4 py-3 text-sm font-bold text-gray-300 hover:bg-white/5 hover:text-white"
        >
          Saved Events
        </Link>
        <button
          type="button"
          onClick={handleSignOut}
          className="w-full rounded-xl px-4 py-3 text-left text-sm font-bold text-gray-300 hover:bg-white/5 hover:text-white"
        >
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <div className="relative flex items-center gap-3" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="group flex items-center gap-3 rounded-full border border-orange-500/40 bg-orange-500/10 px-2.5 py-1.5 transition-colors hover:bg-orange-500/20"
        aria-expanded={open}
        aria-label="Open user menu"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500 text-xs font-black text-white">
          {getInitials(user)}
        </div>
        <div className="max-w-[140px] text-left">
          <p className="truncate text-xs font-black uppercase tracking-wider text-white">
            {displayName}
          </p>
          <p className="truncate text-[10px] font-bold uppercase tracking-wider text-orange-300">
            Member
          </p>
        </div>
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-52 rounded-2xl border border-white/10 bg-[#0a0c12] p-2 shadow-2xl">
          <Link
            href="/profile"
            onClick={() => setOpen(false)}
            className="block rounded-xl px-4 py-3 text-sm font-bold text-gray-300 hover:bg-white/5 hover:text-white"
          >
            Profile
          </Link>
          <Link
            href="/saved"
            onClick={() => setOpen(false)}
            className="block rounded-xl px-4 py-3 text-sm font-bold text-gray-300 hover:bg-white/5 hover:text-white"
          >
            Saved Events
          </Link>
          <div className="my-2 h-px bg-white/10" />
          <button
            type="button"
            onClick={handleSignOut}
            className="w-full rounded-xl px-4 py-3 text-left text-sm font-bold text-gray-300 hover:bg-white/5 hover:text-white"
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, loading, initialized } = useUser();
  const router = useRouter();

  const navItems = [
    { label: "Events", href: "/events" },
    { label: "Explore", href: "/explore" },
    { label: "Calendar", href: "/calendar" },
    { label: "Saved", href: "/saved" },
  ];

  return (
    <nav className="sticky top-0 z-50 glass border-b border-white/5">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-10">
          <Link
            href="/"
            className="text-xl font-black tracking-tighter text-white"
          >
            EventLayer<span className="text-orange-500">.dev</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <button
                key={item.href}
                type="button"
                onClick={async () => {
                  // Protect certain routes by redirecting to login if no user
                  const needsAuth = ["/profile", "/saved", "/calendar"].includes(item.href);
                  if (!initialized || loading) return;
                  if (needsAuth) {
                    const {
                      data: { session },
                    } = await supabase.auth.getSession();
                    if (!session) {
                      router.push(
                        `/login?redirect=${encodeURIComponent(item.href)}`,
                      );
                      return;
                    }
                  }
                  if (needsAuth && !user) {
                    router.push(
                      `/login?redirect=${encodeURIComponent(item.href)}`,
                    );
                    return;
                  }
                  router.push(item.href);
                }}
                className={`text-xs font-bold uppercase tracking-widest transition-all duration-200 ${
                  pathname === item.href
                    ? "text-orange-500"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="hidden md:flex items-center gap-4">
          <AuthMenu />
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen((current) => !current)}
          className="md:hidden flex h-10 w-10 flex-col items-center justify-center gap-1.5 rounded-full border border-white/10 bg-white/5"
          aria-expanded={mobileOpen}
          aria-label="Toggle navigation"
        >
          <span className="h-0.5 w-4 rounded-full bg-white" />
          <span className="h-0.5 w-4 rounded-full bg-white" />
          <span className="h-0.5 w-4 rounded-full bg-white" />
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-white/5 px-6 py-5">
          <div className="mx-auto max-w-6xl space-y-2">
            {navItems.map((item) => (
              <button
                key={item.href}
                type="button"
                onClick={async () => {
                  setMobileOpen(false);
                  const needsAuth = ["/profile", "/saved", "/calendar"].includes(item.href);
                  if (!initialized || loading) return;
                  if (needsAuth) {
                    const {
                      data: { session },
                    } = await supabase.auth.getSession();
                    if (!session) {
                      router.push(
                        `/login?redirect=${encodeURIComponent(item.href)}`,
                      );
                      return;
                    }
                  }
                  if (needsAuth && !user) {
                    router.push(
                      `/login?redirect=${encodeURIComponent(item.href)}`,
                    );
                    return;
                  }
                  router.push(item.href);
                }}
                className={`block rounded-xl px-4 py-3 text-sm font-bold uppercase tracking-widest transition-colors ${
                  pathname === item.href
                    ? "bg-orange-500/10 text-orange-500"
                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                {item.label}
              </button>
            ))}
            <AuthMenu mobile onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}
    </nav>
  );
}
