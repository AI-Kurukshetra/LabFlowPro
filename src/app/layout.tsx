import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "LabFlow Pro",
    template: "%s | LabFlow Pro",
  },
  description:
    "Must-have laboratory workflow SaaS for patient intake, specimen tracking, result verification, and report release.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="bg-background">
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
