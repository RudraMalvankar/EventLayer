"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useState } from "react";
import { Input } from "../../../components/ui/input";
import { supabase } from "../../../supabase/client";

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

  return (
    <main className="min-h-screen px-6 py-16 text-white flex items-center justify-center">
      <section className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#0a0c12]/90 p-6 shadow-2xl">
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
