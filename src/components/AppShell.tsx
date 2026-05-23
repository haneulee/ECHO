"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

import type { EchoType } from "@/lib/types";
import { navItems } from "@/lib/uiPoetics";

type AppShellProps = {
  children: ReactNode;
  eyebrow?: string;
  title?: ReactNode;
  intro?: string;
  /** Fit content to the viewport height without page scroll (e.g. Archive). */
  viewportLocked?: boolean;
  /** Hide desktop nav + page header (e.g. immersive onboarding). */
  hideChrome?: boolean;
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
}: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [authId, setAuthId] = useState<string | null>(
    cachedAuthState?.userId ?? null,
  );
  const [authReady, setAuthReady] = useState(cachedAuthState !== undefined);

  useEffect(() => {
    let cancelled = false;
    if (cachedAuthState) {
      applyEchoTheme(cachedAuthState.echoType);
    }
    const shouldRefreshTheme =
      cachedAuthState?.userId !== null && cachedAuthState?.echoType === null;
    void loadAuthState(shouldRefreshTheme).then((state) => {
      if (cancelled) return;
      setAuthId(state.userId);
      setAuthReady(true);
      applyEchoTheme(state.echoType);
    });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    cachedAuthState = { userId: null, echoType: null };
    authStateRequest = null;
    setAuthId(null);
    setAuthReady(true);
    applyEchoTheme(null);
    router.push("/");
    router.refresh();
  }

  const mainPad = hideChrome
    ? viewportLocked
      ? "flex h-[100dvh] max-h-[100dvh] flex-col overflow-hidden px-6 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] sm:px-8 lg:px-12 lg:pb-[max(0.75rem,env(safe-area-inset-bottom))]"
      : "min-h-screen px-6 pb-24 pt-[max(1rem,env(safe-area-inset-top))] sm:px-8 lg:px-12 lg:pb-20"
    : viewportLocked
      ? "flex h-[100dvh] max-h-[100dvh] flex-col overflow-hidden pb-[calc(5.5rem+env(safe-area-inset-bottom))] lg:pb-10 lg:pt-32"
      : "min-h-screen pb-24 lg:pb-20 lg:pt-32";
  const showHeader = !hideChrome && Boolean(eyebrow || title || intro);

  return (
    <main
      className={[
        "mx-auto w-full min-w-0 max-w-7xl overflow-x-clip text-text",
        hideChrome ? "" : "px-6 pt-6 sm:px-8 lg:px-12",
        mainPad,
      ].join(" ")}
    >
      {!hideChrome ? (
        <nav className="fixed inset-x-0 top-0 z-30 hidden bg-transparent px-12 py-6 lg:block">
          <div className="mx-auto flex max-w-7xl items-center justify-between">
            <Link
              className="font-display flex items-center gap-3 text-2xl leading-7"
              href="/today"
            >
              <span aria-hidden className="flex items-center opacity-90">
                <Image
                  alt=""
                  className="h-14 w-14 shrink-0 rounded-full object-cover"
                  height={56}
                  src="/brand/gradation.png"
                  width={56}
                />
                <span className="text-2xl font-bold">Echo</span>
              </span>
            </Link>
            <div className="flex items-center gap-8">
              {navItems.map((item) => {
                if (item.kind === "account") {
                  if (!authReady) return null;
                  if (authId) {
                    return (
                      <button
                        className="font-body text-sm text-text-muted transition hover:text-text"
                        key="account"
                        type="button"
                        onClick={() => void signOut()}
                      >
                        {item.signedInLabel}
                      </button>
                    );
                  }
                  return (
                    <Link
                      className="font-body text-sm text-nav-active transition hover:opacity-90"
                      href="/login"
                      key="account"
                    >
                      {item.signedOutLabel}
                    </Link>
                  );
                }
                const isActive = pathname === item.href;

                return (
                  <Link
                    className={[
                      "font-body text-sm leading-5 transition",
                      isActive
                        ? "text-nav-active"
                        : "text-nav-inactive hover:text-text",
                    ].join(" ")}
                    href={item.href}
                    key={item.href}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>
      ) : null}

      {!hideChrome ? (
        <Link className="mb-8 inline-flex items-center lg:hidden" href="/today">
          <Image
            alt="ECHO"
            className="h-12 w-12 shrink-0 rounded-full object-cover"
            height={48}
            src="/brand/gradation.png"
            width={48}
          />
        </Link>
      ) : null}

      {showHeader ? (
        <header
          className={[
            "relative z-10 grid shrink-0 gap-5 bg-transparent sm:gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(320px,0.55fr)] lg:items-end",
            viewportLocked ? "mb-4 sm:mb-5 lg:mb-8" : "mb-8 sm:mb-10 lg:mb-14",
          ].join(" ")}
        >
          <div>
            {eyebrow ? (
              <p className="mb-3 font-body text-xs uppercase tracking-[0.32em] text-text-muted">
                {eyebrow}
              </p>
            ) : null}
            {title ? (
              <h1
                className={[
                  "max-w-3xl font-display tracking-[-0.03em]",
                  viewportLocked
                    ? "text-[30px] leading-[34px] sm:text-[40px] sm:leading-[44px] lg:text-[48px] lg:leading-[52px]"
                    : "text-[40px] leading-[44px] sm:text-[56px] sm:leading-[60px] lg:text-[72px] lg:leading-[76px]",
                ].join(" ")}
              >
                {title}
              </h1>
            ) : null}
          </div>
          {intro ? (
            <p
              className={[
                "max-w-md font-body text-text-muted lg:pb-2",
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

      {!hideChrome ? (
        <nav className="fixed inset-x-0 bottom-4 z-20 mx-auto w-[min(390px,calc(100%-32px))] rounded-full bg-surface/88 p-2 shadow-quiet backdrop-blur lg:hidden">
          <div className="grid grid-cols-4 gap-1">
            {navItems.map((item) => {
              if (item.kind === "account") {
                if (!authReady) {
                  return (
                    <div
                      aria-hidden
                      className="rounded-full px-2 py-3"
                      key="account"
                    />
                  );
                }
                if (authId) {
                  return (
                    <button
                      className="rounded-full px-2 py-3 text-center font-body text-[11px] leading-4 text-text-muted transition hover:bg-surface-soft hover:text-text"
                      key="account"
                      type="button"
                      onClick={() => void signOut()}
                    >
                      {item.signedInLabel}
                    </button>
                  );
                }
                const loginActive = pathname === "/login";
                return (
                  <Link
                    className={[
                      "rounded-full px-2 py-3 text-center font-body text-[11px] leading-4 transition",
                      loginActive
                        ? "bg-nav-active text-white"
                        : "text-nav-inactive",
                    ].join(" ")}
                    href="/login"
                    key="account"
                  >
                    {item.signedOutLabel}
                  </Link>
                );
              }
              const isActive = pathname === item.href;

              return (
                <Link
                  className={[
                    "rounded-full px-2 py-3 text-center font-body text-[11px] leading-4 transition",
                    isActive ? "bg-nav-active text-white" : "text-nav-inactive",
                  ].join(" ")}
                  href={item.href}
                  key={item.href}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      ) : null}
    </main>
  );
}
