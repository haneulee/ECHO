"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

import {
  ShellEcologyExperience,
  type ShellEcologyParticleDensity,
} from "@/profile-ecology/Experience";
import type { EcologyPersonalityId } from "@/profile-ecology/types";

import "@/profile-ecology/styles.css";

export type EchoShellParticlesProps = {
  personality: EcologyPersonalityId;
  /**
   * `lite`: 아이코 + 피보나치 ~5만 전후 (기본).
   * `heavy`: 초밀도 (~36만+) — 성능 부담 큼.
   */
  particleDensity?: ShellEcologyParticleDensity;
  className?: string;
  "aria-label"?: string;
};

/** 포인트 클라우드 셸 — 파티클 수는 `particleDensity`로 조절 (`lite` 권장). */
export function EchoShellParticles({
  personality,
  particleDensity = "lite",
  className,
  "aria-label": ariaLabel = "Echo shell companion",
}: EchoShellParticlesProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const expRef = useRef<ShellEcologyExperience | null>(null);
  const [ready, setReady] = useState(false);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let cancelled = false;
    const exp = new ShellEcologyExperience(
      canvas,
      personality,
      particleDensity,
    );
    expRef.current = exp;

    exp.resizeNow();
    requestAnimationFrame(() => {
      if (!cancelled) {
        exp.resizeNow();
        requestAnimationFrame(() => {
          if (!cancelled) exp.resizeNow();
        });
      }
    });

    const wrap = wrapRef.current;
    const ro =
      wrap &&
      new ResizeObserver(() => {
        exp.resizeNow();
      });
    if (wrap && ro) ro.observe(wrap);

    setReady(true);

    return () => {
      cancelled = true;
      ro?.disconnect();
      exp.dispose();
      expRef.current = null;
      setReady(false);
    };
    // personality는 `setPersonality`로 반영 — canvas는 밀도 변경 시만 재생성
    // eslint-disable-next-line react-hooks/exhaustive-deps -- see above
  }, [particleDensity]);

  useEffect(() => {
    if (!ready || !expRef.current) return;
    expRef.current.setPersonality(personality);
  }, [personality, ready]);

  return (
    <div
      ref={wrapRef}
      aria-label={ariaLabel}
      className={["echo-shell-ecology", className ?? ""].join(" ")}
      role="img"
    >
      <canvas ref={canvasRef} className="block h-full w-full" aria-hidden />
    </div>
  );
}
