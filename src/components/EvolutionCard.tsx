import type { EchoEvolution } from "@/lib/types";
import { MelodyView } from "./MelodyView";

type EvolutionCardProps = {
  evolution: EchoEvolution;
};

export function EvolutionCard({ evolution }: EvolutionCardProps) {
  return (
    <article className="py-6">
      <p className="font-body text-xs uppercase tracking-[0.28em] text-text-muted">
        Fragment exchange · {evolution.sourceEchoHash}
      </p>
      <p className="mt-4 font-display text-[32px] leading-[38px] tracking-[-0.02em] lg:text-[40px] lg:leading-[46px]">
        A nearby Echo stayed long enough for Namu to borrow a small turn of
        melody.
      </p>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <MelodyView label="Before" melody={evolution.beforeState.melody} />
        <MelodyView label="After" melody={evolution.afterState.melody} />
      </div>

      <div className="mt-6 max-w-2xl font-body text-sm leading-5 text-text-muted">
        <p>
          Triggered by {evolution.trigger.durationSec} seconds in very close
          proximity, with average closeness{" "}
          {evolution.trigger.closenessAvg.toFixed(2)}.
        </p>
        <p className="mt-3">
          Borrowed fragment: {evolution.borrowedFragment.original.join(" · ")}{" "}
          became {evolution.borrowedFragment.transposed.join(" · ")}.
        </p>
      </div>
    </article>
  );
}
