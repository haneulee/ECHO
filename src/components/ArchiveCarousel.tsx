"use client";

import { useEffect, useRef, useState } from "react";
import type { DailyMemory, Encounter } from "@/lib/types";
import { encounterDayHeadline } from "@/lib/uiPoetics";
import { AbstractMemoryVisual } from "./AbstractMemoryVisual";
import { TodayEncounterSoundPlayer } from "./TodayEncounterSoundPlayer";

export type ArchiveCarouselItem = {
  memory: DailyMemory;
  encounters: Encounter[];
  periodStart?: string;
  periodEnd?: string;
};

type ArchiveCarouselProps = {
  echoName: string;
  items: ArchiveCarouselItem[];
};

/** Sonic visual size — single centered instance; scales slightly by breakpoint. */
function useArchiveVisualSize() {
  const [size, setSize] = useState(320);

  useEffect(() => {
    function apply() {
      const w = window.innerWidth;
      if (w >= 1024) setSize(420);
      else if (w >= 640) setSize(340);
      else setSize(280);
    }
    apply();
    window.addEventListener("resize", apply);
    return () => window.removeEventListener("resize", apply);
  }, []);

  return size;
}

export function ArchiveCarousel({ echoName, items }: ArchiveCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const visualSize = useArchiveVisualSize();
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [segmentPx, setSegmentPx] = useState(0);

  const activeItem = items[activeIndex];
  const activeMemory = activeItem?.memory;

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const measure = () => {
      const h = el.clientHeight;
      if (h > 0) setSegmentPx(h);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || segmentPx <= 0 || items.length === 0) return;

    const onScroll = () => {
      const idx = Math.min(
        items.length - 1,
        Math.max(0, Math.round(el.scrollTop / segmentPx)),
      );
      setActiveIndex(idx);
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => el.removeEventListener("scroll", onScroll);
  }, [items.length, segmentPx]);

  const sectionRef = useRef<HTMLElement | null>(null);

  /** Overlay UI sits above the scroll layer; wheel on controls must still move the scroll container. */
  useEffect(() => {
    const section = sectionRef.current;
    const scrollEl = scrollRef.current;
    if (!section || !scrollEl) return;

    const onWheel = (e: WheelEvent) => {
      const t = e.target;
      if (!(t instanceof Node)) return;
      if (scrollEl.contains(t)) return;
      scrollEl.scrollTop += e.deltaY;
      e.preventDefault();
    };

    section.addEventListener("wheel", onWheel, { passive: false });
    return () => section.removeEventListener("wheel", onWheel);
  }, []);

  const segmentStyle =
    segmentPx > 0
      ? { minHeight: segmentPx }
      : { minHeight: "min(85dvh, 720px)" };

  if (!activeMemory || !activeItem) {
    return null;
  }

  return (
    <section
      ref={sectionRef}
      className="relative z-0 flex min-h-0 flex-1 flex-col overflow-hidden"
    >
      {/* Scroll layer: full-height segments drive active memory (below overlay). */}
      <div
        ref={scrollRef}
        className="absolute inset-0 z-0 touch-pan-y overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch] snap-y snap-mandatory scroll-smooth"
      >
        {items.map((item) => (
          <div
            aria-hidden
            className="w-full shrink-0 snap-start snap-always"
            key={item.memory.id}
            style={segmentStyle}
          />
        ))}
      </div>

      {/* Fixed presentation: centered sonic visual + info swap with scroll index */}
      <div className="relative z-[1] flex min-h-0 flex-1 flex-col pointer-events-none">
        <div className="flex min-h-0 flex-1 items-center justify-center overflow-visible px-0 pt-2">
          <div className="max-w-[min(120%,560px)] overflow-visible">
            <AbstractMemoryVisual
              bleed
              composition={activeMemory.composition}
              encounters={activeItem.encounters}
              gradientOnly
              key={activeMemory.id}
              size={visualSize}
              visualId={`archive-mobile-${activeMemory.id}`}
              {...activeMemory.visualization}
            />
          </div>
        </div>

        <div className="shrink-0 space-y-4 pb-1 pt-2 sm:gap-5 sm:pb-2 sm:pt-3 lg:gap-6 lg:pb-3 lg:pt-4">
          <div className="max-w-xl">
            <p className="font-body text-xs uppercase text-text-muted">
              {new Date(`${activeMemory.date}T12:00:00`).toLocaleDateString(
                "en",
                {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                },
              )}
            </p>
            <h2 className="mt-2 font-display text-[clamp(1.5rem,6vw,2.75rem)] leading-[1.1] tracking-[-0.04em] sm:mt-3 sm:text-[40px] sm:leading-[44px] lg:text-[clamp(2.25rem,4vw,4.25rem)] lg:leading-[1.05]">
              {encounterDayHeadline(activeMemory.totalEncounters, echoName)}
            </h2>
          </div>

          <div className="flex w-full justify-center px-4">
            <div className="pointer-events-auto rounded-full px-4 py-2.5">
              <TodayEncounterSoundPlayer
                date={activeMemory.date}
                device={null}
                encounters={activeItem.encounters}
                key={activeMemory.id}
                memory={activeMemory}
                title={new Date(activeMemory.date).toLocaleDateString("en", {
                  month: "short",
                  day: "numeric",
                })}
              />
            </div>
          </div>
          <div className="flex justify-center font-body text-xs tabular-nums text-text-muted">
            {String(activeIndex + 1).padStart(2, "0")} /{" "}
            {String(items.length).padStart(2, "0")}
          </div>
        </div>
      </div>
    </section>
  );
}
