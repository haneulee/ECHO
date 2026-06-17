"use client";

import {
  createContext,
  Suspense,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useSearchParams } from "next/navigation";

import { EchoGradientLoader } from "@/components/EchoGradientLoader";

const MIN_NAV_LOADING_MS = 0;

type NavTarget = {
  pathname: string;
  search: string;
};

type NavigationLoadingContextValue = {
  beginNavigation: (href: string) => void;
  setPageLoading: (loading: boolean) => void;
};

const NavigationLoadingContext =
  createContext<NavigationLoadingContextValue | null>(null);

function normalizeNavTarget(href: string): NavTarget {
  const url = new URL(href, "http://echo.local");
  return { pathname: url.pathname, search: url.search };
}

function navTargetsMatch(current: NavTarget, target: NavTarget): boolean {
  if (current.pathname !== target.pathname) return false;
  if (!target.search) return !current.search;
  return current.search === target.search;
}

function isModifiedClick(event: MouseEvent): boolean {
  return (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  );
}

function NavigationLoadingProviderInner({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const [navTarget, setNavTarget] = useState<NavTarget | null>(null);
  const [pageLoading, setPageLoadingState] = useState(false);
  const startedAtRef = useRef(0);
  const clearTimerRef = useRef<number | null>(null);

  const beginNavigation = useCallback((href: string) => {
    if (clearTimerRef.current !== null) {
      window.clearTimeout(clearTimerRef.current);
      clearTimerRef.current = null;
    }
    const target = normalizeNavTarget(href);
    const current = normalizeNavTarget(
      `${window.location.pathname}${window.location.search}`,
    );
    if (navTargetsMatch(current, target)) return;
    startedAtRef.current = performance.now();
    setNavTarget(target);
  }, []);

  const setPageLoading = useCallback((loading: boolean) => {
    setPageLoadingState(loading);
  }, []);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (isModifiedClick(event)) return;
      const anchor = (event.target as Element | null)?.closest("a[href]");
      if (!anchor || anchor.getAttribute("target") === "_blank") return;
      const href = anchor.getAttribute("href");
      if (!href || !href.startsWith("/") || href.startsWith("//")) return;
      beginNavigation(href);
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [beginNavigation]);

  useEffect(() => {
    if (!navTarget) return;

    const current: NavTarget = {
      pathname,
      search: search ? `?${search}` : "",
    };
    if (!navTargetsMatch(current, navTarget)) return;

    if (pageLoading) {
      if (clearTimerRef.current !== null) {
        window.clearTimeout(clearTimerRef.current);
        clearTimerRef.current = null;
      }
      return;
    }

    const elapsed = performance.now() - startedAtRef.current;
    const delay = Math.max(0, MIN_NAV_LOADING_MS - elapsed);
    clearTimerRef.current = window.setTimeout(() => {
      setNavTarget(null);
      clearTimerRef.current = null;
    }, delay);

    return () => {
      if (clearTimerRef.current !== null) {
        window.clearTimeout(clearTimerRef.current);
        clearTimerRef.current = null;
      }
    };
  }, [navTarget, pageLoading, pathname, search]);

  const showOverlay = navTarget !== null || pageLoading;

  return (
    <NavigationLoadingContext.Provider
      value={{ beginNavigation, setPageLoading }}
    >
      {children}
      {showOverlay ? (
        <div
          aria-live="polite"
          className="fixed inset-0 z-[120] grid place-items-center bg-bg/55 backdrop-blur-sm"
          role="status"
        >
          <span className="sr-only">Loading</span>
          <EchoGradientLoader size="md" />
        </div>
      ) : null}
    </NavigationLoadingContext.Provider>
  );
}

export function NavigationLoadingProvider({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <Suspense fallback={null}>
      <NavigationLoadingProviderInner>{children}</NavigationLoadingProviderInner>
    </Suspense>
  );
}

export function useRouteLoading(loading: boolean) {
  const ctx = useContext(NavigationLoadingContext);
  useLayoutEffect(() => {
    if (!ctx) return;
    ctx.setPageLoading(loading);
    return () => ctx.setPageLoading(false);
  }, [ctx, loading]);
}

export function useAppNavigation() {
  const ctx = useContext(NavigationLoadingContext);
  return {
    beginNavigation: ctx?.beginNavigation ?? (() => undefined),
  };
}
