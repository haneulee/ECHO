import { ArchiveCarousel } from "@/components/ArchiveCarousel";
import { AppShell } from "@/components/AppShell";
import { mockArchive } from "@/lib/mockData";

export default function ArchivePage() {
  return (
    <AppShell
      eyebrow="Archive"
      intro="Past days are kept as soft stains, each one a remembered pattern of proximity."
      title="Days held in sound."
    >
      <ArchiveCarousel memories={mockArchive} />
    </AppShell>
  );
}
