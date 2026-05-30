"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type ComponentProps } from "react";

import { EchoGradientLoader } from "@/components/EchoGradientLoader";

type NavigateWithLoaderProps = Omit<ComponentProps<typeof Link>, "onClick"> & {
  loaderLabel?: string;
};

export function NavigateWithLoader({
  href,
  loaderLabel = "Opening",
  className,
  children,
  ...rest
}: NavigateWithLoaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setPending(false);
  }, [pathname]);

  const onClick = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }
      event.preventDefault();
      setPending(true);
      router.push(typeof href === "string" ? href : href.toString());
    },
    [href, router],
  );

  return (
    <>
      <Link className={className} href={href} onClick={onClick} {...rest}>
        {children}
      </Link>
      {pending ? (
        <div
          aria-live="polite"
          className="fixed inset-0 z-[100] grid place-items-center bg-bg/55 backdrop-blur-sm"
          role="status"
        >
          <span className="sr-only">{loaderLabel}</span>
          <EchoGradientLoader size="md" />
        </div>
      ) : null}
    </>
  );
}
