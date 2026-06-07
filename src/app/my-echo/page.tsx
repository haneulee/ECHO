import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { MyEchoView } from "@/app/my-echo/MyEchoView";
import { AppShell } from "@/components/AppShell";
import { getSession } from "@/lib/auth/session";
import { isLocalMockMode } from "@/lib/localMockMode";
import { getProfileDeviceContext } from "@/lib/profileDeviceService";
import { profileNoDevice } from "@/lib/uiPoetics";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "My Echo",
};

export default async function MyEchoPage() {
  const session = await getSession();
  if (!session && !isLocalMockMode()) {
    redirect("/login");
  }

  const userId = session?.userId ?? "local_mock";
  const ctx = await getProfileDeviceContext(userId);

  if (!ctx) {
    return (
      <AppShell pageTitle={profileNoDevice.title}>
        <p className="max-w-lg font-body text-sm leading-6 text-text/80">
          {profileNoDevice.body}
        </p>
        <Link
          className="glass-btn-primary mt-8 inline-flex rounded-full px-6 py-3 font-body text-sm"
          href={profileNoDevice.ctaHref}
        >
          {profileNoDevice.ctaLabel}
        </Link>
      </AppShell>
    );
  }

  const { device } = ctx;

  return (
    <AppShell
      echoColorTheme={device.echoColor}
      echoDevice={device}
      fullBleed
      hideChrome
      pageTitle="My Echo"
      viewportLocked
    >
      <MyEchoView device={device} />
    </AppShell>
  );
}
