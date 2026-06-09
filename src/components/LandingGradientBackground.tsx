"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";

import { AbstractMemoryVisual } from "@/components/AbstractMemoryVisual";
import { mockDailyMemory, mockEncounters } from "@/lib/mockData";

const { density, brightness, movement, seed } = mockDailyMemory.visualization;

export function LandingGradientBackground() {
  const [progress, setProgress] = useState(0);

  const encounterCount = Math.max(
    1,
    Math.min(
      mockEncounters.length,
      Math.ceil(progress * mockEncounters.length) || 1,
    ),
  );
  const visibleEncounters = useMemo(
    () => mockEncounters.slice(0, encounterCount),
    [encounterCount],
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
      className="landing-gradient-bg"
      style={
        {
          "--landing-scroll": progress,
        } as CSSProperties
      }
    >
      <div className="landing-gradient-visual">
        <AbstractMemoryVisual
          bleed
          brightness={brightness}
          composition={mockDailyMemory.composition}
          density={density}
          encounters={visibleEncounters}
          gradientMotion
          gradientOnly
          movement={movement}
          seed={seed}
          size={880}
          visualId="landing-scroll-memory"
        />
      </div>
    </div>
  );
}
