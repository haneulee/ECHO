import { AboutContent } from "@/components/AboutContent";
import { AppShell } from "@/components/AppShell";
import { aboutPage } from "@/lib/uiPoetics";

export default function InfoPage() {
  return (
    <AppShell pageTitle={aboutPage.title} viewportLocked>
      <div className="mx-auto min-h-0 w-full max-w-lg flex-1 overflow-y-auto px-1 py-4 sm:py-6">
        <AboutContent />
      </div>
    </AppShell>
  );
}
