import Link from "next/link";
import { Navbar } from "../../components/Navbar";

export default function LegalLayout({ children }) {
  return (
    <main className="min-h-screen bg-[#030407] text-white">
      <Navbar />

      <div className="mx-auto w-full max-w-6xl px-6 py-12 sm:py-16">
        {children}
      </div>
    </main>
  );
}
