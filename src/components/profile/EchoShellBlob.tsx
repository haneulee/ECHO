"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { ShellBlobExperience } from "@/profile-ecology/BlobExperience";
import type { EcologyPersonalityId } from "@/profile-ecology/types";

import "@/profile-ecology/styles.css";

export type EchoShellBlobProps = {
  personality: EcologyPersonalityId;
  className?: string;
  "aria-label"?: string;
};

/** 단일 연속 메시 블롭 — 포인트가 아닌 한 덩어리 표면. */
export function EchoShellBlob({
  personality,
  className,
  "aria-label": ariaLabel = "Echo shell blob",
}: EchoShellBlobProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const expRef = useRef<ShellBlobExperience | null>(null);
  const [ready, setReady] = useState(false);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let cancelled = false;
    const exp = new ShellBlobExperience(canvas, personality);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- bootstrap once
  }, []);

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
