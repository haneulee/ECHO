import { ArchiveCarousel } from "@/components/ArchiveCarousel";
import { AppShell } from "@/components/AppShell";
import { mockArchive } from "@/lib/mockData";
import { archiveHero } from "@/lib/uiPoetics";

export default function ArchivePage() {
  return (
    <>
      <AppShell
        eyebrow={archiveHero.eyebrow}
        title={archiveHero.title}
        viewportLocked
      >
        <ArchiveCarousel memories={mockArchive} />
      </AppShell>
    </>
  );
}
