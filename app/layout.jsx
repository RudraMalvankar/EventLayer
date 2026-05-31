import "./globals.css";
import { DM_Sans, Cormorant_Garamond } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { AuthProvider } from "../components/AuthProvider";
import { Footer } from "../components/Footer";
import { AnalyticsTracker } from "../components/AnalyticsTracker";

const sans = DM_Sans({
  subsets: ["latin"],
  display: "swap",
  preload: true,
});
const serif = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  preload: true,
});

export const metadata = {
  title: "EventLayer.dev",
  description: "Unified tech event discovery",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${sans.className} ${serif.variable}`}
        style={{ ["--serif-font"]: serif.style.fontFamily }}
      >
        <AuthProvider>
          <AnalyticsTracker />
          {children}
          <Footer />
        </AuthProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
