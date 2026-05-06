import { AppShell } from "@/components/AppShell";
import { EvolutionCard } from "@/components/EvolutionCard";
import { mockEvolutions } from "@/lib/mockData";

export default function EvolutionPage() {
  return (
    <AppShell
      eyebrow="Evolution"
      intro="When two Echoes remain very close, tiny melodic fragments can cross between them."
      title="What Namu kept."
    >
      <div className="grid gap-4 lg:grid-cols-2">
        {mockEvolutions.map((evolution) => (
          <EvolutionCard evolution={evolution} key={evolution.id} />
        ))}
      </div>
    </AppShell>
  );
}
