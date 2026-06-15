import type { Metadata } from "next";
import { redirect } from "next/navigation";
import type { CSSProperties } from "react";

import { AppShell } from "@/components/AppShell";
import { getSession } from "@/lib/auth/session";
import {
  evolutionMelodyNotes,
  evolutionSourceLabel,
  formatBorrowedFragment,
} from "@/lib/evolutionDisplay";
import { isLocalMockMode } from "@/lib/localMockMode";
import { getProfileDeviceContext } from "@/lib/profileDeviceService";
import type { EchoEvolution, EchoType } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Resonance changes your Echo",
};

function evolutionChangeLabel(mutationType: string): string {
  return mutationType
    .split("_")
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

function FieldDots({
  melody,
  tone = "before",
}: {
  melody: string[];
  tone?: "before" | "after";
}) {
  const palette =
    tone === "before"
      ? {
          large: "bg-[#C9AA73]/55",
          small: "bg-[#8A8177]/35",
        }
      : {
          large: "bg-[#A64D77]/60",
          small: "bg-[#6B5C6C]/35",
        };

  return (
    <div className="relative h-56 overflow-hidden">
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
        const left = 8 + (index / Math.max(1, melody.length - 1)) * 84;
        const top = 16 + ((code + index * 17) % 66);
        const size = 6 + ((code + index) % 3) * 4;
        return (
          <span
            aria-label={note}
            className={[
              "absolute rounded-full shadow-[0_0_18px_rgba(38,35,31,0.08)]",
              size >= 14 ? palette.large : palette.small,
            ].join(" ")}
            key={`${note}-${index}`}
            style={
              {
                height: size,
                left: `${left}%`,
                top: `${top}%`,
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
          key={`${note}-grain-${index}`}
          style={{
            left: `${10 + ((index * 11 + note.length * 7) % 80)}%`,
            top: `${14 + ((index * 19 + note.charCodeAt(0)) % 70)}%`,
          }}
        />
      ))}
    </div>
  );
}

function EvolutionStudy({
  echoName,
  deviceEchoType,
  evolution,
}: {
  echoName: string;
  deviceEchoType: EchoType;
  evolution: EchoEvolution;
}) {
  const beforeMelody = evolutionMelodyNotes(evolution.beforeState, deviceEchoType);
  const afterMelody = evolutionMelodyNotes(evolution.afterState, deviceEchoType);
  const borrowed = formatBorrowedFragment(
    evolution.borrowedFragment,
    evolution.sourceEchoType,
    deviceEchoType,
  );
  const original =
    borrowed.original.length > 0
      ? borrowed.original
      : beforeMelody.slice(0, 2);
  const transposed =
    borrowed.transposed.length > 0
      ? borrowed.transposed
      : afterMelody.slice(0, 2);

  return (
    <section className="grid gap-12 lg:grid-cols-[0.34fr_0.66fr] lg:items-start">
      <aside className="space-y-10">
        <div>
          <p className="font-body text-xs uppercase text-text-muted">
            Echo evolution
          </p>
          <h2 className="mt-6 max-w-xs font-display text-[44px] leading-[48px] tracking-[-0.04em] sm:text-[56px] sm:leading-[60px]">
            Resonance changes {echoName}.
          </h2>
          <p className="mt-6 max-w-xs font-body text-sm leading-6 text-text-muted">
            When {echoName} stays near another Echo for a minute or more, one
            melody slot borrows from the peer&apos;s type motif—not their live
            sound—and accumulates on {echoName}&apos;s own profile.
          </p>
        </div>

        <div className="grid gap-6 font-body text-xs uppercase text-text-muted">
          <div className="flex items-center gap-4">
            <span className="grid h-7 w-7 place-items-center rounded-full border border-text/30 text-[11px] text-text">
              i
            </span>
            <div>
              <p>Duration</p>
              <p className="mt-1 normal-case tracking-normal text-text">
                {evolution.trigger.durationSec} seconds
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="relative h-7 w-7">
              <span className="absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border border-[#A64D77]/45 bg-[#A64D77]/15" />
              <span className="absolute right-0 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border border-[#C9AA73]/45 bg-[#C9AA73]/15" />
            </span>
            <div>
              <p>Encounter</p>
              <p className="mt-1 normal-case tracking-normal text-text">
                2 Echoes
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="h-7 w-7 rounded-full border border-dashed border-text/30" />
            <div>
              <p>Change</p>
              <p className="mt-1 normal-case tracking-normal text-text">
                {evolutionChangeLabel(evolution.mutationType)}
              </p>
            </div>
          </div>
        </div>
      </aside>

      <div className="grid gap-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_auto_1fr] lg:items-start">
          <div>
            <p className="font-body text-xs uppercase text-text-muted">
              Before
            </p>
            <p className="mt-2 font-body text-sm text-text-muted">
              Original melody
            </p>
            <FieldDots melody={beforeMelody} tone="before" />
          </div>
          <div className="hidden px-2 pt-14 font-display text-4xl text-text-muted lg:block">
            →
          </div>
          <div>
            <p className="font-body text-xs uppercase text-text-muted">
              After
            </p>
            <p className="mt-2 font-body text-sm text-text-muted">
              After resonance
            </p>
            <FieldDots melody={afterMelody} tone="after" />
          </div>
        </div>

        <div className="max-w-xl">
          <p className="font-body text-xs uppercase text-text-muted">
            Tonal shift
          </p>
          <div className="mt-5 grid grid-cols-[auto_1fr_auto] items-center gap-4 font-display text-2xl text-text">
            <span>{original.join(" · ")}</span>
            <span className="h-px bg-text/20" />
            <span className="text-[#A64D77]">{transposed.join(" · ")}</span>
          </div>
          <p className="mt-4 font-body text-sm text-text-muted">
            Residue carried forward from {evolutionSourceLabel(evolution)}.
          </p>
        </div>
      </div>
    </section>
  );
}

export default async function EvolutionPage() {
  const session = await getSession();
  if (!session && !isLocalMockMode()) {
    redirect("/login");
  }
  const userId = session?.userId ?? "local_mock";
  const ctx = await getProfileDeviceContext(userId);

  if (!ctx) {
    return (
      <AppShell
        intro="When Echo stays near others, parts of their sound become part of its own."
        pageTitle="Resonance changes your Echo."
      >
        <p className="max-w-lg font-body text-sm text-text/80">
          No device for this user yet.
        </p>
      </AppShell>
    );
  }

  const { device, evolutions } = ctx;
  const latestEvolution = evolutions[0] ?? null;

  return (
    <AppShell>
      {!latestEvolution ? (
        <p className="font-body text-sm text-text/75">
          No evolutions recorded yet.
        </p>
      ) : (
        <EvolutionStudy
          deviceEchoType={device.echoType}
          echoName={device.echoName}
          evolution={latestEvolution}
        />
      )}
    </AppShell>
  );
}
