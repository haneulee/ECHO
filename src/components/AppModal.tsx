"use client";

import type { ReactNode } from "react";

import { ModalCloseButton } from "@/components/ModalCloseButton";

const sizeClasses = {
  md: "max-w-md",
  lg: "max-h-[min(92dvh,calc(100dvh-2rem))] max-w-2xl sm:max-w-3xl lg:max-w-4xl",
  fullscreen: "h-[100dvh] max-h-[100dvh] w-full max-w-none rounded-none",
} as const;

export type AppModalSize = keyof typeof sizeClasses;

type AppModalProps = {
  open: boolean;
  onClose: () => void;
  /** Backdrop button accessible name. */
  closeBackdropLabel?: string;
  /** Top-right dismiss control label. */
  closeLabel?: string;
  size?: AppModalSize;
  /** Scroll long body content; keeps the footer pinned (use with `size="lg"`). */
  scrollBody?: boolean;
  children: ReactNode;
  footer?: ReactNode;
};

export const modalBtnPrimary =
  "glass-btn-primary rounded-full px-5 py-2.5 font-body text-sm disabled:opacity-50";

export function AppModal({
  open,
  onClose,
  closeBackdropLabel = "Close",
  closeLabel = "Close",
  size = "md",
  scrollBody = false,
  children,
  footer,
}: AppModalProps) {
  if (!open) return null;

  const isFullscreen = size === "fullscreen";

  const dialogClass = [
    "glass-panel relative z-10 w-full overflow-hidden text-left text-text",
    isFullscreen ? "shadow-none" : "rounded-3xl shadow-2xl",
    scrollBody ? "flex flex-col" : "",
    sizeClasses[size],
  ]
    .filter(Boolean)
    .join(" ");

  const bodyClass = scrollBody
    ? "min-h-0 flex-1 overflow-y-auto overscroll-contain p-6 pt-12 sm:p-8 sm:pt-14"
    : "p-6 pt-12";

  return (
    <div
      className={
        isFullscreen
          ? "fixed inset-0 z-[90]"
          : "fixed inset-0 z-[90] grid place-items-center p-4"
      }
    >
      {!isFullscreen ? (
        <button
          aria-label={closeBackdropLabel}
          className="absolute inset-0 bg-text/20 backdrop-blur-[2px]"
          onClick={onClose}
          type="button"
        />
      ) : null}
      <dialog className={dialogClass} open>
        <ModalCloseButton
          className={
            isFullscreen
              ? "absolute right-4 top-[max(1rem,env(safe-area-inset-top))] z-10 sm:right-6"
              : "absolute right-4 top-4 z-10 sm:right-5 sm:top-5"
          }
          label={closeLabel}
          onClose={onClose}
        />
        <div className={bodyClass}>{children}</div>
        {footer ? (
          <div className="modal-actions shrink-0 border-t border-text/8 px-6 py-3">
            {footer}
          </div>
        ) : null}
      </dialog>
    </div>
  );
}
