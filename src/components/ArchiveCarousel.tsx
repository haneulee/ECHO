"use client";

import { useEffect, useState } from "react";
import { mockEncounters } from "@/lib/mockData";
import type { DailyMemory } from "@/lib/types";
import { AbstractMemoryVisual } from "./AbstractMemoryVisual";
import { SoundMemoryPlayer } from "./SoundMemoryPlayer";

type ArchiveCarouselProps = {
  memories: DailyMemory[];
};

/** Slide width must fit active visual (420) plus breathing room; must match translate math. */
function useCarouselSlotWidth() {
  const [slotWidth, setSlotWidth] = useState(360);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    function apply() {
      setSlotWidth(mq.matches ? 460 : 360);
    }
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  return slotWidth;
}

export function ArchiveCarousel({ memories }: ArchiveCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const slotWidth = useCarouselSlotWidth();
  const activeMemory = memories[activeIndex];

  function move(direction: -1 | 1) {
    setActiveIndex((current) =>
      (current + direction + memories.length) % memories.length,
    );
  }

  const slideCenterPx = activeIndex * slotWidth + slotWidth / 2;

  return (
    <section className="relative z-0 min-h-[480px] overflow-x-clip overflow-y-visible sm:min-h-[560px] lg:min-h-[720px]">
      <div className="pointer-events-none absolute inset-x-0 top-6 h-[380px] overflow-x-clip sm:top-8 sm:h-[440px] lg:top-8 lg:h-[620px]">
        <div
          className="flex h-full items-center transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{
            transform: `translateX(calc(50% - ${slideCenterPx}px))`,
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
                    size={isActive ? 420 : 300}
                    {...memory.visualization}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="relative z-10 flex flex-col gap-7 pb-4 pt-[400px] sm:gap-8 sm:pt-[420px] lg:min-h-[720px] lg:justify-end lg:gap-8 lg:pb-8 lg:pt-0">
        <div className="max-w-xl">
          <p className="font-body text-xs uppercase tracking-[0.28em] text-text-muted">
            {new Date(activeMemory.date).toLocaleDateString("en", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
          <h2 className="mt-3 font-display text-[40px] leading-[44px] tracking-[-0.04em] lg:text-[72px] lg:leading-[76px]">
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
        <div className="mt-2 flex justify-center font-body text-xs tabular-nums tracking-[0.2em] text-text-muted">
          {String(activeIndex + 1).padStart(2, "0")} /{" "}
          {String(memories.length).padStart(2, "0")}
        </div>
      </div>
    </section>
  );
}
