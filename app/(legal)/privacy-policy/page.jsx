import { LegalPage, LegalSection } from "../../../components/LegalPage";

export const metadata = {
  title: "Privacy Policy | EventLayer.dev",
  description: "How EventLayer collects, uses, and protects personal data.",
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      eyebrow="Privacy Policy"
      title="How we handle your data"
      description="This page explains what information EventLayer collects, why we use it, and the choices available to you."
      lastUpdated="May 2026"
    >
      <LegalSection title="Information we collect">
        <p>
          We collect information you provide directly, such as your name, email,
          city, interests, saved events, and submissions.
        </p>
        <p>
          We also process technical data needed to run the site, including
          session information, device and browser details, and basic usage logs.
        </p>
      </LegalSection>

      <LegalSection title="How we use information">
        <p>
          We use data to provide the event feed, manage accounts, personalize
          recommendations, save preferences, power reminders, and prevent abuse.
        </p>
        <p>
          We may also use it to improve the product, debug errors, and measure
          how the site is performing.
        </p>
      </LegalSection>

      <LegalSection title="Third-party services">
        <p>
          EventLayer relies on third-party services such as Supabase for auth
          and storage, hosting providers for deployment, and analytics tools for
          performance and usage measurement.
        </p>
        <p>
          Event links redirect to the original source platform. Those platforms
          may collect information under their own policies.
        </p>
      </LegalSection>

      <LegalSection title="Cookies and local storage">
        <p>
          We use cookies and browser storage for core login and session
          functionality, plus saved preferences such as reminders and local
          submission history.
        </p>
      </LegalSection>

      <LegalSection title="Your choices">
        <p>
          You can browse the site without signing in. You can also clear local
          storage in your browser, sign out at any time, or contact us about
          access or deletion requests.
        </p>
        <p>
          If you need a copy of your data or want us to remove it, use the
          contact page and include the email address associated with your
          account.
        </p>
      </LegalSection>

      <LegalSection title="Contact">
        <p>
          For privacy questions, use the contact page. If you are requesting
          account or event data changes, include enough detail for us to locate
          the relevant record.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
