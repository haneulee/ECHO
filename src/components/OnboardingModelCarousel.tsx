"use client";

import { useEffect, useRef, useState } from "react";
import { AbstractMemoryVisual } from "@/components/AbstractMemoryVisual";
import { SoundMemoryPlayer } from "@/components/SoundMemoryPlayer";
import {
  onboardingDemoComposition,
  onboardingDemoEncounters,
} from "@/lib/onboardingDemoData";
import { echoTypeDescriptions, echoTypeLabels } from "@/lib/echoTypeMeta";
import type { DailyMemory, EchoType } from "@/lib/types";
import { getEchoColorPalette } from "@/lib/visualRules";

/** Stable scroll order for onboarding model picker (matches copy flow). */
export const ONBOARDING_MODEL_ORDER: EchoType[] = ["shy", "messy", "bounce"];

const modelVisualization: Record<
  EchoType,
  Pick<
    DailyMemory["visualization"],
    "seed" | "density" | "brightness" | "movement"
  >
> = {
  shy: { seed: 3140, density: 0.36, brightness: 0.72, movement: 0.2 },
  messy: { seed: 912, density: 0.54, brightness: 0.58, movement: 0.28 },
  bounce: { seed: 4286, density: 0.68, brightness: 0.74, movement: 0.42 },
};

function compositionHighlighting(
  type: EchoType,
): DailyMemory["composition"] {
  const base = onboardingDemoComposition;
  const voices = base.voices.map((v) => ({
    ...v,
    presence:
      v.echoType === type
        ? Math.min(1, v.presence + 0.35)
        : Math.max(0.08, v.presence * 0.45),
  }));
  const sum = voices.reduce((s, v) => s + v.presence, 0);
  const normalized = voices.map((v) => ({
    ...v,
    presence: v.presence / sum,
  }));
  return { ...base, voices: normalized };
}

function encountersForModel(type: EchoType) {
  return onboardingDemoEncounters.map((encounter) => ({
    ...encounter,
    otherEchoType: type,
  }));
}

function melodyForModel(type: EchoType): string[] {
  const voice = onboardingDemoComposition.voices.find(
    (v) => v.echoType === type,
  );
  return (
    voice?.melody ?? onboardingDemoComposition.voices[0].melody
  );
}

/** Slightly different pacing per model so previews feel distinct. */
const modelTempoBpm: Record<EchoType, number> = {
  shy: 48,
  messy: 52,
  bounce: 56,
};

/** Shared responsive SVG size for onboarding visuals (model pick + name steps). */
export function useOnboardingVisualSize() {
  const [size, setSize] = useState(340);

  useEffect(() => {
    function apply() {
      const w = window.innerWidth;
      if (w >= 1024) setSize(448);
      else if (w >= 640) setSize(368);
      else setSize(300);
    }
    apply();
    window.addEventListener("resize", apply);
    return () => window.removeEventListener("resize", apply);
  }, []);

  return size;
}

type OnboardingModelCarouselProps = {
  className?: string;
  onActiveIndexChange?: (index: number) => void;
};

export function OnboardingModelCarousel({
  className,
  onActiveIndexChange,
}: OnboardingModelCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const visualSize = useOnboardingVisualSize();
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const sectionRef = useRef<HTMLElement | null>(null);
  const [segmentPx, setSegmentPx] = useState(0);

  const activeType = ONBOARDING_MODEL_ORDER[activeIndex];
  const activePalette = getEchoColorPalette(activeType);

  const indexChangeRef = useRef(onActiveIndexChange);
  indexChangeRef.current = onActiveIndexChange;

  useEffect(() => {
    indexChangeRef.current?.(activeIndex);
  }, [activeIndex]);

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
    if (!el || segmentPx <= 0) return;

    const onScroll = () => {
      const idx = Math.min(
        ONBOARDING_MODEL_ORDER.length - 1,
        Math.max(0, Math.round(el.scrollTop / segmentPx)),
      );
      setActiveIndex(idx);
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => el.removeEventListener("scroll", onScroll);
  }, [segmentPx]);

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

  return (
    <section
      ref={sectionRef}
      className={[
        "relative z-0 flex min-h-0 flex-1 flex-col overflow-hidden",
        className ?? "",
      ].join(" ")}
    >
      <div
        ref={scrollRef}
        className="absolute inset-0 z-0 touch-pan-y overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch] snap-y snap-mandatory scroll-smooth"
      >
        {ONBOARDING_MODEL_ORDER.map((type) => (
          <div
            aria-hidden
            className="w-full shrink-0 snap-start snap-always"
            key={type}
            style={segmentStyle}
          />
        ))}
      </div>

      <div className="relative z-[1] flex min-h-0 flex-1 flex-col pointer-events-none">
        {/* Anchor visual toward the copy strip on mobile so it reads lower on screen */}
        <div className="flex min-h-0 flex-1 flex-col items-center justify-end px-4 pb-3 pt-2 sm:justify-center sm:pb-2 sm:pt-1">
          <div className="flex w-full max-w-[min(100%,520px)] justify-center">
            <AbstractMemoryVisual
              composition={compositionHighlighting(activeType)}
              encounters={encountersForModel(activeType)}
              key={activeType}
              showMutation
              size={visualSize}
              {...modelVisualization[activeType]}
            />
          </div>
        </div>

        {/* Copy sits immediately above play/volume; step counter below controls */}
        <div className="shrink-0 px-4 pb-2 pt-0 sm:pb-3 lg:pb-4">
          <div className="mx-auto flex w-full max-w-xl flex-col gap-2">
            <div className="max-w-xl">
              <p className="h-4 font-body text-xs uppercase leading-4 tracking-[0.28em] text-text-muted">
                Choose your color
              </p>
              <h2 className="mt-2 flex min-h-[3rem] items-center font-display text-[clamp(1.5rem,6vw,2.75rem)] leading-[1.1] tracking-[-0.04em] sm:mt-3 sm:min-h-[3.25rem] sm:text-[40px] sm:leading-[44px] lg:min-h-[3.5rem] lg:text-[clamp(2.25rem,4vw,4.25rem)] lg:leading-[1.05]">
                {echoTypeLabels[activeType]}
              </h2>
              <div
                aria-label={`${echoTypeLabels[activeType]} color palette`}
                className="mt-3 flex gap-2"
              >
                {activePalette.map((color) => (
                  <span
                    aria-hidden
                    className="h-5 w-5 rounded-full border border-text/10"
                    key={color}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <p className="mt-3 max-w-lg font-body text-sm leading-6 text-text-muted sm:min-h-[5.5rem] sm:text-base sm:leading-7 lg:min-h-[5rem]">
                {echoTypeDescriptions[activeType]}
              </p>
            </div>

            <div className="flex w-full justify-center pointer-events-auto">
              <SoundMemoryPlayer
                key={activeType}
                melody={melodyForModel(activeType)}
                tempoBpm={modelTempoBpm[activeType]}
                title={echoTypeLabels[activeType]}
                variant="controlRow"
              />
            </div>
          </div>

          <div className="mt-3 flex justify-center font-body text-xs tabular-nums tracking-[0.2em] text-text-muted sm:mt-4">
            {String(activeIndex + 1).padStart(2, "0")} /{" "}
            {String(ONBOARDING_MODEL_ORDER.length).padStart(2, "0")}
          </div>
        </div>
      </div>
    </section>
  );
}
