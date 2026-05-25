import type { Metadata } from "next";
import { Averia_Serif_Libre } from "next/font/google";
import "./globals.css";

const averia = Averia_Serif_Libre({
  subsets: ["latin"],
  weight: ["300", "400", "700"],
  style: ["normal", "italic"],
  variable: "--font-averia",
  display: "swap",
});

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
    <html className={averia.variable} lang="en">
      <body>{children}</body>
    </html>
  );
}
