import type { Metadata } from "next";
import { Averia_Libre } from "next/font/google";
import "./globals.css";

import { NavigationLoadingProvider } from "@/components/NavigationLoadingProvider";

const averia = Averia_Libre({
  subsets: ["latin"],
  weight: ["300", "400", "700"],
  style: ["normal", "italic"],
  variable: "--font-averia",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Echo, A sonic companion for co-presence",
    template: "%s / Echo",
  },
  description:
    "Echo is a companion device that reacts to the presence of its peers through sound. Released as three different types, each has its own temperament expressed through sonic identity. When alone, it remains quiet. As two or more devices share proximity, they start playing sound in harmony thanks to layered tones and shifting rhythms. Echo somehow reflects the subtle sense of connection that can emerge when real-life encounters happen. It transforms physical proximity into a playful collective experience. Over time, encounters leave traces within each Echo companions. At the end of the day, users place it on its station, where moments of co-presence recorded during the day are transferred into a digital interface to revisit over time an evolving archive of sound memories displayed as audio-reactive visual landscapes. Echo invites us to explore how subtle moments of co-presence can gradually become a sense of connection.",
  icons: {
    icon: [
      {
        url: "/brand/echo_favicon.ico",
        type: "image/x-icon",
        sizes: "any",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html className={averia.variable} lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <NavigationLoadingProvider>{children}</NavigationLoadingProvider>
      </body>
    </html>
  );
}
