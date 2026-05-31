import { LegalPage, LegalSection } from "../../../components/LegalPage";

export const metadata = {
  title: "Accessibility Statement | EventLayer.dev",
  description: "How EventLayer approaches accessibility and usability.",
};

export default function AccessibilityPage() {
  return (
    <LegalPage
      eyebrow="Accessibility"
      title="Designed to be usable by more people"
      description="EventLayer aims to provide a clear, keyboard-friendly experience and continue improving accessibility over time."
      lastUpdated="May 2026"
    >
      <LegalSection title="Current approach">
        <p>
          We use semantic page structure, readable color contrast, keyboard
          focus states, and responsive layouts so the site works across screen
          sizes and input methods.
        </p>
      </LegalSection>

      <LegalSection title="Known limitations">
        <p>
          Some third-party event embeds or external platforms may not fully meet
          our accessibility standards because they are controlled by other
          services.
        </p>
      </LegalSection>

      <LegalSection title="Ongoing improvements">
        <p>
          We continue to review navigation, headings, labels, and interactive
          elements as the product grows.
        </p>
      </LegalSection>

      <LegalSection title="Need help?">
        <p>
          If you encounter an accessibility barrier, use the contact page and
          describe the page or interaction that needs attention.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
