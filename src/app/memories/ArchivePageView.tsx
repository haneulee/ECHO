"use client";

import { NavigateWithLoader } from "@/components/NavigateWithLoader";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { type ArchiveCarouselItem } from "@/components/ArchiveCarousel";
import { AbstractMemoryVisual } from "@/components/AbstractMemoryVisual";
import { AppShell } from "@/components/AppShell";
import { MemoriesTimespanSelect } from "@/components/MemoriesTimespanSelect";
import { PageLoading } from "@/components/PageLoading";
import { TodayEncounterSoundPlayer } from "@/components/TodayEncounterSoundPlayer";
import type { ArchiveApiResponse } from "@/lib/archiveApiTypes";
import { aggregateArchiveItems } from "@/lib/aggregateArchiveItems";
import { memoryDate, memoryPeriodLabel } from "@/lib/memoryDate";
import {
  memoriesPath,
  overviewPath,
  persistTimespan,
  resolveTimespan,
} from "@/lib/timespanNavigation";
import { archiveCarousel, archiveHero, overviewLabels } from "@/lib/uiPoetics";
import type { OverviewSpan } from "@/lib/zonedDayRange";

type LoadState =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ok"; items: ArchiveCarouselItem[] };

const MIN_LOADING_MS = 150;

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

export function DesktopArchiveView({
  items,
}: {
  items: ArchiveCarouselItem[];
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeItem = items[activeIndex]!;
  const activeMemory = activeItem.memory;

  return (
    <section className="hidden min-h-[calc(100dvh-8rem)] grid-rows-[1fr_auto] lg:grid">
      <div className="grid min-h-0 grid-cols-[0.28fr_0.44fr_0.28fr] items-center gap-10">
        <aside className="self-center">
          <h1 className="max-w-xs font-display text-[56px] leading-[58px] tracking-[-0.04em]">
            {archiveHero.title}
          </h1>
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
            <p className="font-body text-xs uppercase text-text-muted">
              {memoryDate(activeMemory.date, "long")}
            </p>
            <p className="mt-6 max-w-sm font-display text-[42px] leading-[44px] tracking-[-0.04em]">
              {archiveCarousel.dayHeadline(activeMemory.totalEncounters)}
            </p>
            <span className="my-8 block h-px w-12 bg-text/15" />
            <div className="space-y-6 font-body text-sm text-text-muted">
              <div>
                <p className="text-xs uppercase">The air changed</p>
                <p className="mt-1 text-text">{encounterWindow(activeItem)}</p>
              </div>
            </div>
          </div>
        </aside>
      </div>

      <footer className="border-t border-text/10 pt-5">
        <div className="grid grid-cols-[1fr_auto] items-start gap-8">
          <div>
            <p className="mb-4 font-body text-xs uppercase text-text-muted">
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

          <div className="flex items-center gap-3 font-body text-xs text-text-muted">
            <span className="tabular-nums">
              {activeIndex + 1} / {items.length}
            </span>
          </div>
        </div>
      </footer>
    </section>
  );
}

const STAGE = {
  mobile: { visualSize: 288 },
  desktop: { visualSize: 480 },
} as const;

function getStageConfig(isMobile: boolean) {
  return isMobile ? STAGE.mobile : STAGE.desktop;
}

function memorySlotTransform(offset: number, isMobile: boolean) {
  if (isMobile) {
    switch (offset) {
      case -1:
        return "translate(-50%, 0) translate(-47vw, -0.5vh) rotate(-10deg)";
      case 1:
        return "translate(-50%, 0) translate(47vw, -0.5vh) rotate(10deg)";
      default:
        return "translate(-50%, -50%) translate(0, 0) rotate(0deg)";
    }
  }
  switch (offset) {
    case -1:
      return "translate(-50%, 0) translate(-44vw, -0.5vh) rotate(-10deg)";
    case 1:
      return "translate(-50%, 0) translate(44vw, -0.5vh) rotate(10deg)";
    default:
      return "translate(-50%, 0) translate(0, -34vh) rotate(0deg)";
  }
}

/** Small horizontal movement switches memories. */
const MEMORY_DRAG_THRESHOLD_PX = 4;

function isMemoryDragBlockedTarget(target: EventTarget | null) {
  return (
    target instanceof Element &&
    Boolean(
      target.closest(
        "a, button, input, textarea, select, label, [data-memory-no-drag]",
      ),
    )
  );
}

function MemoriesListView({
  items,
  span,
  timeZone,
}: {
  items: ArchiveCarouselItem[];
  span: OverviewSpan;
  timeZone: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const pointerStartX = useRef<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const stageConfig = getStageConfig(isMobile);
  const safeActiveIndex =
    items.length === 0 ? 0 : Math.min(activeIndex, items.length - 1);
  const activeItem = items[safeActiveIndex];
  const activeMemory = activeItem?.memory;

  useEffect(() => {
    setActiveIndex(0);
  }, [span, items.length]);

  const overviewHref = useMemo(
    () =>
      activeMemory
        ? overviewPath({
            date: activeMemory.date,
            span,
            back: memoriesPath(span),
          })
        : "/overview",
    [activeMemory, span],
  );

  const canGoPrev = safeActiveIndex > 0;
  const canGoNext = safeActiveIndex < items.length - 1;

  const move = useCallback(
    (delta: number) => {
      if (delta < 0 && !canGoPrev) return;
      if (delta > 0 && !canGoNext) return;
      setActiveIndex((current) =>
        Math.min(items.length - 1, Math.max(0, current + delta)),
      );
    },
    [canGoNext, canGoPrev, items.length],
  );

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowLeft") move(-1);
      if (event.key === "ArrowRight") move(1);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [move]);

  const finishPointerDrag = useCallback(
    (clientX: number) => {
      const start = pointerStartX.current;
      pointerStartX.current = null;
      setIsDragging(false);
      if (start == null) return;
      const dx = clientX - start;
      if (dx > MEMORY_DRAG_THRESHOLD_PX) move(-1);
      else if (dx < -MEMORY_DRAG_THRESHOLD_PX) move(1);
    },
    [move],
  );

  const beginPointerDrag = useCallback(
    (clientX: number) => {
      pointerStartX.current = clientX;
      setIsDragging(true);

      const endDrag = (event: PointerEvent) => {
        finishPointerDrag(event.clientX);
        window.removeEventListener("pointerup", endDrag);
        window.removeEventListener("pointercancel", endDrag);
      };

      window.addEventListener("pointerup", endDrag);
      window.addEventListener("pointercancel", endDrag);
    },
    [finishPointerDrag],
  );

  if (!activeItem || !activeMemory) {
    return (
      <div className="flex flex-1 items-center justify-center px-6 py-10">
        <p className="max-w-sm text-center font-body text-sm leading-6 text-text-muted">
          No sound memories match this view yet.
        </p>
      </div>
    );
  }

  const visibleItems = items
    .map((item, index) => ({ item, index, offset: index - safeActiveIndex }))
    .filter(({ offset }) => Math.abs(offset) <= 1);

  return (
    <section
      aria-label="Sound memories"
      className={[
        "memory-stage",
        isDragging ? "memory-stage--dragging" : "",
      ].join(" ")}
      onPointerDown={(event) => {
        if (event.button !== 0 || isMemoryDragBlockedTarget(event.target))
          return;
        beginPointerDrag(event.clientX);
      }}
    >
      <div className="memory-stage-orbit">
        {visibleItems
          .slice()
          .reverse()
          .map(({ item, offset }) => {
            const isActive = offset === 0;
            const memory = item.memory;
            return (
              <article
                aria-hidden={!isActive}
                className={[
                  "memory-stage-card memory-stage-card--orbit",
                  isActive
                    ? "memory-stage-card--active"
                    : "memory-stage-card--side",
                ].join(" ")}
                key={memory.id}
                style={{
                  transform: memorySlotTransform(offset, isMobile),
                  zIndex: isActive ? 15 : 8 - Math.abs(offset),
                }}
              >
                <div className="memory-stage-visual">
                  <AbstractMemoryVisual
                    bleed
                    composition={memory.composition}
                    encounters={item.encounters}
                    gradientMotion={isActive}
                    gradientOnly
                    size={stageConfig.visualSize}
                    visualId={`memory-stack-${memory.id}`}
                    {...memory.visualization}
                  />
                </div>
              </article>
            );
          })}
      </div>

      <div aria-hidden className="memory-stage-fill" />

      <div className="memory-stage-bottom">
        <div className="memory-stage-copy">
          <h2 className="font-display text-[clamp(1.65rem,7vw,2.35rem)] leading-[1.05] tracking-[-0.045em]">
            {memoryPeriodLabel(activeItem, span, timeZone)}
          </h2>
          <p className="mt-2 font-body text-sm leading-5 text-text-muted">
            {archiveCarousel.dayHeadline(activeMemory.totalEncounters)}
          </p>
          <NavigateWithLoader
            className="glass-btn-primary mt-4 inline-flex w-fit rounded-full px-6 py-2.5 font-body text-sm"
            href={overviewHref}
            loaderLabel="Opening encounters"
          >
            {overviewLabels.openFromMemory}
          </NavigateWithLoader>
        </div>

        <footer className="memory-stage-footer">
          <p className="font-body text-xs tabular-nums text-text-muted">
            {safeActiveIndex + 1} / {items.length}
          </p>
          <div aria-hidden className="memory-stage-progress">
            <div
              className="memory-stage-progress-fill"
              style={{
                width: `${((safeActiveIndex + 1) / items.length) * 100}%`,
              }}
            />
          </div>
        </footer>
      </div>
    </section>
  );
}

function MemoriesLoadedView({
  dailyItems,
}: {
  dailyItems: ArchiveCarouselItem[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const timeZone = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone,
    [],
  );
  const span = resolveTimespan(searchParams.get("span"));
  const items = useMemo(
    () => aggregateArchiveItems(dailyItems, span, timeZone),
    [dailyItems, span, timeZone],
  );

  const setSpan = useCallback(
    (next: OverviewSpan) => {
      persistTimespan(next);
      router.replace(memoriesPath(next), { scroll: false });
    },
    [router],
  );

  return (
    <AppShell
      backHref="/main"
      fullBleed
      headerActions={
        <MemoriesTimespanSelect
          onChange={setSpan}
          value={span}
          variant="header"
        />
      }
      hideChrome
      pageTitle={archiveHero.title}
      viewportLocked
    >
      <MemoriesListView items={items} span={span} timeZone={timeZone} />
    </AppShell>
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
      <AppShell hideChrome pageTitle={archiveHero.title} viewportLocked>
        <PageLoading className="min-h-0 flex-1" label="Loading" />
      </AppShell>
    );
  }

  if (state.kind === "error") {
    return (
      <AppShell
        backHref="/main"
        hideChrome
        pageTitle={archiveHero.title}
        viewportLocked
      >
        <div className="space-y-4 px-1 pt-4">
          <p className="font-body text-sm text-red-900/90">{state.message}</p>
          <button
            type="button"
            onClick={() => void load()}
            className="glass-btn-secondary rounded-full px-4 py-2 font-body text-sm"
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
        backHref="/main"
        hideChrome
        pageTitle={archiveHero.title}
        viewportLocked
      >
        <div className="space-y-5 px-1 pt-4">
          <p className="max-w-md font-body text-sm leading-6 text-text/80">
            No sound memories have settled here yet. After Echo rests on its
            station, days with company will begin to appear.
          </p>
        </div>
      </AppShell>
    );
  }

  if (state.kind === "ok" && state.items.length > 0) {
    return <MemoriesLoadedView dailyItems={state.items} />;
  }

  return null;
}

export function ArchivePageView() {
  return (
    <Suspense
      fallback={
        <AppShell hideChrome pageTitle={archiveHero.title} viewportLocked>
          <PageLoading className="min-h-0 flex-1" label="Loading" />
        </AppShell>
      }
    >
      <ArchiveBody />
    </Suspense>
  );
}
