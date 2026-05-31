import { LegalPage, LegalSection } from "../../../components/LegalPage";

export const metadata = {
  title: "About EventLayer.dev",
  description: "How EventLayer collects and presents tech events in one place.",
};

export default function AboutPage() {
  return (
    <LegalPage
      eyebrow="About"
      title="One place to discover tech events"
      description="EventLayer brings together events from multiple platforms so people can browse, search, and save opportunities without checking every source separately."
      lastUpdated="May 2026"
    >
      <LegalSection title="What EventLayer does">
        <p>
          We aggregate public event listings from supported platforms, normalize
          the details, and present them in a single feed for faster discovery.
        </p>
        <p>
          The product is designed for builders, founders, students, and
          communities that want a cleaner way to find meetups, hackathons,
          workshops, and conferences.
        </p>
      </LegalSection>

      <LegalSection title="How the app works">
        <p>
          Visitors can browse events without creating an account. Signing in is
          only required for saved events, reminders, profile preferences, and
          calendar features.
        </p>
        <p>
          Event pages link back to the original source so registration always
          happens on the platform that published the event.
        </p>
      </LegalSection>

      <LegalSection title="What to expect next">
        <p>
          EventLayer is intentionally lightweight. As the product grows, we may
          add richer filters, smarter recommendations, and better location-aware
          discovery.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
