import Link from "next/link";
import type { ComponentProps } from "react";

type NavigateWithLoaderProps = ComponentProps<typeof Link> & {
  loaderLabel?: string;
};

/** Internal links — loading overlay is handled globally by NavigationLoadingProvider. */
export function NavigateWithLoader({
  loaderLabel: _loaderLabel,
  ...rest
}: NavigateWithLoaderProps) {
  return <Link {...rest} />;
}
