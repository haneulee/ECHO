"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";

import { useAppNavigation } from "@/components/NavigationLoadingProvider";

export function useAppRouter() {
  const router = useRouter();
  const { beginNavigation } = useAppNavigation();

  const push = useCallback(
    (href: string) => {
      beginNavigation(href);
      router.push(href);
    },
    [beginNavigation, router],
  );

  const replace = useCallback(
    (href: string, options?: { scroll?: boolean }) => {
      beginNavigation(href);
      router.replace(href, options);
    },
    [beginNavigation, router],
  );

  return { ...router, push, replace };
}
