import "./globals.css";
import { DM_Sans, Cormorant_Garamond } from "next/font/google";

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
        {children}
      </body>
    </html>
  );
}
