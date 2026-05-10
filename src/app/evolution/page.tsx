import { AppShell } from "@/components/AppShell";
import { EvolutionCard } from "@/components/EvolutionCard";
import { mockEchoDevice, mockEvolutions } from "@/lib/mockData";
import { evolutionPageHero } from "@/lib/uiPoetics";

export default function EvolutionPage() {
  return (
    <AppShell
      eyebrow={evolutionPageHero.eyebrow}
      intro={evolutionPageHero.intro}
      title={evolutionPageHero.title(mockEchoDevice.echoName)}
    >
      <div className="grid gap-4 lg:grid-cols-2">
        {mockEvolutions.map((evolution) => (
          <EvolutionCard evolution={evolution} key={evolution.id} />
        ))}
      </div>
    </AppShell>
  );
}
