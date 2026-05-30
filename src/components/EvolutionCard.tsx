import type { EchoEvolution } from "@/lib/types";
import { evolutionCard } from "@/lib/uiPoetics";
import { MelodyView } from "./MelodyView";

type EvolutionCardProps = {
  evolution: EchoEvolution;
  echoName: string;
};

export function EvolutionCard({ evolution, echoName }: EvolutionCardProps) {
  return (
    <article className="py-6">
      <p className="font-body text-xs uppercase text-text-muted">
        {evolutionCard.eyebrow(evolution.sourceEchoHash)}
      </p>
      <p className="mt-4 font-display text-[32px] leading-[38px] tracking-[-0.02em] lg:text-[40px] lg:leading-[46px]">
        {evolutionCard.lead(echoName)}
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
        {evolution.borrowedFragment ? (
          <p className="mt-3">
            What slipped through:{" "}
            {evolution.borrowedFragment.original.join(" · ")} ··· now dreaming
            toward {evolution.borrowedFragment.transposed.join(" · ")}.
          </p>
        ) : (
          <p className="mt-3">What slipped through is still forming—no fragment snapshot for this exchange.</p>
        )}
      </div>
    </article>
  );
}
