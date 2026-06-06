"use client";

import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";
import { useEffect } from "react";

import { AppAccountMenu } from "@/components/AppAccountMenu";
import {
  applyEchoColorTheme,
  applyNeutralEchoTheme,
} from "@/lib/echoThemeColor";
import type { EchoDevice, EchoType } from "@/lib/types";

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
  echoColorTheme?: string | null;
  /** Keep this page neutral even when the signed-in user has a saved Echo color. */
  neutralTheme?: boolean;
  echoDevice?: EchoDevice | null;
  /** Show account menu (settings, info, logout). */
  showAccountMenu?: boolean;
  /** When set, shows a back link beside the menu (top right). */
  backHref?: string | null;
  /** Shown on the same row as the logo (overrides large header title). */
  pageTitle?: ReactNode;
  /** Optional controls beside the inline page title in the fixed header. */
  headerActions?: ReactNode;
};

type AuthState = {
  userId: string | null;
  echoType: EchoType | null;
  echoColor: string | null;
};

type AuthMeResponse = {
  user?: { id: string } | null;
  echoType?: EchoType | null;
  echoColor?: string | null;
};

let cachedAuthState: AuthState | undefined;
let authStateRequest: Promise<AuthState> | null = null;

function applyTheme(_echoType: EchoType | null, echoColor: string | null) {
  delete document.documentElement.dataset.echoTheme;
  applyEchoColorTheme(document.documentElement, echoColor);
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
        echoColor: d.echoColor ?? null,
      };
      return cachedAuthState;
    })
    .catch(() => {
      cachedAuthState = { userId: null, echoType: null, echoColor: null };
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
  echoColorTheme = null,
  neutralTheme = false,
  echoDevice = null,
  showAccountMenu = true,
  backHref = null,
  pageTitle = null,
  headerActions = null,
}: AppShellProps) {
  const inlineTitle = pageTitle ?? title ?? null;
  useEffect(() => {
    let cancelled = false;
    if (neutralTheme) {
      delete document.documentElement.dataset.echoTheme;
      applyNeutralEchoTheme(document.documentElement);
      return () => {
        cancelled = true;
      };
    }
    if (echoTheme) {
      applyTheme(echoTheme, echoColorTheme);
      cachedAuthState = cachedAuthState
        ? { ...cachedAuthState, echoColor: echoColorTheme, echoType: echoTheme }
        : { userId: null, echoColor: echoColorTheme, echoType: echoTheme };
    } else if (cachedAuthState) {
      applyTheme(cachedAuthState.echoType, cachedAuthState.echoColor);
    }
    const shouldRefreshTheme =
      cachedAuthState?.userId !== null &&
      cachedAuthState?.echoType === null &&
      cachedAuthState?.echoColor === null;
    void loadAuthState(shouldRefreshTheme).then((state) => {
      if (cancelled) return;
      applyTheme(state.echoType, state.echoColor);
    });
    return () => {
      cancelled = true;
    };
  }, [echoColorTheme, echoTheme, neutralTheme]);

  const mainPad = hideChrome
    ? fullBleed && viewportLocked
      ? "flex h-[100dvh] max-h-[100dvh] flex-col overflow-hidden"
      : viewportLocked
        ? "flex h-[100dvh] max-h-[100dvh] flex-col overflow-hidden px-6 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] sm:px-8 lg:px-12 lg:pb-[max(0.75rem,env(safe-area-inset-bottom))]"
        : "min-h-screen px-6 pb-24 pt-[max(1rem,env(safe-area-inset-top))] sm:px-8 lg:px-12 lg:pb-20"
    : viewportLocked
      ? "flex h-[100dvh] max-h-[100dvh] flex-col overflow-hidden pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-[max(5.5rem,calc(env(safe-area-inset-top)+5rem))] lg:pb-10 lg:pt-28"
      : "min-h-screen pb-24 pt-[max(5.5rem,calc(env(safe-area-inset-top)+5rem))] lg:pb-20 lg:pt-28";
  const showHeader = !hideChrome && Boolean(eyebrow || intro);

  return (
    <main
      className={[
        "mx-auto w-full min-w-0 text-text",
        fullBleed
          ? "max-w-none overflow-x-visible"
          : "max-w-7xl overflow-x-clip",
        hideChrome || fullBleed ? "" : "px-6 sm:px-8 lg:px-12",
        mainPad,
      ].join(" ")}
    >
      <div className="shell-header-bar fixed left-4 right-4 top-[max(1rem,env(safe-area-inset-top))] z-50 flex min-w-0 flex-nowrap items-center gap-x-2.5 sm:left-6 sm:right-[12rem] sm:gap-x-3.5 lg:left-8">
        <Link
          aria-label="Echo home"
          className="shell-brand inline-flex shrink-0 items-center gap-2.5"
          href="/main"
        >
          <Image
            alt=""
            aria-hidden
            className="h-100 w-100 shrink-0 object-contain"
            height={100}
            src="/brand/echo_logo.png"
            width={100}
          />
          {/* <span className="shell-brand-name font-display text-[1.35rem] leading-none tracking-[-0.03em]">
            Echo
          </span> */}
        </Link>
        {inlineTitle || headerActions ? (
          <div className="shell-title-row flex min-w-0 flex-nowrap items-center gap-1 overflow-hidden sm:gap-2">
            {inlineTitle ? (
              <>
                <span aria-hidden className="shell-title-sep">
                  /
                </span>
                <h1 className="shell-page-title min-w-0">{inlineTitle}</h1>
              </>
            ) : null}
            {headerActions ? (
              <>
                <span aria-hidden className="shell-title-sep">
                  /
                </span>
                {headerActions}
              </>
            ) : null}
          </div>
        ) : null}
      </div>
      {showAccountMenu || backHref ? (
        <div className="fixed right-4 top-[max(1rem,env(safe-area-inset-top))] z-50 flex items-center gap-2 sm:right-6 lg:right-8">
          {backHref ? (
            <Link
              aria-label="Go back"
              className="glass-panel glass-interactive hidden h-10 w-10 place-items-center rounded-full text-text sm:grid"
              href={backHref}
            >
              <span aria-hidden className="font-display text-2xl leading-none">
                ‹
              </span>
            </Link>
          ) : null}
          {showAccountMenu ? <AppAccountMenu device={echoDevice} /> : null}
        </div>
      ) : null}

      {showHeader ? (
        <header
          className={[
            "relative z-10 grid shrink-0 gap-5 bg-transparent sm:gap-6 lg:grid-cols-[minmax(0,0.88fr)_minmax(300px,0.58fr)] lg:items-end",
            fullBleed && !hideChrome ? "px-6 sm:px-8 lg:px-12" : "",
            viewportLocked ? "mb-5 sm:mb-6 lg:mb-7" : "mb-9 sm:mb-11 lg:mb-14",
          ].join(" ")}
        >
          <div>
            {eyebrow ? (
              <p className="mb-3 font-body text-[11px] uppercase text-text-muted">
                {eyebrow}
              </p>
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
