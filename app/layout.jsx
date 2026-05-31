import "./globals.css";
import { DM_Sans, Cormorant_Garamond } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { AuthProvider } from "../components/AuthProvider";
import { Footer } from "../components/Footer";

const sans = DM_Sans({ subsets: ["latin"] });
const serif = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
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
          {children}
          <Footer />
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
