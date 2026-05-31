import { AboutContent } from "@/components/AboutContent";
import { AppShell } from "@/components/AppShell";
import { aboutPage } from "@/lib/uiPoetics";

export default function InfoPage() {
  return (
    <AppShell pageTitle={aboutPage.title} viewportLocked>
      <div className="mx-auto w-full max-w-6xl flex-1 overflow-y-auto px-4 py-6 sm:px-8 sm:py-10">
        <AboutContent variant="page" />
      </div>
    </AppShell>
  );
}
