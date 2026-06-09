"use client";

import { NavigateWithLoader } from "@/components/NavigateWithLoader";
import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSearchParams } from "next/navigation";

import { type ArchiveCarouselItem } from "@/components/ArchiveCarousel";
import { AbstractMemoryVisual } from "@/components/AbstractMemoryVisual";
import { AppShell } from "@/components/AppShell";
import { useRouteLoading } from "@/components/NavigationLoadingProvider";
import { MemoriesTimespanSelect } from "@/components/MemoriesTimespanSelect";
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
import {
  archiveHero,
  encounterDayHeadline,
  overviewLabels,
} from "@/lib/uiPoetics";
import { useAppRouter } from "@/hooks/useAppRouter";
import { useClientTimeZone } from "@/hooks/useClientTimeZone";
import type { OverviewSpan } from "@/lib/zonedDayRange";

type LoadState =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ok"; data: ArchiveApiResponse };

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
  const format = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  });
  return `${format.format(first)} – ${format.format(last)}`;
}

export function DesktopArchiveView({
  echoName,
  items,
}: {
  echoName: string;
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
              {encounterDayHeadline(activeMemory.totalEncounters, echoName)}
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
                      {encounterDayHeadline(
                        item.memory.totalEncounters,
                        echoName,
                      )}
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
const MEMORY_ORBIT_MS = 1800;
/** Text fades out before swapping; reveal finishes with the orbit. */
const MEMORY_COPY_HIDE_MS = 550;

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
  echoName,
  items,
  span,
  timeZone,
}: {
  echoName: string;
  items: ArchiveCarouselItem[];
  span: OverviewSpan;
  timeZone: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [copyIndex, setCopyIndex] = useState(0);
  const [copyVisible, setCopyVisible] = useState(true);
  const [visualVisible, setVisualVisible] = useState(true);
  const [departingIndex, setDepartingIndex] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [animationsPaused, setAnimationsPaused] = useState(false);
  const hasAnimatedVisual = useRef(false);
  const pointerStartX = useRef<number | null>(null);
  const departingResetTimer = useRef<number | null>(null);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(max-width: 639px)").matches
      : false,
  );
  const stageConfig = getStageConfig(isMobile);
  const safeActiveIndex =
    items.length === 0 ? 0 : Math.min(activeIndex, items.length - 1);
  const safeCopyIndex =
    items.length === 0 ? 0 : Math.min(copyIndex, items.length - 1);
  const activeItem = items[safeActiveIndex];
  const activeMemory = activeItem?.memory;
  const copyItem = items[safeCopyIndex] ?? activeItem;
  const copyMemory = copyItem?.memory ?? activeMemory;

  useEffect(() => {
    setActiveIndex(0);
    setCopyIndex(0);
    setCopyVisible(true);
    setVisualVisible(true);
    setDepartingIndex(null);
  }, [span, items.length]);

  const overviewHref = useMemo(
    () =>
      copyMemory
        ? overviewPath({
            date: copyMemory.date,
            span,
            back: memoriesPath(span),
          })
        : "/overview",
    [copyMemory, span],
  );

  useEffect(() => {
    if (!hasAnimatedVisual.current) {
      hasAnimatedVisual.current = true;
      setCopyIndex(safeActiveIndex);
      setCopyVisible(true);
      setVisualVisible(true);
      return;
    }

    setCopyVisible(false);
    setVisualVisible(false);

    const swapCopy = window.setTimeout(() => {
      setCopyIndex(safeActiveIndex);
      setCopyVisible(true);
    }, MEMORY_COPY_HIDE_MS);

    let cancelled = false;
    requestAnimationFrame(() => {
      if (cancelled) return;
      requestAnimationFrame(() => {
        if (cancelled) return;
        setVisualVisible(true);
      });
    });

    return () => {
      cancelled = true;
      window.clearTimeout(swapCopy);
    };
  }, [safeActiveIndex]);

  const canGoPrev = safeActiveIndex > 0;
  const canGoNext = safeActiveIndex < items.length - 1;

  const move = useCallback(
    (delta: number) => {
      if (delta < 0 && !canGoPrev) return;
      if (delta > 0 && !canGoNext) return;
      if (departingResetTimer.current != null) {
        window.clearTimeout(departingResetTimer.current);
      }
      setCopyVisible(false);
      setVisualVisible(false);
      setDepartingIndex(safeActiveIndex);
      departingResetTimer.current = window.setTimeout(() => {
        setDepartingIndex(null);
        departingResetTimer.current = null;
      }, MEMORY_ORBIT_MS);
      setActiveIndex((current) =>
        Math.min(items.length - 1, Math.max(0, current + delta)),
      );
    },
    [canGoNext, canGoPrev, items.length, safeActiveIndex],
  );

  useEffect(
    () => () => {
      if (departingResetTimer.current != null) {
        window.clearTimeout(departingResetTimer.current);
      }
    },
    [],
  );

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const update = () => setAnimationsPaused(document.hidden);
    update();
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
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
        animationsPaused ? "memory-stage--paused" : "",
        isMobile ? "memory-stage--mobile" : "",
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
          .map(({ item, index, offset }) => {
            const isActive = offset === 0;
            const isDeparting = !isActive && index === departingIndex;
            const memory = item.memory;
            return (
              <article
                aria-hidden={!isActive}
                className={[
                  "memory-stage-card memory-stage-card--orbit",
                  isActive
                    ? "memory-stage-card--active"
                    : "memory-stage-card--side",
                  isDeparting ? "memory-stage-card--departing" : "",
                ].join(" ")}
                key={memory.id}
                style={{
                  transform: memorySlotTransform(offset, isMobile),
                  zIndex: isActive ? 15 : 8 - Math.abs(offset),
                }}
              >
                <div
                  className={[
                    "memory-stage-visual",
                    isActive
                      ? visualVisible
                        ? "memory-stage-visual--visible"
                        : "memory-stage-visual--hidden"
                      : "",
                  ].join(" ")}
                >
                  <AbstractMemoryVisual
                    bleed
                    composition={memory.composition}
                    encounters={item.encounters}
                    gradientMotion={isActive}
                    gradientOnly
                    lowGpuCost={isMobile}
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
          <div aria-label="Memory navigation" className="memory-stage-arrows">
            <button
              aria-label="Previous memory"
              className="memory-stage-arrow memory-stage-arrow--prev"
              data-memory-no-drag
              disabled={!canGoPrev}
              onClick={() => move(-1)}
              type="button"
            />
            <button
              aria-label="Next memory"
              className="memory-stage-arrow memory-stage-arrow--next"
              data-memory-no-drag
              disabled={!canGoNext}
              onClick={() => move(1)}
              type="button"
            />
          </div>
          <div
            className={[
              "memory-stage-copy-text",
              copyVisible
                ? "memory-stage-copy-text--visible"
                : "memory-stage-copy-text--hidden",
            ].join(" ")}
          >
            <h2 className="truncate whitespace-nowrap font-display text-[clamp(1.65rem,7vw,2.35rem)] leading-[1.05] tracking-[-0.045em]">
              {copyItem ? memoryPeriodLabel(copyItem, span, timeZone) : null}
            </h2>
            <p className="mt-2 font-body text-sm leading-5 text-text-muted">
              {copyMemory
                ? encounterDayHeadline(copyMemory.totalEncounters, echoName)
                : null}
            </p>
          </div>
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
  echoDevice,
  echoName,
  timeZone,
}: {
  dailyItems: ArchiveCarouselItem[];
  echoDevice: ArchiveApiResponse["device"];
  echoName: string;
  timeZone: string;
}) {
  const router = useAppRouter();
  const searchParams = useSearchParams();
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
      echoDevice={echoDevice}
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
      <MemoriesListView
        echoName={echoName}
        items={items}
        span={span}
        timeZone={timeZone}
      />
    </AppShell>
  );
}

function ArchiveBody() {
  const timeZone = useClientTimeZone();

  const [state, setState] = useState<LoadState>({ kind: "loading" });

  const load = useCallback(async () => {
    if (!timeZone) return;
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
      setState({ kind: "ok", data });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Network error";
      await wait(Math.max(0, MIN_LOADING_MS - (performance.now() - startedAt)));
      setState({ kind: "error", message });
    }
  }, [timeZone]);

  useEffect(() => {
    if (!timeZone) return;
    void load();
  }, [load, timeZone]);

  useRouteLoading(!timeZone || state.kind === "loading");

  if (!timeZone || state.kind === "loading") {
    return (
      <AppShell hideChrome pageTitle={archiveHero.title} viewportLocked>
        <div aria-hidden className="min-h-0 flex-1" />
      </AppShell>
    );
  }

  if (state.kind === "error") {
    return (
      <AppShell hideChrome pageTitle={archiveHero.title} viewportLocked>
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

  if (state.kind === "ok" && state.data.items.length === 0) {
    const echoName = state.data.device?.echoName ?? "Echo";

    return (
      <AppShell
        echoDevice={state.data.device}
        hideChrome
        pageTitle={archiveHero.title}
        viewportLocked
      >
        <div className="space-y-5 px-1 pt-4">
          <p className="max-w-md font-body text-sm leading-6 text-text/80">
            No sound memories have settled here yet. After {echoName} rests on
            its station, days with company will begin to appear.
          </p>
        </div>
      </AppShell>
    );
  }

  if (state.kind === "ok" && state.data.items.length > 0) {
    const echoName = state.data.device?.echoName ?? "Echo";

    return (
      <MemoriesLoadedView
        dailyItems={state.data.items}
        echoDevice={state.data.device}
        echoName={echoName}
        timeZone={timeZone}
      />
    );
  }

  return null;
}

export function ArchivePageView() {
  return (
    <Suspense
      fallback={
        <AppShell hideChrome pageTitle={archiveHero.title} viewportLocked>
          <div aria-hidden className="min-h-0 flex-1" />
        </AppShell>
      }
    >
      <ArchiveBody />
    </Suspense>
  );
}
