"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useState } from "react";
import { Navbar } from "../../../components/Navbar";
import { Input } from "../../../components/ui/input";
import { supabase } from "../../../supabase/client";
import { authCallbackUrl } from "../../../src/shared/config/siteUrl.js";

function getRedirectPath(value) {
  if (!value || !value.startsWith("/")) return "/events";
  if (value.startsWith("//")) return "/events";
  return value;
}

function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = getRedirectPath(searchParams.get("redirect"));
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSignup(event) {
    event.preventDefault();
    setError("");
    setNotice("");
    setLoading(true);

    const { data, error: signupError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          name: form.name,
        },
        emailRedirectTo: authCallbackUrl("/login"),
      },
    });

    if (signupError) {
      setError(signupError.message);
      setLoading(false);
      return;
    }

    const accessToken = data?.session?.access_token;
    if (accessToken) {
      setLoading(false);
      const target = `/onboarding?redirect=${encodeURIComponent(redirectTo)}`;
      router.push(target);
      router.refresh();
      return;
    }

    setLoading(false);
    setNotice(
      "Account created. Please verify your email and sign in to finish your profile.",
    );
  }

  async function handleGithubSignup() {
    setError("");
    setNotice("");
    setOauthLoading(true);

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${authCallbackUrl("/onboarding")}?redirect=${encodeURIComponent(redirectTo)}`,
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
          <h1 className="text-3xl font-black tracking-tight">Create account</h1>
          <p className="mt-2 text-sm text-gray-500">
            Create your account now and finish setup on the next screen (city
            and interests).
          </p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-gray-400">
              Name
            </span>
            <Input
              autoComplete="name"
              value={form.name}
              onChange={(event) => updateField("name", event.target.value)}
              required
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-gray-400">
              Email
            </span>
            <Input
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(event) => updateField("email", event.target.value)}
              required
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-gray-400">
              Password
            </span>
            <Input
              type="password"
              autoComplete="new-password"
              minLength={6}
              value={form.password}
              onChange={(event) => updateField("password", event.target.value)}
              required
            />
          </label>

          {error && (
            <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </p>
          )}
          {notice && (
            <p className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
              {notice}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-orange-500 px-5 py-3 text-xs font-black uppercase tracking-[0.2em] text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Creating..." : "Sign up"}
          </button>
        </form>

        <div className="my-6 flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-gray-600">
          <div className="h-px flex-1 bg-white/10" />
          Or
          <div className="h-px flex-1 bg-white/10" />
        </div>

        <button
          type="button"
          onClick={handleGithubSignup}
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
          Already have an account?{" "}
          <Link href="/login" className="font-bold text-orange-500">
            Sign in
          </Link>
        </p>
      </section>
    </main>
  );
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen px-6 py-16 text-white flex items-center justify-center">
          <section className="h-[560px] w-full max-w-sm animate-pulse rounded-2xl border border-white/10 bg-white/5" />
        </main>
      }
    >
      <SignupContent />
    </Suspense>
  );
}
