import type { Metadata } from "next";

import { AppShell } from "@/components/AppShell";
import { OnboardingFlow } from "@/components/OnboardingFlow";

export const metadata: Metadata = {
  title: "Onboarding",
};

export default function OnboardingPage() {
  return (
    <AppShell hideChrome neutralTheme showAccountMenu={false} viewportLocked>
      <OnboardingFlow />
    </AppShell>
  );
}
