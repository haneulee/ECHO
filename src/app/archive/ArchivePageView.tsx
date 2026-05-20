"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  ArchiveCarousel,
  type ArchiveCarouselItem,
} from "@/components/ArchiveCarousel";
import { AbstractMemoryVisual } from "@/components/AbstractMemoryVisual";
import { AppShell } from "@/components/AppShell";
import { PageLoading } from "@/components/PageLoading";
import { SoundMemoryPlayer } from "@/components/SoundMemoryPlayer";
import type { ArchiveApiResponse } from "@/lib/archiveApiTypes";
import { archiveCarousel, archiveHero } from "@/lib/uiPoetics";

type LoadState =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ok"; items: ArchiveCarouselItem[] };

const MIN_LOADING_MS = 650;

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function memoryDate(date: string, style: "long" | "short") {
  return new Date(`${date}T12:00:00`).toLocaleDateString("en", {
    ...(style === "long"
      ? { weekday: "long" as const, month: "long" as const }
      : { month: "short" as const }),
    day: "numeric",
  });
}

function encounterWindow(item: ArchiveCarouselItem) {
  if (item.encounters.length === 0) return "Quiet all day";
  const starts = item.encounters
    .map((encounter) => new Date(encounter.startedAt))
    .filter((date) => !Number.isNaN(date.getTime()))
    .sort((a, b) => a.getTime() - b.getTime());
  if (starts.length === 0) return "Time unknown";
  const first = starts[0]!;
  const last = starts[starts.length - 1]!;
  const format = new Intl.DateTimeFormat("en", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return `${format.format(first)} – ${format.format(last)}`;
}

function DesktopArchiveView({ items }: { items: ArchiveCarouselItem[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeItem = items[activeIndex]!;
  const activeMemory = activeItem.memory;
  const melody = activeMemory.composition.voices.flatMap((voice) => voice.melody);

  function move(delta: number) {
    setActiveIndex((current) =>
      Math.min(items.length - 1, Math.max(0, current + delta)),
    );
  }

  return (
    <section className="hidden min-h-[calc(100dvh-8rem)] grid-rows-[1fr_auto] lg:grid">
      <div className="grid min-h-0 grid-cols-[0.28fr_0.44fr_0.28fr] items-center gap-10">
        <aside className="self-center">
          <p className="font-body text-xs uppercase tracking-[0.34em] text-text-muted">
            {archiveHero.eyebrow}
          </p>
          <h1 className="mt-6 max-w-xs font-display text-[56px] leading-[58px] tracking-[-0.04em]">
            {archiveHero.title}
          </h1>
          <p className="mt-7 max-w-xs font-body text-sm leading-6 text-text-muted">
            {archiveHero.intro}
          </p>
          <span className="mt-10 block h-px w-12 bg-text/20" />
        </aside>

        <div className="grid place-items-center">
          <AbstractMemoryVisual
            composition={activeMemory.composition}
            encounters={activeItem.encounters}
            gradientOnly
            key={activeMemory.id}
            size={520}
            visualId={`archive-main-${activeMemory.id}`}
            {...activeMemory.visualization}
          />
        </div>

        <aside className="self-center justify-self-end">
          <div className="max-w-56">
            <p className="font-body text-xs uppercase tracking-[0.24em] text-text-muted">
              {memoryDate(activeMemory.date, "long")}
            </p>
            <p className="mt-6 font-display text-[72px] leading-none tracking-[-0.05em]">
              {activeMemory.totalEncounters}
            </p>
            <p className="mt-1 font-body text-xl leading-6 text-text">
              encounters
              <br />
              remained nearby
            </p>
            <span className="my-8 block h-px w-12 bg-text/15" />
            <div className="space-y-6 font-body text-sm text-text-muted">
              <div>
                <p className="text-xs uppercase tracking-[0.24em]">
                  Mostly between
                </p>
                <p className="mt-1 text-text">{encounterWindow(activeItem)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.24em]">
                  Evening resonance
                </p>
                <p className="mt-1 text-text">
                  {archiveCarousel.dayHeadline(activeMemory.totalEncounters)}
                </p>
              </div>
            </div>
            <span className="my-8 block h-px w-full bg-text/10" />
            <a
              className="inline-flex items-center gap-10 font-body text-sm text-text-muted transition hover:text-text"
              href={`/today?date=${activeMemory.date}`}
            >
              View full day <span aria-hidden>→</span>
            </a>
          </div>
        </aside>
      </div>

      <footer className="border-t border-text/10 pt-5">
        <div className="grid grid-cols-[1fr_auto] items-start gap-8">
          <div>
            <p className="mb-4 font-body text-xs uppercase tracking-[0.28em] text-text-muted">
              Recent memories
            </p>
            <div className="grid max-w-4xl grid-cols-3 gap-8">
              {items.slice(0, 3).map((item, index) => (
                <button
                  className={[
                    "flex items-center gap-4 text-left transition",
                    index === activeIndex ? "opacity-100" : "opacity-50 hover:opacity-80",
                  ].join(" ")}
                  key={item.memory.id}
                  onClick={() => setActiveIndex(index)}
                  type="button"
                >
                  <span className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-full border border-text/10">
                    <span className="grid h-20 w-20 shrink-0 scale-[0.68] place-items-center">
                      <AbstractMemoryVisual
                        composition={item.memory.composition}
                        encounters={item.encounters}
                        gradientOnly
                        size={80}
                        visualId={`archive-thumb-${item.memory.id}`}
                        {...item.memory.visualization}
                      />
                    </span>
                  </span>
                  <span className="font-body text-sm text-text">
                    {memoryDate(item.memory.date, "short")}
                    <span className="mt-1 block text-text-muted">
                      {item.memory.totalEncounters} encounters
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              aria-label="Previous memory"
              className="grid h-12 w-12 place-items-center rounded-full border border-text/10 text-xl text-text-muted transition hover:text-text disabled:opacity-30"
              disabled={activeIndex === 0}
              onClick={() => move(-1)}
              type="button"
            >
              ←
            </button>
            <button
              aria-label="Next memory"
              className="grid h-12 w-12 place-items-center rounded-full border border-text/10 text-xl text-text-muted transition hover:text-text disabled:opacity-30"
              disabled={activeIndex === items.length - 1}
              onClick={() => move(1)}
              type="button"
            >
              →
            </button>
          </div>
        </div>

        <div className="mx-auto mt-8 flex w-full max-w-2xl justify-center">
          <div className="rounded-full border border-[#26231F]/[0.08] bg-white/95 px-4 py-2.5 shadow-[0_12px_48px_rgba(38,35,31,0.14)] backdrop-blur-md">
            <SoundMemoryPlayer
              key={activeMemory.id}
              melody={melody}
              title="Transit Resonance"
              subtitle={`${memoryDate(activeMemory.date, "short")} · ${String(
                activeIndex + 1,
              ).padStart(2, "0")} / ${String(items.length).padStart(2, "0")}`}
              variant="controlRow"
            />
          </div>
        </div>
      </footer>
    </section>
  );
}

function ArchiveBody() {
  const timeZone = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone,
    [],
  );

  const [state, setState] = useState<LoadState>({ kind: "loading" });

  const load = useCallback(async () => {
    const startedAt = performance.now();
    setState({ kind: "loading" });
    try {
      const qs = new URLSearchParams({ timeZone });
      const res = await fetch(`/api/archive?${qs.toString()}`, {
        cache: "no-store",
        credentials: "include",
      });
      if (!res.ok) {
        const errBody = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        await wait(Math.max(0, MIN_LOADING_MS - (performance.now() - startedAt)));
        setState({
          kind: "error",
          message: errBody?.error ?? `Request failed (${res.status})`,
        });
        return;
      }
      const data = (await res.json()) as ArchiveApiResponse;
      await wait(Math.max(0, MIN_LOADING_MS - (performance.now() - startedAt)));
      setState({ kind: "ok", items: data.items });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Network error";
      await wait(Math.max(0, MIN_LOADING_MS - (performance.now() - startedAt)));
      setState({ kind: "error", message });
    }
  }, [timeZone]);

  useEffect(() => {
    void load();
  }, [load]);

  if (state.kind === "loading") {
    return <PageLoading label="Loading archive" />;
  }

  if (state.kind === "error") {
    return (
      <AppShell
        eyebrow={archiveHero.eyebrow}
        intro={archiveHero.intro}
        title={archiveHero.title}
        viewportLocked
      >
        <div className="space-y-4 px-1">
          <p className="font-body text-sm text-red-900/90">{state.message}</p>
          <button
            type="button"
            onClick={() => void load()}
            className="rounded-full border border-[#1a3a48]/30 bg-white px-4 py-2 font-body text-sm text-text transition hover:border-[#1a3a48]/50"
          >
            Try again
          </button>
        </div>
      </AppShell>
    );
  }

  if (state.kind === "ok" && state.items.length === 0) {
    return (
      <AppShell
        eyebrow={archiveHero.eyebrow}
        intro={archiveHero.intro}
        title={archiveHero.title}
        viewportLocked
      >
        <p className="max-w-md px-1 font-body text-sm leading-6 text-text/80">
          No saved daily memories yet. When Echo writes a day to the database,
          it lands here in order.
        </p>
      </AppShell>
    );
  }

  if (state.kind === "ok" && state.items.length > 0) {
    return (
      <>
        <div className="lg:hidden">
          <AppShell
            eyebrow={archiveHero.eyebrow}
            intro={archiveHero.intro}
            title={archiveHero.title}
            viewportLocked
          >
            <ArchiveCarousel items={state.items} />
          </AppShell>
        </div>
        <div className="hidden lg:block">
          <AppShell>
            <DesktopArchiveView items={state.items} />
          </AppShell>
        </div>
      </>
    );
  }

  return null;
}

export function ArchivePageView() {
  return <ArchiveBody />;
}
