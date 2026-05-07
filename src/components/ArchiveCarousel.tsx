"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { mockEncounters } from "@/lib/mockData";
import type { DailyMemory } from "@/lib/types";
import { AbstractMemoryVisual } from "./AbstractMemoryVisual";
import { SoundMemoryPlayer } from "./SoundMemoryPlayer";

type ArchiveCarouselProps = {
  memories: DailyMemory[];
};

/** Slide width and SVG sizes stay in sync with translate math; tightened on small viewports for no-scroll layout. */
function useArchiveLayoutSizes() {
  const [{ slotWidth, activeSize, inactiveSize }, setSizes] = useState({
    slotWidth: 320,
    activeSize: 280,
    inactiveSize: 200,
  });

  useEffect(() => {
    function apply() {
      const w = window.innerWidth;
      if (w >= 1024) {
        setSizes({ slotWidth: 460, activeSize: 420, inactiveSize: 300 });
      } else if (w >= 640) {
        setSizes({ slotWidth: 380, activeSize: 340, inactiveSize: 250 });
      } else {
        setSizes({ slotWidth: 300, activeSize: 260, inactiveSize: 190 });
      }
    }
    apply();
    window.addEventListener("resize", apply);
    return () => window.removeEventListener("resize", apply);
  }, []);

  return { slotWidth, activeSize, inactiveSize };
}

export function ArchiveCarousel({ memories }: ArchiveCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const { slotWidth, activeSize, inactiveSize } = useArchiveLayoutSizes();
  const activeMemory = memories[activeIndex];
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [viewportWidth, setViewportWidth] = useState(0);

  const measureViewport = useCallback(() => {
    const el = viewportRef.current;
    if (!el) return;
    setViewportWidth(el.getBoundingClientRect().width);
  }, []);

  const setViewportRef = useCallback((node: HTMLDivElement | null) => {
    viewportRef.current = node;
    if (node) {
      setViewportWidth(node.getBoundingClientRect().width);
    } else {
      setViewportWidth(0);
    }
  }, []);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => measureViewport());
    ro.observe(el);
    return () => ro.disconnect();
  }, [measureViewport]);

  function move(direction: -1 | 1) {
    setActiveIndex((current) =>
      (current + direction + memories.length) % memories.length,
    );
  }

  const slideCenterPx = activeIndex * slotWidth + slotWidth / 2;
  /** `translateX(50%)` is 50% of the track width, not the viewport — use measured width. */
  const trackTranslateX =
    viewportWidth > 0 ? viewportWidth / 2 - slideCenterPx : 0;

  return (
    <section className="relative z-0 flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 flex items-center overflow-x-clip overflow-y-hidden"
          ref={setViewportRef}
        >
          <div
            className="flex h-full max-h-[min(42vh,520px)] min-h-[160px] w-max items-center transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] sm:max-h-[min(46vh,580px)] sm:min-h-[200px] lg:max-h-none lg:min-h-[280px]"
            style={{
              transform: `translateX(${trackTranslateX}px)`,
            }}
          >
            {memories.map((memory, index) => {
              const isActive = index === activeIndex;

              return (
                <div
                  className="relative grid shrink-0 place-items-center"
                  key={memory.id}
                  style={{
                    opacity: isActive ? 1 : 0.34,
                    transform: `scale(${isActive ? 1 : 0.78})`,
                    transition: "opacity 700ms ease, transform 700ms ease",
                    width: slotWidth,
                    minWidth: slotWidth,
                  }}
                >
                  <div className="relative">
                    <AbstractMemoryVisual
                      composition={memory.composition}
                      encounters={mockEncounters.slice(
                        0,
                        Math.max(1, memory.totalEncounters),
                      )}
                      showMutation={isActive}
                      size={isActive ? activeSize : inactiveSize}
                      {...memory.visualization}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="relative z-10 flex shrink-0 flex-col gap-4 pb-1 pt-2 sm:gap-5 lg:gap-6 lg:pb-3 lg:pt-4">
        <div className="max-w-xl">
          <p className="font-body text-xs uppercase tracking-[0.28em] text-text-muted">
            {new Date(activeMemory.date).toLocaleDateString("en", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
          <h2 className="mt-2 font-display text-[clamp(1.5rem,6vw,2.75rem)] leading-[1.1] tracking-[-0.04em] sm:mt-3 sm:text-[40px] sm:leading-[44px] lg:text-[clamp(2.25rem,4vw,4.25rem)] lg:leading-[1.05]">
            {activeMemory.totalEncounters} echoes passed near.
          </h2>
        </div>

        <div className="flex w-full items-center justify-center gap-2">
          <button
            aria-label="Previous archive memory"
            className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-[#26231F] text-xl text-white transition hover:scale-[1.03] lg:h-16 lg:w-16"
            onClick={() => move(-1)}
            type="button"
          >
            ←
          </button>
          <div className="min-w-0 flex-1">
            <SoundMemoryPlayer
              melody={activeMemory.composition.voices.flatMap(
                (voice) => voice.melody,
              )}
              title={new Date(activeMemory.date).toLocaleDateString("en", {
                month: "short",
                day: "numeric",
              })}
              variant="controlRow"
            />
          </div>
          <button
            aria-label="Next archive memory"
            className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-[#26231F] text-xl text-white transition hover:scale-[1.03] lg:h-16 lg:w-16"
            onClick={() => move(1)}
            type="button"
          >
            →
          </button>
        </div>
        <div className="flex justify-center font-body text-xs tabular-nums tracking-[0.2em] text-text-muted">
          {String(activeIndex + 1).padStart(2, "0")} /{" "}
          {String(memories.length).padStart(2, "0")}
        </div>
      </div>
    </section>
  );
}
