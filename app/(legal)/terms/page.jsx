import { LegalPage, LegalSection } from "../../../components/LegalPage";

export const metadata = {
  title: "Terms of Service | EventLayer.dev",
  description: "Rules and expectations for using EventLayer.",
};

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Terms of Service"
      title="The rules for using EventLayer"
      description="By using the site, you agree to these terms, which cover access, account use, and the limits of our service."
      lastUpdated="May 2026"
    >
      <LegalSection title="Using the service">
        <p>
          You may browse event listings, search the site, save events, and
          submit event links for review, as long as you follow applicable laws
          and do not abuse the service.
        </p>
      </LegalSection>

      <LegalSection title="Accounts and submissions">
        <p>
          If you create an account, you are responsible for keeping it secure
          and for the accuracy of the information you provide.
        </p>
        <p>
          Event submissions may be reviewed, edited, or rejected before they are
          added to the public feed.
        </p>
      </LegalSection>

      <LegalSection title="Event information">
        <p>
          EventLayer aggregates information from third-party sources. We do not
          control those platforms, their pricing, their registration flows, or
          whether an event is changed, postponed, or canceled.
        </p>
        <p>
          Always confirm event details on the original source before attending
          or paying for anything.
        </p>
      </LegalSection>

      <LegalSection title="Acceptable use">
        <p>
          Do not scrape the site aggressively, attempt to bypass access controls,
          submit malicious links, or interfere with the normal operation of the
          product.
        </p>
      </LegalSection>

      <LegalSection title="Service changes">
        <p>
          We may modify, suspend, or discontinue features at any time. We may
          also update these terms when the product changes.
        </p>
      </LegalSection>

      <LegalSection title="Disclaimer">
        <p>
          The service is provided on an as-is basis without warranties of any
          kind. To the extent allowed by law, EventLayer is not responsible for
          losses caused by third-party event platforms or inaccurate source data.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
