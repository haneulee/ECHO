"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { AboutModal } from "@/components/AboutModal";
import { EchoSettingsDialog } from "@/components/EchoSettingsDialog";
import { MenuIcon } from "@/components/MenuIcon";
import type { EchoDevice } from "@/lib/types";

type AppAccountMenuProps = {
  device?: EchoDevice | null;
};

export function AppAccountMenu({ device }: AppAccountMenuProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [creditsOpen, setCreditsOpen] = useState(false);
  const [echoDevice, setEchoDevice] = useState(device ?? null);

  useEffect(() => {
    setEchoDevice(device ?? null);
  }, [device]);

  const logout = useCallback(async () => {
    setOpen(false);
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    router.push("/");
    router.refresh();
  }, [router]);

  return (
    <>
      <div className="relative">
        <button
          aria-expanded={open}
          aria-haspopup="menu"
          aria-label="Open menu"
          className="glass-panel glass-interactive grid h-10 w-10 place-items-center rounded-full text-text"
          onClick={() => setOpen((v) => !v)}
          type="button"
        >
          <MenuIcon />
        </button>
        {open ? (
          <>
            <button
              aria-label="Close menu"
              className="fixed inset-0 z-40 cursor-default"
              onClick={() => setOpen(false)}
              type="button"
            />
            <div
              className="glass-panel absolute right-0 top-[calc(100%+0.5rem)] z-50 min-w-[11rem] rounded-2xl py-2 font-body text-sm shadow-lg"
              role="menu"
            >
              {echoDevice ? (
                <button
                  className="glass-menu-item block w-full px-4 py-2.5 text-left"
                  onClick={() => {
                    setOpen(false);
                    setSettingsOpen(true);
                  }}
                  role="menuitem"
                  type="button"
                >
                  Echo settings
                </button>
              ) : null}
              <button
                className="glass-menu-item block w-full px-4 py-2.5 text-left"
                onClick={() => {
                  setOpen(false);
                  setCreditsOpen(true);
                }}
                role="menuitem"
                type="button"
              >
                About
              </button>
              <button
                className="glass-menu-item block w-full px-4 py-2.5 text-left text-text-muted"
                onClick={() => void logout()}
                role="menuitem"
                type="button"
              >
                Log out
              </button>
            </div>
          </>
        ) : null}
      </div>
      {echoDevice ? (
        <EchoSettingsDialog
          device={echoDevice}
          onClose={() => setSettingsOpen(false)}
          onSaved={(next) => {
            setEchoDevice(next);
            router.refresh();
          }}
          open={settingsOpen}
        />
      ) : null}
      <AboutModal onClose={() => setCreditsOpen(false)} open={creditsOpen} />
    </>
  );
}
