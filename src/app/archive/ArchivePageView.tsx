"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  ArchiveCarousel,
  type ArchiveCarouselItem,
} from "@/components/ArchiveCarousel";
import { AppShell } from "@/components/AppShell";
import { PageLoading } from "@/components/PageLoading";
import type { ArchiveApiResponse } from "@/lib/archiveApiTypes";
import { archiveHero } from "@/lib/uiPoetics";

type LoadState =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ok"; items: ArchiveCarouselItem[] };

const MIN_LOADING_MS = 650;

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function ArchiveBody() {
  const timeZone = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone,
    [],
  );

  const [state, setState] = useState<LoadState>({ kind: "loading" });

  const load = useCallback(async () => {
    const startedAt = performance.now();
    setState({ kind: "loading" });
    try {
      const qs = new URLSearchParams({ timeZone });
      const res = await fetch(`/api/archive?${qs.toString()}`, {
        cache: "no-store",
        credentials: "include",
      });
      if (!res.ok) {
        const errBody = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        await wait(Math.max(0, MIN_LOADING_MS - (performance.now() - startedAt)));
        setState({
          kind: "error",
          message: errBody?.error ?? `Request failed (${res.status})`,
        });
        return;
      }
      const data = (await res.json()) as ArchiveApiResponse;
      await wait(Math.max(0, MIN_LOADING_MS - (performance.now() - startedAt)));
      setState({ kind: "ok", items: data.items });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Network error";
      await wait(Math.max(0, MIN_LOADING_MS - (performance.now() - startedAt)));
      setState({ kind: "error", message });
    }
  }, [timeZone]);

  useEffect(() => {
    void load();
  }, [load]);

  if (state.kind === "loading") {
    return <PageLoading label="Loading archive" />;
  }

  return (
    <AppShell
      eyebrow={archiveHero.eyebrow}
      title={archiveHero.title}
      viewportLocked
    >
      {state.kind === "error" ? (
        <div className="space-y-4 px-1">
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
      {state.kind === "ok" && state.items.length === 0 ? (
        <p className="max-w-md px-1 font-body text-sm leading-6 text-text/80">
          No saved daily memories yet. When Echo writes a day to the database,
          it lands here in order.
        </p>
      ) : null}
      {state.kind === "ok" && state.items.length > 0 ? (
        <ArchiveCarousel items={state.items} />
      ) : null}
    </AppShell>
  );
}

export function ArchivePageView() {
  return <ArchiveBody />;
}
