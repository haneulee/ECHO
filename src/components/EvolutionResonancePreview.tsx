import type { CSSProperties } from "react";

import type { EchoEvolution } from "@/lib/types";

type EvolutionResonancePreviewProps = {
  evolution: EchoEvolution;
};

function fieldPalette(tone: "before" | "after") {
  return tone === "before"
    ? { large: "bg-[#C9AA73]/55", small: "bg-[#8A8177]/35" }
    : { large: "bg-[#A64D77]/60", small: "bg-[#6B5C6C]/35" };
}

function MelodyField({
  melody,
  tone,
}: {
  melody: string[];
  tone: "before" | "after";
}) {
  const palette = fieldPalette(tone);

  return (
    <div className="relative mt-8 h-52 overflow-hidden">
      {[18, 38, 58, 78].map((top) => (
        <span
          aria-hidden
          className="absolute left-0 right-0 border-t border-dashed border-text/10"
          key={top}
          style={{ top: `${top}%` }}
        />
      ))}
      {melody.map((note, index) => {
        const code = note
          .split("")
          .reduce((sum, char) => sum + char.charCodeAt(0), 0);
        const size = 6 + ((code + index) % 3) * 4;
        return (
          <span
            aria-label={note}
            className={[
              "absolute rounded-full shadow-[0_0_18px_rgba(38,35,31,0.08)]",
              size >= 14 ? palette.large : palette.small,
            ].join(" ")}
            key={`${tone}-${note}-${index}`}
            style={
              {
                height: size,
                left: `${8 + (index / Math.max(1, melody.length - 1)) * 84}%`,
                top: `${16 + ((code + index * 17) % 66)}%`,
                width: size,
              } as CSSProperties
            }
            title={note}
          />
        );
      })}
      {melody.slice(0, 9).map((note, index) => (
        <span
          aria-hidden
          className="absolute h-1 w-1 rounded-full bg-text/20"
          key={`${tone}-${note}-grain-${index}`}
          style={{
            left: `${10 + ((index * 11 + note.length * 7) % 80)}%`,
            top: `${14 + ((index * 19 + note.charCodeAt(0)) % 70)}%`,
          }}
        />
      ))}
    </div>
  );
}

export function EvolutionResonancePreview({
  evolution,
}: EvolutionResonancePreviewProps) {
  const original =
    evolution.borrowedFragment?.original ?? evolution.beforeState.melody.slice(0, 2);
  const transposed =
    evolution.borrowedFragment?.transposed ?? evolution.afterState.melody.slice(0, 2);

  return (
    <article className="grid gap-10">
      <div className="grid gap-8 lg:grid-cols-[1fr_auto_1fr] lg:items-start">
        <div>
          <p className="font-body text-xs uppercase tracking-[0.28em] text-text-muted">
            Before
          </p>
          <p className="mt-2 font-body text-sm text-text-muted">
            Original melody
          </p>
          <MelodyField melody={evolution.beforeState.melody} tone="before" />
        </div>
        <div className="hidden px-2 pt-14 font-display text-4xl text-text-muted lg:block">
          →
        </div>
        <div>
          <p className="font-body text-xs uppercase tracking-[0.28em] text-text-muted">
            After
          </p>
          <p className="mt-2 font-body text-sm text-text-muted">
            After resonance
          </p>
          <MelodyField melody={evolution.afterState.melody} tone="after" />
        </div>
      </div>

      <div className="max-w-xl">
        <p className="font-body text-xs uppercase tracking-[0.28em] text-text-muted">
          Tonal shift
        </p>
        <div className="mt-5 grid grid-cols-[auto_1fr_auto] items-center gap-4 font-display text-2xl text-text">
          <span>{original.join(" · ")}</span>
          <span className="h-px bg-text/20" />
          <span className="text-[#A64D77]">{transposed.join(" · ")}</span>
        </div>
        <p className="mt-4 font-body text-sm text-text-muted">
          {evolution.trigger.durationSec} seconds near{" "}
          {evolution.sourceEchoHash}.
        </p>
      </div>
    </article>
  );
}
