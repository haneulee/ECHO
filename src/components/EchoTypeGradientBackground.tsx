"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";

import { AbstractMemoryVisual } from "@/components/AbstractMemoryVisual";
import {
  onboardingDemoComposition,
  onboardingDemoEncounters,
} from "@/lib/onboardingDemoData";
import { echoTypePageContent } from "@/lib/echoTypePageContent";
import type { DailyMemory, EchoType } from "@/lib/types";
import { getEchoColorPalette } from "@/lib/visualRules";

function compositionForType(type: EchoType): DailyMemory["composition"] {
  const base = onboardingDemoComposition;
  const voice =
    base.voices.find((entry) => entry.echoType === type) ?? base.voices[0]!;
  return {
    ...base,
    voices: [{ ...voice, presence: 1 }],
  };
}

function encountersForType(type: EchoType) {
  return onboardingDemoEncounters.map((encounter) => ({
    ...encounter,
    otherEchoType: type,
    otherEchoColor: undefined,
  }));
}

type EchoTypeGradientBackgroundProps = {
  echoType: EchoType;
};

export function EchoTypeGradientBackground({
  echoType,
}: EchoTypeGradientBackgroundProps) {
  const [progress, setProgress] = useState(0);
  const content = echoTypePageContent[echoType];
  const palette = getEchoColorPalette(echoType);
  const composition = useMemo(() => compositionForType(echoType), [echoType]);
  const encounters = useMemo(() => encountersForType(echoType), [echoType]);
  const encounterCount = Math.max(
    1,
    Math.min(
      encounters.length,
      Math.ceil(progress * encounters.length) || 1,
    ),
  );
  const visibleEncounters = useMemo(
    () => encounters.slice(0, encounterCount),
    [encounterCount, encounters],
  );

  useEffect(() => {
    let frame = 0;

    function update() {
      frame = 0;
      const maxScroll = Math.max(
        1,
        document.documentElement.scrollHeight - window.innerHeight,
      );
      setProgress(Math.min(1, Math.max(0, window.scrollY / maxScroll)));
    }

    function onScroll() {
      if (frame) return;
      frame = window.requestAnimationFrame(update);
    }

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div
      aria-hidden
      className="landing-gradient-bg echo-type-gradient-bg"
      style={
        {
          "--landing-scroll": progress,
          "--echo-type-a": palette[0],
          "--echo-type-b": palette[1],
          "--echo-type-c": palette[2],
        } as CSSProperties
      }
    >
      <div className="landing-gradient-visual echo-type-gradient-visual">
        <AbstractMemoryVisual
          bleed
          brightness={Math.min(0.95, content.visualization.brightness + 0.12)}
          composition={composition}
          density={Math.min(0.92, content.visualization.density + 0.1)}
          encounters={visibleEncounters}
          gradientMotion
          gradientOnly
          movement={content.visualization.movement}
          seed={content.visualization.seed}
          size={1280}
          visualId={`echo-type-${echoType}-bg`}
        />
      </div>
    </div>
  );
}
