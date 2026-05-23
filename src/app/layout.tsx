import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ECHO",
  description:
    "A small companion that reacts to the presence of other Echoes through sound",
  icons: {
    icon: [
      { url: "/brand/gradation-favicon.png", type: "image/png", sizes: "512x512" },
    ],
  },
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
