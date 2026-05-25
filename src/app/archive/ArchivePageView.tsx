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
  return (
    <section className="mx-auto max-w-5xl pb-20 pt-12 sm:pt-16 lg:pt-20">
      <Link
        className="inline-flex rounded-full border border-border bg-surface/65 px-4 py-2 font-body text-sm text-text transition hover:bg-surface"
        href="/profile"
      >
        back to profile
      </Link>
      <div className="mt-10 grid gap-4 sm:gap-5">
        {items.map((item) => {
          const memory = item.memory;
          return (
            <article
              className="grid gap-5 rounded-[36px] border border-text/10 bg-surface/35 p-5 sm:grid-cols-[9rem_1fr] sm:items-center sm:p-6 lg:grid-cols-[12rem_1fr_auto] lg:gap-8 lg:p-8"
              key={memory.id}
            >
              <div className="grid justify-items-center overflow-hidden rounded-[32px]">
                <AbstractMemoryVisual
                  composition={memory.composition}
                  encounters={item.encounters}
                  gradientOnly
                  size={176}
                  visualId={`memory-list-${memory.id}`}
                  {...memory.visualization}
                />
              </div>
              <div>
                <p className="font-body text-xs uppercase tracking-[0.28em] text-text-muted">
                  {memoryDate(memory.date, "long")}
                </p>
                <h2 className="mt-3 max-w-xl font-display text-[34px] leading-[36px] tracking-[-0.04em] sm:text-[42px] sm:leading-[44px]">
                  {archiveCarousel.dayHeadline(memory.totalEncounters)}
                </h2>
                <p className="mt-4 font-body text-sm leading-6 text-text-muted">
                  {encounterWindow(item)}
                </p>
              </div>
              <div className="justify-self-start lg:justify-self-end">
                <TodayEncounterSoundPlayer
                  date={memory.date}
                  device={null}
                  encounters={item.encounters}
                  memory={memory}
                  title="Play this memory"
                />
              </div>
            </article>
          );
        })}
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

  if (state.kind === "loading") {
    return (
      <AppShell
        eyebrow={archiveHero.eyebrow}
        intro={archiveHero.intro}
        title={archiveHero.title}
        viewportLocked
      >
        <div className="flex min-h-0 flex-1 flex-col">
          <Link
            className="mb-6 inline-flex self-start rounded-full border border-border bg-surface/65 px-4 py-2 font-body text-sm text-text transition hover:bg-surface"
            href="/profile"
          >
            back to profile
          </Link>
          <PageLoading className="min-h-0 flex-1" label="Opening the archive" />
        </div>
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
          <Link
            className="inline-flex rounded-full border border-border bg-surface/65 px-4 py-2 font-body text-sm text-text transition hover:bg-surface"
            href="/profile"
          >
            back to profile
          </Link>
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
          <Link
            className="inline-flex rounded-full border border-border bg-surface/65 px-4 py-2 font-body text-sm text-text transition hover:bg-surface"
            href="/profile"
          >
            back to profile
          </Link>
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
      <AppShell eyebrow={archiveHero.eyebrow} intro={archiveHero.intro} title="memories">
        <MemoriesListView items={state.items} />
      </AppShell>
    );
  }

  return null;
}

export function ArchivePageView() {
  return <ArchiveBody />;
}
