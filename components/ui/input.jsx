"use client";

import { forwardRef } from "react";

const Input = forwardRef(function Input(
  { className = "", type = "text", ...props },
  ref,
) {
  return (
    <input
      type={type}
      className={`flex h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-gray-500 outline-none transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium focus:border-orange-500/60 focus:ring-2 focus:ring-orange-500/10 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      ref={ref}
      {...props}
    />
  );
});

export { Input };
