"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { type ArchiveCarouselItem } from "@/components/ArchiveCarousel";
import { AbstractMemoryVisual } from "@/components/AbstractMemoryVisual";
import { AppShell } from "@/components/AppShell";
import { PageLoading } from "@/components/PageLoading";
import { TodayEncounterSoundPlayer } from "@/components/TodayEncounterSoundPlayer";
import type { ArchiveApiResponse } from "@/lib/archiveApiTypes";
import { archiveCarousel, archiveHero } from "@/lib/uiPoetics";

type LoadState =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ok"; items: ArchiveCarouselItem[] };

const MIN_LOADING_MS = 150;

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
  if (item.encounters.length === 0) return "The day stayed quiet";
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

export function DesktopArchiveView({ items }: { items: ArchiveCarouselItem[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeItem = items[activeIndex]!;
  const activeMemory = activeItem.memory;

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
          <div className="grid justify-items-center">
            <AbstractMemoryVisual
              composition={activeMemory.composition}
              encounters={activeItem.encounters}
              gradientOnly
              key={activeMemory.id}
              size={520}
              visualId={`archive-main-${activeMemory.id}`}
              {...activeMemory.visualization}
            />
            <div className="-mt-4 rounded-full px-4 py-2.5">
              <TodayEncounterSoundPlayer
                date={activeMemory.date}
                device={null}
                encounters={activeItem.encounters}
                key={activeMemory.id}
                memory={activeMemory}
                title="Play this memory"
              />
            </div>
          </div>
        </div>

        <aside className="self-center justify-self-end">
          <div className="max-w-56">
            <p className="font-body text-xs uppercase tracking-[0.24em] text-text-muted">
              {memoryDate(activeMemory.date, "long")}
            </p>
            <p className="mt-6 max-w-xs font-display text-[42px] leading-[44px] tracking-[-0.04em]">
              {archiveCarousel.dayHeadline(activeMemory.totalEncounters)}
            </p>
            <span className="my-8 block h-px w-12 bg-text/15" />
            <div className="space-y-6 font-body text-sm text-text-muted">
              <div>
                <p className="text-xs uppercase tracking-[0.24em]">
                  The air changed
                </p>
                <p className="mt-1 text-text">{encounterWindow(activeItem)}</p>
              </div>
            </div>
          </div>
        </aside>
      </div>

      <footer className="border-t border-text/10 pt-5">
        <div className="grid grid-cols-[1fr_auto] items-start gap-8">
          <div>
            <p className="mb-4 font-body text-xs uppercase tracking-[0.28em] text-text-muted">
              Recent traces
            </p>
            <div className="grid max-w-4xl grid-cols-3 gap-8">
              {items.slice(0, 3).map((item, index) => (
                <button
                  className={[
                    "flex items-center gap-4 text-left transition",
                    index === activeIndex
                      ? "opacity-100"
                      : "opacity-50 hover:opacity-80",
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
                      {archiveCarousel.dayHeadline(item.memory.totalEncounters)}
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
      </footer>
    </section>
  );
}

function MemoriesListView({ items }: { items: ArchiveCarouselItem[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const visibleItems = items
    .map((item, index) => ({ item, index, offset: index - activeIndex }))
    .filter(({ offset }) => Math.abs(offset) <= 2);

  function move(delta: number) {
    setActiveIndex((current) =>
      Math.min(items.length - 1, Math.max(0, current + delta)),
    );
  }

  return (
    <section className="mx-auto flex min-h-0 w-full flex-1 flex-col items-center justify-center overflow-hidden">
      <div className="relative min-h-0 w-full flex-1 overflow-hidden">
        <div className="absolute inset-0 grid place-items-center overflow-visible">
          <div className="relative h-full max-h-[min(68dvh,42rem)] min-h-[25rem] w-[min(84vw,38rem)] overflow-visible">
        {visibleItems
          .slice()
          .reverse()
          .map(({ item, offset }) => {
            const isActive = offset === 0;
            const distance = Math.abs(offset);
            const x = offset * 72;
            const y = distance * 12;
            const scale = 1 - distance * 0.08;
            const memory = item.memory;
          return (
            <article
                aria-hidden={!isActive}
                className={[
                  "absolute inset-0 grid place-items-center overflow-visible transition duration-300",
                  isActive ? "z-30" : "pointer-events-none opacity-65",
                ].join(" ")}
              key={memory.id}
                style={{
                  transform: `translateX(${x}%) translateY(${y}px) scale(${scale})`,
                  zIndex: 30 - distance,
                }}
            >
                <div className="grid h-full w-full place-items-center overflow-visible">
                  <AbstractMemoryVisual
                    bleed
                    composition={memory.composition}
                    encounters={item.encounters}
                    gradientOnly
                    size={420}
                    visualId={`memory-stack-${memory.id}`}
                    {...memory.visualization}
                  />
                </div>

                <div
                  className={[
                    "absolute inset-x-0 bottom-4 z-10 mx-auto grid w-full justify-items-center gap-4 px-4 text-center transition-opacity sm:bottom-6",
                    isActive ? "opacity-100" : "pointer-events-none opacity-0",
                  ].join(" ")}
                >
                  <div>
                    <h2 className="font-display text-[30px] leading-[32px] tracking-[-0.045em] sm:text-[40px] sm:leading-[42px]">
                      {memoryDate(memory.date, "long")}
                    </h2>
                    <p className="mt-3 font-body text-sm leading-5 text-text-muted">
                      {archiveCarousel.dayHeadline(memory.totalEncounters)}
                    </p>
                    <p className="mt-2 font-body text-xs uppercase tracking-[0.24em] text-text-muted">
                      {encounterWindow(item)}
                    </p>
                  </div>

                  <Link
                    className="inline-flex w-fit rounded-full bg-nav-active px-6 py-3 font-body text-sm text-white transition hover:opacity-90"
                    href={`/today?date=${memory.date}&back=%2Farchive`}
                  >
                    open a map
                  </Link>
                </div>
            </article>
          );
          })}
          </div>
        </div>
      </div>

      <div className="mt-4 flex shrink-0 items-center gap-4 sm:mt-5">
        <button
          aria-label="Previous memory"
          className="grid h-12 w-12 place-items-center rounded-full border border-text/15 font-body text-lg text-text transition hover:bg-surface/55 disabled:opacity-30"
          disabled={activeIndex === 0}
          onClick={() => move(-1)}
          type="button"
        >
          ←
        </button>
        <p className="font-body text-xs uppercase tracking-[0.24em] text-text-muted">
          {activeIndex + 1} / {items.length}
        </p>
        <button
          aria-label="Next memory"
          className="grid h-12 w-12 place-items-center rounded-full border border-text/15 font-body text-lg text-text transition hover:bg-surface/55 disabled:opacity-30"
          disabled={activeIndex === items.length - 1}
          onClick={() => move(1)}
          type="button"
        >
          →
        </button>
      </div>
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
        await wait(
          Math.max(0, MIN_LOADING_MS - (performance.now() - startedAt)),
        );
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

  const backButton = (
    <Link
      className="fixed right-4 top-[max(1rem,env(safe-area-inset-top))] z-40 rounded-full border border-text/10 bg-surface/65 px-4 py-2 font-body text-sm text-text backdrop-blur-md transition hover:bg-surface sm:right-6 lg:right-8"
      href="/profile"
    >
      back
    </Link>
  );

  if (state.kind === "loading") {
    return (
      <AppShell viewportLocked>
        <PageLoading className="min-h-0 flex-1" label="Loading" />
      </AppShell>
    );
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
          {backButton}
          <p className="font-body text-sm text-red-900/90">{state.message}</p>
          <button
            type="button"
            onClick={() => void load()}
            className="rounded-full border border-border bg-surface/65 px-4 py-2 font-body text-sm text-text transition hover:bg-surface"
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
        <div className="space-y-5 px-1">
          {backButton}
          <p className="max-w-md font-body text-sm leading-6 text-text/80">
            No sound memories have settled here yet. After Echo rests on its
            station, days with company will begin to appear.
          </p>
        </div>
      </AppShell>
    );
  }

  if (state.kind === "ok" && state.items.length > 0) {
    return (
      <AppShell
        eyebrow={archiveHero.eyebrow}
        fullBleed
        intro={archiveHero.intro}
        title="memories"
        viewportLocked
      >
        {backButton}
        <MemoriesListView items={state.items} />
      </AppShell>
    );
  }

  return null;
}

export function ArchivePageView() {
  return <ArchiveBody />;
}
