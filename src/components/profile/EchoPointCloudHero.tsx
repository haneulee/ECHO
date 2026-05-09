"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  EchoParticleInteraction,
  EchoParticleScene,
  type EchoParticleInteractionKind,
} from "@/three/echoParticleScene";
import type { EchoPersonalityVisual } from "@/three/imageParticleSystem";

export type EchoPointCloudHeroProps = {
  personality?: EchoPersonalityVisual;
  interaction?: EchoParticleInteractionKind;
  /** Map window pointer to the canvas plane (good for full-viewport heroes). */
  useWindowMouse?: boolean;
  /** Extra classes on the sizing wrapper (fills parent height). */
  className?: string;
};

/**
 * Image-derived point cloud. Parent should give explicit height (e.g. `aspect-square` + width).
 */
export function EchoPointCloudHero({
  personality = "drift",
  interaction = EchoParticleInteraction.OrbitControls,
  useWindowMouse = false,
  className,
}: EchoPointCloudHeroProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<EchoParticleScene | null>(null);
  const [sceneReady, setSceneReady] = useState(false);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let cancelled = false;
    const scene = new EchoParticleScene(canvas, {
      useWindowMouse,
      interaction,
    });
    sceneRef.current = scene;

    const initial = personality;
    void scene.bootstrap(initial).then(
      () => {
        if (cancelled) return;
        setSceneReady(true);
        scene.resizeNow();
        requestAnimationFrame(() => {
          if (!cancelled) {
            scene.resizeNow();
            requestAnimationFrame(() => {
              if (!cancelled) scene.resizeNow();
            });
          }
        });
      },
      (err) => {
        console.error("[EchoPointCloudHero] bootstrap failed", err);
      },
    );

    const wrap = wrapRef.current;
    const ro =
      wrap &&
      new ResizeObserver(() => {
        scene.resizeNow();
      });
    if (wrap && ro) ro.observe(wrap);

    requestAnimationFrame(() => {
      if (!cancelled) scene.resizeNow();
      requestAnimationFrame(() => {
        if (!cancelled) scene.resizeNow();
      });
    });

    return () => {
      cancelled = true;
      ro?.disconnect();
      scene.dispose();
      sceneRef.current = null;
      setSceneReady(false);
    };
    // personality: handled by `transitionTo` in the next effect; bootstrap only needs first paint.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- remount on interaction / mouse mode
  }, [interaction, useWindowMouse]);

  useEffect(() => {
    if (!sceneReady || !sceneRef.current) return;
    void sceneRef.current.transitionTo(personality);
  }, [personality, sceneReady]);

  return (
    <div
      ref={wrapRef}
      className={[
        "relative h-full min-h-0 w-full overflow-hidden",
        className ?? "",
      ].join(" ")}
    >
      <canvas
        ref={canvasRef}
        className="block h-full w-full touch-none"
        aria-hidden
      />
    </div>
  );
}
