import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OpsPilot - Factory Operations AI Co-Pilot",
  description:
    "Grounded RAG assistant for factory operators. Answers strictly from approved procedures, enforces LOTO safety protocols, and drafts tickets for human sign-off.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased min-h-screen bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
