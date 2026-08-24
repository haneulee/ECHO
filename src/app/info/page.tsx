import type { Metadata } from "next";

import { AboutContent } from "@/components/AboutContent";
import { AppShell } from "@/components/AppShell";
import { aboutPage } from "@/lib/uiPoetics";

export const metadata: Metadata = {
  title: aboutPage.title,
};

export default function InfoPage() {
  return (
    <AppShell fullBleed pageTitle={aboutPage.title} viewportLocked>
      <div className="about-page-shell mx-auto min-h-0 w-full max-w-[92rem] flex-1 px-6 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-2 sm:px-10 sm:pb-20 lg:px-16">
        <AboutContent variant="page" />
      </div>
    </AppShell>
  );
}
