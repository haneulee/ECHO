"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import { AboutModal } from "@/components/AboutModal";
import { MenuIcon } from "@/components/MenuIcon";
import type { EchoDevice } from "@/lib/types";

type AppAccountMenuProps = {
  device?: EchoDevice | null;
};

function isCurrentPath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppAccountMenu({ device }: AppAccountMenuProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [creditsOpen, setCreditsOpen] = useState(false);

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
              {!isCurrentPath(pathname, "/main") ? (
                <Link
                  className="glass-menu-item block w-full px-4 py-2.5 text-left"
                  href="/main"
                  onClick={() => setOpen(false)}
                  role="menuitem"
                >
                  Home
                </Link>
              ) : null}
              {device && !isCurrentPath(pathname, "/my-echo") ? (
                <Link
                  className="glass-menu-item block w-full px-4 py-2.5 text-left"
                  href="/my-echo"
                  onClick={() => setOpen(false)}
                  role="menuitem"
                >
                  My Echo
                </Link>
              ) : null}
              {!isCurrentPath(pathname, "/memories") ? (
                <Link
                  className="glass-menu-item block w-full px-4 py-2.5 text-left"
                  href="/memories"
                  onClick={() => setOpen(false)}
                  role="menuitem"
                >
                  Memories
                </Link>
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
      <AboutModal onClose={() => setCreditsOpen(false)} open={creditsOpen} />
    </>
  );
}
