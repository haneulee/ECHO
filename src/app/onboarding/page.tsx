import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { echoTypeDescriptions, echoTypeLabels, mockEchoDevice } from "@/lib/mockData";
import type { EchoType } from "@/lib/types";

const steps = [
  {
    title: "Wake the small companion.",
    body: "Place Echo near the phone. The first connection is quiet and local in this mock flow.",
  },
  {
    title: "Choose its first voice.",
    body: "This starting type shapes the first melody before the day begins changing it.",
  },
  {
    title: "Name the sound.",
    body: `${mockEchoDevice.echoName} will appear in the archive as a living profile, not a tracker.`,
  },
  {
    title: "Dock at night.",
    body: "The Station will later upload encounter logs. For now, the day is drawn from mock memory data.",
  },
];

export default function OnboardingPage() {
  const echoTypes = Object.keys(echoTypeLabels) as EchoType[];

  return (
    <AppShell
      eyebrow="Onboarding"
      intro="Connect a new Echo, choose its first sonic body, and give it a name."
      title="Begin softly."
    >
      <div className="grid gap-10 md:grid-cols-2 xl:grid-cols-4">
        {steps.map((step, index) => (
          <section
            className="py-4"
            key={step.title}
          >
            <p className="font-body text-xs uppercase tracking-[0.28em] text-text-muted">
              Screen {index + 1}
            </p>
            <h2 className="mt-3 font-display text-[28px] leading-8">
              {step.title}
            </h2>
            <p className="mt-3 font-body text-base leading-6 text-text-muted">
              {step.body}
            </p>
          </section>
        ))}
      </div>

      <section className="mt-16">
        <p className="font-body text-xs uppercase tracking-[0.28em] text-text-muted">
          Echo type
        </p>
        <div className="mt-6 grid gap-8 md:grid-cols-3">
          {echoTypes.map((type) => (
            <div
              className={[
                "py-2",
                type === mockEchoDevice.echoType
                  ? "text-text"
                  : "text-text-muted",
              ].join(" ")}
              key={type}
            >
              <h3 className="font-display text-2xl leading-7">
                {echoTypeLabels[type]}
              </h3>
              <p className="mt-1 font-body text-sm leading-5 text-text-muted">
                {echoTypeDescriptions[type]}
              </p>
            </div>
          ))}
        </div>
        <Link
          className="mt-10 inline-flex rounded-full bg-nav-active px-6 py-4 font-body text-sm text-white"
          href="/profile"
        >
          View Namu&apos;s profile
        </Link>
      </section>
    </AppShell>
  );
}
