import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SentinAI — Autonomous Incident Response",
  description: "State-aware AIOps orchestration — eliminating alert fatigue in real time.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
