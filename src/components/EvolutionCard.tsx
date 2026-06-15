import type { EchoEvolution, EchoType } from "@/lib/types";
import {
  evolutionMelodyNotes,
  evolutionSourceLabel,
  formatBorrowedFragment,
} from "@/lib/evolutionDisplay";
import { evolutionCard } from "@/lib/uiPoetics";
import { MelodyView } from "./MelodyView";

type EvolutionCardProps = {
  evolution: EchoEvolution;
  echoName: string;
  deviceEchoType: EchoType;
};

export function EvolutionCard({
  evolution,
  echoName,
  deviceEchoType = "shy",
}: EvolutionCardProps) {
  const beforeMelody = evolutionMelodyNotes(evolution.beforeState, deviceEchoType);
  const afterMelody = evolutionMelodyNotes(evolution.afterState, deviceEchoType);
  const borrowed = formatBorrowedFragment(
    evolution.borrowedFragment,
    evolution.sourceEchoType,
    deviceEchoType,
  );

  return (
    <article className="py-6">
      <p className="font-body text-xs uppercase text-text-muted">
        {evolutionCard.eyebrow(evolutionSourceLabel(evolution))}
      </p>
      <p className="mt-4 font-display text-[32px] leading-[38px] tracking-[-0.02em] lg:text-[40px] lg:leading-[46px]">
        {evolutionCard.lead(echoName)}
      </p>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <MelodyView
          label={evolutionCard.melodyBefore}
          melody={beforeMelody}
        />
        <MelodyView
          label={evolutionCard.melodyAfter}
          melody={afterMelody}
        />
      </div>

      <div className="mt-6 max-w-2xl font-body text-sm leading-5 text-text-muted">
        <p>
          After {evolution.trigger.durationSec} seconds near another Echo, one
          melody slot borrowed from the peer&apos;s type motif and shifted into
          place.
        </p>
        {evolution.borrowedFragment ? (
          <p className="mt-3">
            What slipped through: {borrowed.original.join(" · ")} ··· now dreaming
            toward {borrowed.transposed.join(" · ")}.
          </p>
        ) : (
          <p className="mt-3">What slipped through is still forming—no fragment snapshot for this exchange.</p>
        )}
      </div>
    </article>
  );
}
