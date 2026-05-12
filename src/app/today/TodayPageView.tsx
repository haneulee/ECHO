"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { AppShell } from "@/components/AppShell";
import { SoundMemoryPlayer } from "@/components/SoundMemoryPlayer";
import { TodayOrbitSection } from "@/app/today/TodayOrbitSection";
import type { TodayApiResponse } from "@/lib/todayApiTypes";
import { todayHero, todaySoundTitle } from "@/lib/uiPoetics";
import { formatCalendarEyebrow } from "@/lib/zonedDayRange";

function localIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

type LoadState =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ok"; data: TodayApiResponse };

function TodayDataBody() {
  const searchParams = useSearchParams();
  const deviceId = searchParams.get("deviceId");
  const date = searchParams.get("date") ?? localIsoDate(new Date());
  const timeZone = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone,
    [],
  );

  const [state, setState] = useState<LoadState>({ kind: "loading" });

  const load = useCallback(async () => {
    setState({ kind: "loading" });
    try {
      const qs = new URLSearchParams({ date, timeZone });
      if (deviceId) qs.set("deviceId", deviceId);
      const res = await fetch(`/api/today?${qs.toString()}`, {
        cache: "no-store",
        credentials: "include",
      });
      if (!res.ok) {
        const errBody = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        setState({
          kind: "error",
          message: errBody?.error ?? `Request failed (${res.status})`,
        });
        return;
      }
      const data = (await res.json()) as TodayApiResponse;
      setState({ kind: "ok", data });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Network error";
      setState({ kind: "error", message });
    }
  }, [date, deviceId, timeZone]);

  useEffect(() => {
    void load();
  }, [load]);

  const eyebrow = useMemo(
    () => formatCalendarEyebrow(date, timeZone),
    [date, timeZone],
  );

  const emptyDay =
    state.kind === "ok" &&
    state.data.encounters.length === 0 &&
    state.data.dailyMemory === null;

  const melody =
    state.kind === "ok" && state.data.dailyMemory
      ? state.data.dailyMemory.composition.voices.flatMap((v) => v.melody)
      : [];

  const showPlayer =
    state.kind === "ok" && state.data.dailyMemory && melody.length > 0;

  const hasEncounters =
    state.kind === "ok" && state.data.encounters.length > 0;

  const showOrbitSection = state.kind === "ok" && (hasEncounters || showPlayer);

  return (
    <AppShell
      eyebrow={eyebrow}
      intro={todayHero.intro}
      title={todayHero.title}
    >
      {state.kind === "loading" ? (
        <p className="mx-auto max-w-[920px] px-4 py-8 font-body text-sm text-text/70">
          {"Loading today's field…"}
        </p>
      ) : null}

      {state.kind === "error" ? (
        <div className="mx-auto max-w-[920px] space-y-4 px-4 py-8">
          <p className="font-body text-sm text-red-900/90">{state.message}</p>
          <button
            type="button"
            onClick={() => void load()}
            className="rounded-full border border-[#1a3a48]/30 bg-white px-4 py-2 font-body text-sm text-text transition hover:border-[#1a3a48]/50"
          >
            Try again
          </button>
        </div>
      ) : null}

      {state.kind === "ok" ? (
        <>
          {emptyDay ? (
            <p className="mx-auto max-w-[920px] px-4 pb-2 pt-1 font-body text-sm text-text/75">
              No encounters for this day yet. When your Echo syncs, orbits
              appear here.
            </p>
          ) : null}

          {showOrbitSection ? (
            <section className="relative isolate w-full overflow-visible pb-2">
              {hasEncounters ? (
                <TodayOrbitSection encounters={state.data.encounters} />
              ) : null}

              {showPlayer ? (
                <div
                  className={
                    hasEncounters
                      ? "relative z-30 mx-auto flex w-full max-w-[920px] justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-5 sm:pt-7"
                      : "relative z-30 mx-auto flex w-full max-w-[920px] justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-1 sm:pt-2"
                  }
                >
                  <div className="rounded-full border border-[#1a3a48]/25 bg-[#FFFCF7]/95 px-4 py-2.5 shadow-[0_12px_48px_rgba(38,35,31,0.14)] backdrop-blur-md">
                    <SoundMemoryPlayer
                      melody={melody}
                      title={todaySoundTitle}
                      variant="controlRow"
                    />
                  </div>
                </div>
              ) : null}
            </section>
          ) : null}
        </>
      ) : null}
    </AppShell>
  );
}

function TodayPageFallback() {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const eyebrow = formatCalendarEyebrow(localIsoDate(new Date()), timeZone);
  return (
    <AppShell
      eyebrow={eyebrow}
      intro={todayHero.intro}
      title={todayHero.title}
    >
      <p className="mx-auto max-w-[920px] px-4 py-8 font-body text-sm text-text/70">
        {"Loading today's field…"}
      </p>
    </AppShell>
  );
}

export function TodayPageView() {
  return (
    <Suspense fallback={<TodayPageFallback />}>
      <TodayDataBody />
    </Suspense>
  );
}
