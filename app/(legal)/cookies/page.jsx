import { LegalPage, LegalSection } from "../../../components/LegalPage";

export const metadata = {
  title: "Cookie Policy | EventLayer.dev",
  description: "How EventLayer uses cookies and local storage.",
};

export default function CookiesPage() {
  return (
    <LegalPage
      eyebrow="Cookie Policy"
      title="How cookies and storage are used"
      description="This page explains the browser storage used by EventLayer and the settings that depend on it."
      lastUpdated="May 2026"
    >
      <LegalSection title="Essential cookies">
        <p>
          Essential cookies or similar session storage are used to keep you
          signed in, protect authenticated requests, and maintain basic site
          functionality.
        </p>
      </LegalSection>

      <LegalSection title="Preferences and local storage">
        <p>
          We store a small amount of data in your browser to remember saved
          reminders, submission history, and other non-sensitive preferences.
        </p>
      </LegalSection>

      <LegalSection title="Analytics">
        <p>
          We may use analytics or performance tooling to understand page
          reliability, traffic patterns, and feature usage. This helps us keep
          the site fast and useful.
        </p>
      </LegalSection>

      <LegalSection title="Managing storage">
        <p>
          You can clear cookies and local storage through your browser settings.
          Doing so may sign you out or reset preferences stored on the device.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
