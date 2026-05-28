"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Navbar() {
  const pathname = usePathname();

  const navItems = [
    { label: "Events", href: "/events" },
    { label: "Explore", href: "/explore" },
    { label: "Saved", href: "/saved" },
  ];

  return (
    <nav className="sticky top-0 z-50 glass border-b border-white/5">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-10">
          <Link href="/" className="text-xl font-black tracking-tighter text-white">
            EVENT<span className="text-orange-500">LAYER</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-xs font-bold uppercase tracking-widest transition-all duration-200 ${
                  pathname === item.href ? "text-orange-500" : "text-gray-400 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-xs font-bold uppercase tracking-widest px-6 py-2.5 rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all duration-300"
          >
            Sign In
          </Link>
        </div>
      </div>
    </nav>
  );
}
