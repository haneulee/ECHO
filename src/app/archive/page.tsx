import { AppShell } from "@/components/AppShell";
import { MemoryCard } from "@/components/MemoryCard";
import { mockArchive } from "@/lib/mockData";

export default function ArchivePage() {
  return (
    <AppShell
      eyebrow="Archive"
      intro="Past days are kept as soft stains, each one a remembered pattern of proximity."
      title="Days held in sound."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {mockArchive.map((memory) => (
          <MemoryCard key={memory.id} memory={memory} />
        ))}
      </div>
    </AppShell>
  );
}
