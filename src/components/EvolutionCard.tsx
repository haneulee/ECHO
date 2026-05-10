import type { EchoEvolution } from "@/lib/types";
import { mockEchoDevice } from "@/lib/mockData";
import { evolutionCard } from "@/lib/uiPoetics";
import { MelodyView } from "./MelodyView";

type EvolutionCardProps = {
  evolution: EchoEvolution;
};

export function EvolutionCard({ evolution }: EvolutionCardProps) {
  return (
    <article className="py-6">
      <p className="font-body text-xs uppercase tracking-[0.28em] text-text-muted">
        {evolutionCard.eyebrow(evolution.sourceEchoHash)}
      </p>
      <p className="mt-4 font-display text-[32px] leading-[38px] tracking-[-0.02em] lg:text-[40px] lg:leading-[46px]">
        {evolutionCard.lead(mockEchoDevice.echoName)}
      </p>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <MelodyView
          label={evolutionCard.melodyBefore}
          melody={evolution.beforeState.melody}
        />
        <MelodyView
          label={evolutionCard.melodyAfter}
          melody={evolution.afterState.melody}
        />
      </div>

      <div className="mt-6 max-w-2xl font-body text-sm leading-5 text-text-muted">
        <p>
          That long a hold—{evolution.trigger.durationSec} seconds—was enough
          for two patterns to forget where one ends.
        </p>
        <p className="mt-3">
          What slipped through:{" "}
          {evolution.borrowedFragment.original.join(" · ")} ··· now dreaming
          toward {evolution.borrowedFragment.transposed.join(" · ")}.
        </p>
      </div>
    </article>
  );
}
