import Link from "next/link";
import { LegalPage, LegalSection } from "../../../components/LegalPage";

export const metadata = {
  title: "Contact | EventLayer.dev",
  description: "Ways to reach the EventLayer team.",
};

const contactOptions = [
  {
    label: "Submit an event",
    href: "/submit",
    body: "Send a link you want added to the feed.",
  },
  {
    label: "Profile and saved events",
    href: "/saved",
    body: "Check your saved list or sign in to manage your account.",
  },
  {
    label: "Accessibility or privacy request",
    href: "/privacy-policy",
    body: "Use the policy pages as the entry point for data requests and issues.",
  },
];

export default function ContactPage() {
  return (
    <LegalPage
      eyebrow="Contact"
      title="How to reach the right place"
      description="EventLayer is a product-first site, so the quickest way to get help is usually through the relevant in-app page."
      lastUpdated="May 2026"
    >
      <LegalSection title="Best ways to get help">
        <div className="grid gap-4 md:grid-cols-3">
          {contactOptions.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-[20px] border border-white/10 bg-[#030407]/60 p-4 transition-colors hover:border-orange-500/30 hover:bg-white/5"
            >
              <div className="text-sm font-black uppercase tracking-[0.18em] text-white">
                {item.label}
              </div>
              <p className="mt-3 text-sm leading-relaxed text-gray-400">
                {item.body}
              </p>
            </Link>
          ))}
        </div>
      </LegalSection>

      <LegalSection title="Before you send a request">
        <p>
          Include the page URL, the account email if relevant, and a short
          description of what you want changed. That makes it much faster to
          resolve.
        </p>
      </LegalSection>

      <LegalSection title="If you are just browsing">
        <p>
          You can always continue exploring events on the main feed, search for
          specific topics, or submit a link from the top navigation.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
