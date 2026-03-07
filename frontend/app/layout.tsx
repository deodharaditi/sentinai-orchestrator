import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SentinAI — AIOps Incident Command",
  description: "State-aware AIOps orchestration — eliminating alert fatigue in real time.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
