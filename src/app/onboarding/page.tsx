import { AppShell } from "@/components/AppShell";
import { OnboardingFlow } from "@/components/OnboardingFlow";

export default function OnboardingPage() {
  return (
    <AppShell hideChrome viewportLocked>
      <OnboardingFlow />
    </AppShell>
  );
}
