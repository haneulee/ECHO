"use client";

import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";
import { useEffect } from "react";

import type { EchoType } from "@/lib/types";

type AppShellProps = {
  children: ReactNode;
  eyebrow?: string;
  title?: ReactNode;
  intro?: string;
  /** Fit content to the viewport height without page scroll (e.g. Archive). */
  viewportLocked?: boolean;
  /** Hide desktop nav + page header (e.g. immersive onboarding). */
  hideChrome?: boolean;
  /** Let immersive pages fill the browser without the shell max-width/padding. */
  fullBleed?: boolean;
  /** Apply a known Echo theme immediately when a page already has device data. */
  echoTheme?: EchoType | null;
};

type AuthState = {
  userId: string | null;
  echoType: EchoType | null;
};

type AuthMeResponse = {
  user?: { id: string } | null;
  echoType?: EchoType | null;
};

let cachedAuthState: AuthState | undefined;
let authStateRequest: Promise<AuthState> | null = null;

function applyEchoTheme(echoType: EchoType | null) {
  if (echoType) {
    document.documentElement.dataset.echoTheme = echoType;
  } else {
    delete document.documentElement.dataset.echoTheme;
  }
}

function loadAuthState(force = false): Promise<AuthState> {
  if (!force && cachedAuthState !== undefined) {
    return Promise.resolve(cachedAuthState);
  }
  authStateRequest ??= fetch("/api/auth/me", { credentials: "include" })
    .then((r) => r.json() as Promise<AuthMeResponse>)
    .then((d) => {
      cachedAuthState = {
        userId: d.user?.id ?? null,
        echoType: d.echoType ?? null,
      };
      return cachedAuthState;
    })
    .catch(() => {
      cachedAuthState = { userId: null, echoType: null };
      return cachedAuthState;
    })
    .finally(() => {
      authStateRequest = null;
    });
  return authStateRequest;
}

export function AppShell({
  children,
  eyebrow,
  title,
  intro,
  viewportLocked = false,
  hideChrome = false,
  fullBleed = false,
  echoTheme = null,
}: AppShellProps) {
  useEffect(() => {
    let cancelled = false;
    if (echoTheme) {
      applyEchoTheme(echoTheme);
      cachedAuthState = cachedAuthState
        ? { ...cachedAuthState, echoType: echoTheme }
        : { userId: null, echoType: echoTheme };
    } else if (cachedAuthState) {
      applyEchoTheme(cachedAuthState.echoType);
    }
    const shouldRefreshTheme =
      cachedAuthState?.userId !== null && cachedAuthState?.echoType === null;
    void loadAuthState(shouldRefreshTheme).then((state) => {
      if (cancelled) return;
      applyEchoTheme(state.echoType);
    });
    return () => {
      cancelled = true;
    };
  }, [echoTheme]);

  const mainPad = hideChrome
    ? fullBleed && viewportLocked
      ? "flex h-[100dvh] max-h-[100dvh] flex-col overflow-hidden"
      : viewportLocked
        ? "flex h-[100dvh] max-h-[100dvh] flex-col overflow-hidden px-6 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] sm:px-8 lg:px-12 lg:pb-[max(0.75rem,env(safe-area-inset-bottom))]"
        : "min-h-screen px-6 pb-24 pt-[max(1rem,env(safe-area-inset-top))] sm:px-8 lg:px-12 lg:pb-20"
    : viewportLocked
      ? "flex h-[100dvh] max-h-[100dvh] flex-col overflow-hidden pb-[calc(5.5rem+env(safe-area-inset-bottom))] lg:pb-10 lg:pt-28"
      : "min-h-screen pb-24 lg:pb-20 lg:pt-28";
  const showHeader = !hideChrome && Boolean(eyebrow || title || intro);

  return (
    <main
      className={[
        "mx-auto w-full min-w-0 overflow-x-clip text-text",
        hideChrome && fullBleed ? "max-w-none" : "max-w-7xl",
        hideChrome ? "" : "px-6 pt-6 sm:px-8 lg:px-12",
        mainPad,
      ].join(" ")}
    >
      <Link
        aria-label="Echo home"
        className="fixed left-4 top-[max(1rem,env(safe-area-inset-top))] z-50 inline-flex items-center justify-center sm:left-6 lg:left-8"
        href="/profile"
      >
        <Image
          alt=""
          aria-hidden
          className="h-15 w-15 shrink-0 rounded-full object-cover"
          height={40}
          src="/brand/gradation.png"
          width={40}
        />
        <span className="font-display text-3xl">Echo</span>
      </Link>

      {showHeader ? (
        <header
          className={[
            "relative z-10 grid shrink-0 gap-5 bg-transparent sm:gap-6 lg:grid-cols-[minmax(0,0.88fr)_minmax(300px,0.58fr)] lg:items-end",
            viewportLocked ? "mb-5 sm:mb-6 lg:mb-7" : "mb-9 sm:mb-11 lg:mb-14",
          ].join(" ")}
        >
          <div>
            {eyebrow ? (
              <p className="mb-3 font-body text-[11px] uppercase tracking-[0.36em] text-text-muted">
                {eyebrow}
              </p>
            ) : null}
            {title ? (
              <h1
                className={[
                  "max-w-3xl font-display tracking-[-0.035em]",
                  viewportLocked
                    ? "text-[32px] leading-[35px] sm:text-[42px] sm:leading-[45px] lg:text-[50px] lg:leading-[52px]"
                    : "text-[42px] leading-[44px] sm:text-[58px] sm:leading-[60px] lg:text-[76px] lg:leading-[76px]",
                ].join(" ")}
              >
                {title}
              </h1>
            ) : null}
          </div>
          {intro ? (
            <p
              className={[
                "max-w-sm font-body text-text-muted lg:pb-2",
                viewportLocked
                  ? "text-sm leading-5 lg:text-base lg:leading-6"
                  : "text-base leading-6 lg:text-lg lg:leading-7",
              ].join(" ")}
            >
              {intro}
            </p>
          ) : null}
        </header>
      ) : null}

      {viewportLocked ? (
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          {children}
        </div>
      ) : (
        children
      )}
    </main>
  );
}
