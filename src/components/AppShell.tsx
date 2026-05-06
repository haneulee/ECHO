"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const navItems = [
  { href: "/today", label: "Today" },
  { href: "/profile", label: "My Echo" },
  { href: "/archive", label: "Archive" },
  { href: "/sound-test", label: "Sound" },
];

type AppShellProps = {
  children: ReactNode;
  eyebrow?: string;
  title?: string;
  intro?: string;
};

export function AppShell({
  children,
  eyebrow,
  title,
  intro,
}: AppShellProps) {
  const pathname = usePathname();

  return (
    <main className="mx-auto min-h-screen w-full min-w-0 max-w-7xl overflow-x-hidden px-6 pb-24 pt-6 text-text sm:px-8 lg:px-12 lg:pb-20 lg:pt-32">
      <nav className="fixed inset-x-0 top-0 z-30 hidden bg-white/82 px-12 py-6 backdrop-blur-xl lg:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link className="font-display text-2xl leading-7" href="/today">
            Echo
          </Link>
          <div className="flex items-center gap-8">
            {navItems.map((item) => {
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

      <header className="relative z-10 mb-8 grid gap-5 bg-white sm:mb-10 sm:gap-6 lg:mb-14 lg:grid-cols-[minmax(0,0.95fr)_minmax(320px,0.55fr)] lg:items-end">
        <div>
          {eyebrow ? (
            <p className="mb-3 font-body text-xs uppercase tracking-[0.32em] text-text-muted">
              {eyebrow}
            </p>
          ) : null}
          {title ? (
            <h1 className="max-w-3xl font-display text-[40px] leading-[44px] tracking-[-0.03em] sm:text-[56px] sm:leading-[60px] lg:text-[72px] lg:leading-[76px]">
              {title}
            </h1>
          ) : null}
        </div>
        {intro ? (
          <p className="max-w-md font-body text-base leading-6 text-text-muted lg:pb-2 lg:text-lg lg:leading-7">
            {intro}
          </p>
        ) : null}
      </header>

      {children}

      <nav className="fixed inset-x-0 bottom-4 z-20 mx-auto w-[min(390px,calc(100%-32px))] rounded-full bg-white/88 p-2 shadow-quiet backdrop-blur lg:hidden">
        <div className="grid grid-cols-4 gap-1">
          {navItems.map((item) => {
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
    </main>
  );
}
