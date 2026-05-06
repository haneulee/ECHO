import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Echo",
  description: "A poetic archive of proximity for a sound-reactive companion.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
