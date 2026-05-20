"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

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
  const [authId, setAuthId] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => r.json())
      .then((d: { user?: { id: string } | null }) => {
        if (!cancelled) setAuthId(d.user?.id ?? null);
      })
      .catch(() => {
        if (!cancelled) setAuthId(null);
      })
      .finally(() => {
        if (!cancelled) setAuthReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    setAuthId(null);
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

  return (
    <main
      className={[
        "mx-auto w-full min-w-0 max-w-7xl overflow-x-clip text-text",
        hideChrome ? "" : "px-6 pt-6 sm:px-8 lg:px-12",
        mainPad,
      ].join(" ")}
    >
      {!hideChrome ? (
        <nav className="fixed inset-x-0 top-0 z-30 hidden bg-white/82 px-12 py-6 backdrop-blur-xl lg:block">
          <div className="mx-auto flex max-w-7xl items-center justify-between">
            <Link
              className="font-display flex items-center gap-3 text-2xl leading-7"
              href="/today"
            >
              <span aria-hidden className="flex items-center gap-2 opacity-90">
                {/* <img
                  alt=""
                  className="h-10 w-10 shrink-0"
                  height={40}
                  src="/brand/ECHO_logo_4.svg"
                  width={40}
                />
                <img
                  alt=""
                  className="h-8 w-auto shrink-0"
                  height={32}
                  src="/brand/ECHO_logo_2.svg"
                  width={127}
                /> */}
                <img
                  alt=""
                  className="h-8 w-auto shrink-0"
                  height={32}
                  src="/brand/ECHO_logo_1.svg"
                  width={127}
                />
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
          <img
            alt="ECHO"
            className="h-8 w-auto shrink-0"
            height={32}
            src="/brand/ECHO_logo_1.svg"
            width={127}
          />
        </Link>
      ) : null}

      {!hideChrome ? (
        <header
          className={[
            "relative z-10 grid shrink-0 gap-5 bg-white sm:gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(320px,0.55fr)] lg:items-end",
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
        <nav className="fixed inset-x-0 bottom-4 z-20 mx-auto w-[min(390px,calc(100%-32px))] rounded-full bg-white/88 p-2 shadow-quiet backdrop-blur lg:hidden">
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
