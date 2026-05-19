import { redirect } from "next/navigation";

import { AppShell } from "@/components/AppShell";
import { EvolutionCard } from "@/components/EvolutionCard";
import { getSession } from "@/lib/auth/session";
import { isLocalMockMode } from "@/lib/localMockMode";
import { getProfileDeviceContext } from "@/lib/profileDeviceService";
import { evolutionPageHero } from "@/lib/uiPoetics";

export const dynamic = "force-dynamic";

export default async function EvolutionPage() {
  const session = await getSession();
  if (!session && !isLocalMockMode()) {
    redirect("/login");
  }
  const userId = session?.userId ?? "local_mock";
  const ctx = await getProfileDeviceContext(userId);

  if (!ctx) {
    return (
      <AppShell
        eyebrow={evolutionPageHero.eyebrow}
        intro={evolutionPageHero.intro}
        title={evolutionPageHero.title("Echo")}
      >
        <p className="max-w-lg font-body text-sm text-text/80">
          No device for this user yet.
        </p>
      </AppShell>
    );
  }

  const { device, evolutions } = ctx;

  return (
    <AppShell
      eyebrow={evolutionPageHero.eyebrow}
      intro={evolutionPageHero.intro}
      title={evolutionPageHero.title(device.echoName)}
    >
      {evolutions.length === 0 ? (
        <p className="font-body text-sm text-text/75">
          No evolutions recorded yet.
        </p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {evolutions.map((evolution) => (
            <EvolutionCard
              echoName={device.echoName}
              evolution={evolution}
              key={evolution.id}
            />
          ))}
        </div>
      )}
    </AppShell>
  );
}
