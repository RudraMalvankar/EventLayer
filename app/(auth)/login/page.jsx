"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useState } from "react";
import { Navbar } from "../../../components/Navbar";
import { Input } from "../../../components/ui/input";
import { supabase } from "../../../supabase/client";

function getRedirectPath(value) {
  if (!value || !value.startsWith("/")) return "/events";
  if (value.startsWith("//")) return "/events";
  return value;
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = getRedirectPath(searchParams.get("redirect"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);

  async function handleSignIn(event) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const { data, error: signInError } = await supabase.auth.signInWithPassword(
      {
        email,
        password,
      },
    );

    setLoading(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }

    // If a session exists, check profile completeness and route to onboarding if needed
    const session =
      data?.session || (await supabase.auth.getSession()).data?.session;

    if (session?.access_token) {
      try {
        const resp = await fetch("/api/profile", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const json = await resp.json();

        const profile = json?.data?.profile || null;
        const needsOnboarding =
          !profile ||
          !profile.city ||
          !Array.isArray(profile.interests) ||
          profile.interests.length === 0;

        if (needsOnboarding) {
          const target = `/onboarding?redirect=${encodeURIComponent(redirectTo)}`;
          router.push(target);
          router.refresh();
          return;
        }
      } catch (err) {
        // If profile fetch fails, fall back to redirect
      }
    }

    router.push(redirectTo);
    router.refresh();
  }

  async function handleGithubSignIn() {
    setError("");
    setOauthLoading(true);

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${window.location.origin}/onboarding?redirect=${encodeURIComponent(redirectTo)}`,
      },
    });

    if (oauthError) {
      setError(oauthError.message);
      setOauthLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#070a11] px-6 pb-16 pt-0 text-white">
      <Navbar />
      <section className="mx-auto mt-8 w-full max-w-sm rounded-2xl border border-white/10 bg-[#0a0c12]/90 p-6 shadow-2xl">
        <Link
          href="/"
          className="mb-8 inline-block text-xl font-black tracking-tighter text-white"
        >
          EventLayer<span className="text-orange-500">.dev</span>
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-black tracking-tight">Sign in</h1>
          <p className="mt-2 text-sm text-gray-500">
            Continue to your EventLayer account.
          </p>
        </div>

        <form onSubmit={handleSignIn} className="space-y-4">
          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-gray-400">
              Email
            </span>
            <Input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-gray-400">
              Password
            </span>
            <Input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>

          {error && (
            <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-orange-500 px-5 py-3 text-xs font-black uppercase tracking-[0.2em] text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="my-6 flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-gray-600">
          <div className="h-px flex-1 bg-white/10" />
          Or
          <div className="h-px flex-1 bg-white/10" />
        </div>

        <button
          type="button"
          onClick={handleGithubSignIn}
          disabled={oauthLoading}
          className="flex w-full items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-xs font-black uppercase tracking-[0.2em] text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <svg
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 .5C5.7.5.5 5.7.5 12c0 5 3.2 9.3 7.6 10.8.6.1.8-.2.8-.5v-1.9c-3.1.7-3.7-1.5-3.7-1.5-.5-1.3-1.1-1.7-1.1-1.7-.9-.6.1-.6.1-.6 1 .1 1.6 1 1.6 1 .9 1.6 2.4 1.1 3 .9.1-.6.4-1.1.7-1.4-2.5-.3-5.1-1.2-5.1-5.3 0-1.2.4-2.2 1-3-.1-.3-.5-1.6.1-3.2 0 0 .8-.2 2.5 1a8.4 8.4 0 0 1 4.6 0c1.7-1.2 2.5-1 2.5-1 .6 1.6.2 2.9.1 3.2.6.8 1 1.8 1 3 0 4.1-2.6 5-5.1 5.3.4.3.8 1 .8 2v3c0 .3.2.6.8.5A11.5 11.5 0 0 0 23.5 12C23.5 5.7 18.3.5 12 .5Z" />
          </svg>
          {oauthLoading ? "Connecting..." : "Continue with GitHub"}
        </button>

        <p className="mt-6 text-center text-sm text-gray-500">
          New here?{" "}
          <Link href="/signup" className="font-bold text-orange-500">
            Create an account
          </Link>
        </p>
      </section>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen px-6 py-16 text-white flex items-center justify-center">
          <section className="h-96 w-full max-w-sm animate-pulse rounded-2xl border border-white/10 bg-white/5" />
        </main>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
