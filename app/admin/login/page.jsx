"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  HARDCODED_ADMIN_EMAIL,
  HARDCODED_ADMIN_PASSWORD,
} from "../../../src/features/auth/adminCredentials.js";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState(HARDCODED_ADMIN_EMAIL);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetMsg, setResetMsg] = useState("");

  useEffect(() => {
    fetch("/api/admin/login")
      .then((r) => r.json())
      .then((json) => {
        if (json?.data?.email) setEmail(json.data.email);
      })
      .catch(() => {});
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResetMsg("");

    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email: email.trim(), password }),
    });
    const json = await res.json();
    setLoading(false);

    if (!res.ok || json?.error) {
      setError(json?.error || "Login failed");
      return;
    }

    router.replace("/admin");
    router.refresh();
  }

  function useDefaultPassword() {
    setPassword(HARDCODED_ADMIN_PASSWORD);
    setResetMsg(`Default password applied: ${HARDCODED_ADMIN_PASSWORD}`);
    setTimeout(() => setResetMsg(""), 4000);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#030407] px-6 text-white">
      <div className="w-full max-w-md rounded-[40px] border border-orange-500/20 bg-[#0a0c12] p-10 shadow-2xl">
        <p className="mb-2 text-[10px] font-black uppercase tracking-[0.35em] text-orange-500">
          EventLayer Platform
        </p>
        <h1 className="text-3xl font-black tracking-tighter">Admin login</h1>
        <p className="mt-3 text-sm text-gray-500">
          Platform creator access. Default password is{" "}
          <code className="text-orange-400">{HARDCODED_ADMIN_PASSWORD}</code>
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <label className="block">
            <span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-gray-500">
              Admin email
            </span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={HARDCODED_ADMIN_EMAIL}
              className="h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 outline-none focus:border-orange-500/60"
            />
          </label>
          <label className="block">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                Password
              </span>
              <button
                type="button"
                onClick={useDefaultPassword}
                className="text-[10px] font-black uppercase tracking-widest text-orange-400 hover:text-orange-300"
              >
                Reset password
              </button>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 outline-none focus:border-orange-500/60"
            />
          </label>
          {resetMsg && (
            <p className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
              {resetMsg}
            </p>
          )}
          {error && (
            <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-orange-500 py-4 text-[10px] font-black uppercase tracking-[0.25em] text-white hover:bg-orange-600 disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Enter dashboard"}
          </button>
        </form>

        <Link
          href="/"
          className="mt-6 block text-center text-xs font-bold uppercase tracking-widest text-gray-600 hover:text-white"
        >
          ← Back to site
        </Link>
      </div>
    </main>
  );
}
