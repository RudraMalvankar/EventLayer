import Link from "next/link";

const productLinks = [
  { label: "Events", href: "/events" },
  { label: "My Feed", href: "/feed" },
  { label: "Community", href: "/community" },
  { label: "Weekly Digest", href: "/digest" },
  { label: "Explore", href: "/explore" },
  { label: "Submit", href: "/submit" },
  { label: "Saved", href: "/saved" },
];

const legalLinks = [
  { label: "About", href: "/about" },
  { label: "Privacy", href: "/privacy-policy" },
  { label: "Terms", href: "/terms" },
  { label: "Cookies", href: "/cookies" },
  { label: "Accessibility", href: "/accessibility" },
  { label: "Contact", href: "/contact" },
];

export function Footer() {
  return (
    <footer className="border-t border-white/5 bg-[#030407] px-6 py-12">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 sm:flex-row sm:justify-between">
        <div className="max-w-sm space-y-4">
          <div className="text-lg font-black tracking-tighter text-white">
            EventLayer<span className="text-orange-500">.dev</span>
          </div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-gray-600 leading-relaxed">
            Unified tech event discovery for builders, communities, and teams.
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-2">
          <div className="space-y-4">
            <div className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-500">
              Product
            </div>
            {productLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block text-xs font-bold uppercase tracking-widest text-gray-500 transition-colors hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="space-y-4">
            <div className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-500">
              Legal
            </div>
            {legalLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block text-xs font-bold uppercase tracking-widest text-gray-500 transition-colors hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto mt-10 flex w-full max-w-6xl flex-col items-start justify-between gap-3 border-t border-white/5 pt-8 sm:flex-row sm:items-center">
        <div className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-700">
          © 2026 EVENTLAYER.DEV
        </div>
        <div className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-700">
          Built for the Mumbai Ecosystem
        </div>
      </div>
    </footer>
  );
}
