"use client";

import { useEffect, useRef } from "react";

import type { Encounter } from "@/lib/types";

import { ResonanceOrbitExperience } from "./ResonanceOrbitExperience";

import "./sonicVisual.css";

type ResonanceOrbitCanvasProps = {
  encounters: Encounter[];
  className?: string;
};

export function ResonanceOrbitCanvas({
  encounters,
  className,
}: ResonanceOrbitCanvasProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const expRef = useRef<ResonanceOrbitExperience | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const exp = new ResonanceOrbitExperience(canvas, encounters);
    expRef.current = exp;

    exp.resizeNow();
    requestAnimationFrame(() => exp.resizeNow());

    const wrap = wrapRef.current;
    let ro: ResizeObserver | undefined;
    if (wrap && typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(() => exp.resizeNow());
      ro.observe(wrap);
    }

    return () => {
      ro?.disconnect();
      exp.dispose();
      expRef.current = null;
    };
  }, [encounters]);

  return (
    <div
      ref={wrapRef}
      className={[
        "sonic-visual-frame resonance-orbit-frame relative w-full overflow-hidden rounded-[3px]",
        className ?? "",
      ].join(" ")}
    >
      <canvas
        ref={canvasRef}
        className="sonic-visual-canvas block h-full w-full touch-none"
        aria-label="Today’s resonance orbit"
      />
    </div>
  );
}
