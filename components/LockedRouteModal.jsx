"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function LockedRouteModal({
  isOpen,
  onClose,
  title,
  body,
  buttonLabel = "Sign in to continue",
  redirectPath,
}) {
  const router = useRouter();

  useEffect(() => {
    function onKey(event) {
      if (event.key === "Escape") onClose?.();
    }

    if (isOpen) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  function handleSignIn() {
    router.push(`/login?redirect=${encodeURIComponent(redirectPath || "/")}`);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 sm:px-6 top-96 ">
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-black/60"
        onClick={() => onClose?.()}
      />

      <div className="relative z-10 w-full max-w-md translate-y-6 max-h-[calc(100vh-3rem)] overflow-y-auto rounded-[28px] border border-white/10 bg-[#0a0c12] p-6 shadow-[0_30px_100px_rgba(0,0,0,0.45)] sm:translate-y-0 sm:max-h-[calc(100vh-4rem)] sm:p-7">
        <div className="mb-4 inline-flex rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em] text-orange-500">
          Locked feature
        </div>
        <h3 className="text-2xl font-black tracking-tight text-white">
          {title}
        </h3>
        <p className="mt-3 text-sm leading-relaxed text-gray-400">{body}</p>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={handleSignIn}
            className="flex-1 rounded-full bg-orange-500 px-5 py-3 text-xs font-black uppercase tracking-[0.2em] text-white transition-colors hover:bg-orange-600"
          >
            {buttonLabel}
          </button>
          <button
            type="button"
            onClick={() => onClose?.()}
            className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-xs font-black uppercase tracking-[0.2em] text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
