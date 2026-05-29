"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useState } from "react";
import { Input } from "../../../components/ui/input";
import { supabase } from "../../../supabase/client";

const cities = ["Mumbai", "Bangalore", "Pune", "Delhi", "Other"];
const interestOptions = ["AI", "Web3", "Mobile", "Cloud", "Startup", "Design"];

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
    city: "Mumbai",
    interests: [],
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function toggleInterest(interest) {
    setForm((current) => {
      const hasInterest = current.interests.includes(interest);
      return {
        ...current,
        interests: hasInterest
          ? current.interests.filter((item) => item !== interest)
          : [...current.interests, interest],
      };
    });
  }

  async function handleSignup(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const { data, error: signupError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          name: form.name,
          city: form.city,
          interests: form.interests,
        },
      },
    });

    if (signupError) {
      setError(signupError.message);
      setLoading(false);
      return;
    }

    const userId = data?.user?.id;
    if (!userId) {
      setError("Account created, but the user profile could not be resolved.");
      setLoading(false);
      return;
    }

    const { error: profileError } = await supabase.from("profiles").insert({
      id: userId,
      name: form.name,
      city: form.city,
      interests: form.interests,
    });

    setLoading(false);

    if (profileError) {
      setError(profileError.message);
      return;
    }

    router.push(redirectTo);
    router.refresh();
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
            Tell EventLayer what you want to discover.
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

          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-gray-400">
              City
            </span>
            <select
              value={form.city}
              onChange={(event) => updateField("city", event.target.value)}
              className="h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition-colors focus:border-orange-500/60 focus:ring-2 focus:ring-orange-500/10"
            >
              {cities.map((city) => (
                <option key={city} value={city} className="bg-[#0a0c12]">
                  {city}
                </option>
              ))}
            </select>
          </label>

          <fieldset>
            <legend className="mb-2 block text-xs font-bold uppercase tracking-widest text-gray-400">
              Interests
            </legend>
            <div className="grid grid-cols-2 gap-2">
              {interestOptions.map((interest) => {
                const selected = form.interests.includes(interest);
                return (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => toggleInterest(interest)}
                    className={`rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors ${
                      selected
                        ? "border-orange-500 bg-orange-500 text-white"
                        : "border-white/10 bg-white/5 text-gray-400 hover:text-white"
                    }`}
                  >
                    {interest}
                  </button>
                );
              })}
            </div>
          </fieldset>

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
