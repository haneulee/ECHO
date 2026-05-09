import { AppShell } from "@/components/AppShell";
import { OnboardingFlow } from "@/components/OnboardingFlow";

export default function OnboardingPage() {
  return (
    <AppShell eyebrow="Onboarding" viewportLocked>
      <OnboardingFlow />
    </AppShell>
  );
}
