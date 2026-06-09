import Link from "next/link";
import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";

import { LandingGradientBackground } from "@/components/LandingGradientBackground";
import { resolveSessionUser } from "@/lib/auth/resolveSessionUser";
import { isLocalMockMode, logDatabaseUnavailable } from "@/lib/localMockMode";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Echo, A sonic companion for co-presence",
};

const projectComponents = [
  {
    title: "Companion device",
    body: "A portable Echo carried through the day. Each type has its own temperament and sonic identity, and grows richer through repeated encounters.",
  },
  {
    title: "Station",
    body: "A place for reflection and memory transfer, where recorded encounters are uploaded and transformed into evolving sound memories.",
  },
  {
    title: "Digital interface",
    body: "An archive of encounters and sound memories, visualized through audio-reactive landscapes and traces of resonance between Echoes.",
  },
];

const journey = [
  {
    title: "Carry",
    body: "A small companion with its own temperament and sonic identity, quiet until another Echo comes near.",
  },
  {
    title: "Meet",
    body: "When Echoes share proximity, layered tones and shifting rhythms emerge into a shared atmosphere.",
  },
  {
    title: "Remember",
    body: "At the end of the day, encounters become sound memories and visual landscapes in the archive.",
  },
];

export default async function HomePage() {
  if (isLocalMockMode()) {
    logDatabaseUnavailable("/ home local mock mode");
  } else {
    const r = await resolveSessionUser();
    if (r.kind === "ok") {
      redirect("/main");
    }
    if (r.kind === "db_unavailable") {
      logDatabaseUnavailable("/ home");
    }
    if (r.kind === "stale_jwt") {
      redirect("/api/auth/sync-session?next=%2F");
    }
  }

  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-bg text-text">
      <LandingGradientBackground />
      <section className="relative z-10 isolate min-h-screen px-5 pb-16 pt-6 sm:px-8 lg:px-12">
        <nav className="mx-auto flex max-w-7xl items-center justify-center">
          <Image
            alt="Echo"
            className="h-auto w-24 sm:w-28"
            height={100}
            priority
            src="/brand/echo_logo.png"
            width={200}
          />
        </nav>

        <div className="mx-auto flex max-w-7xl flex-col items-center pt-16 text-center sm:pt-20">
          <h1 className="mt-5 max-w-5xl font-display text-[clamp(4.1rem,6vw,10.5rem)] leading-[0.78] tracking-[-0.075em]">
            A sonic companion for co-presence
          </h1>
          <p className="mt-16 max-w-2xl font-body text-[1.05rem] leading-5 text-text-muted sm:text-lg">
            Echo is a small companion device that reacts to the presence of its
            peers through sound. Released as three different types, each has its
            own temperament expressed through sonic identity.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              className="glass-btn-primary rounded-full px-6 py-3 font-body text-sm"
              href="/signup"
            >
              Begin with Echo
            </Link>
            <Link
              className="glass-btn-secondary rounded-full px-6 py-3 font-body text-sm"
              href="/login"
            >
              Log in
            </Link>
          </div>

          <div className="relative mt-14 w-full max-w-5xl">
            <figure className="overflow-hidden rounded-[2.25rem] bg-white/40 shadow-[0_24px_90px_rgba(42,36,30,0.12)] backdrop-blur">
              <Image
                alt="Pink and blue Echo companions held outside"
                className="aspect-[16/10] w-full object-cover"
                height={1024}
                priority
                src="/assets/landing-echo-hand-pair.png"
                width={1280}
              />
            </figure>
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto grid max-w-7xl gap-8 px-5 py-20 sm:px-8 lg:grid-cols-[0.85fr_1.15fr] lg:px-12 lg:py-28">
        <div>
          <p className="font-body text-xs uppercase tracking-[0.2em] text-text-muted">
            Proximity becomes sound
          </p>
          <h2 className="mt-4 font-display text-[clamp(2.8rem,6vw,6.8rem)] leading-[0.99] tracking-[-0.06em]">
            A playful way to reflect connection
          </h2>
        </div>
        <div className="grid content-end gap-6 font-body text-base leading-5 text-text-muted sm:text-lg">
          <p>
            When alone, Echo remains quiet. As two or more devices share
            proximity, they start playing sound in harmony through layered tones
            and shifting rhythms.
          </p>
          <p>
            Echo reflects the subtle sense of connection that can emerge when
            real-life encounters happen. It transforms physical proximity into a
            playful collective experience.
          </p>
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-12">
        <div className="grid gap-5 lg:grid-cols-[1.08fr_0.92fr]">
          <figure className="overflow-hidden rounded-[2rem] bg-white/40 shadow-[0_18px_70px_rgba(42,36,30,0.09)]">
            <Image
              alt="Two Echo companions connected by a chain"
              className="h-full min-h-[24rem] w-full object-cover"
              height={1024}
              src="/assets/landing-echo-field-pair.png"
              width={768}
            />
          </figure>
          <div className="grid gap-5">
            <figure className="overflow-hidden rounded-[2rem] bg-white/40 shadow-[0_18px_70px_rgba(42,36,30,0.08)]">
              <Image
                alt="Echo on its station beside the digital interface"
                className="h-full min-h-[18rem] w-full object-cover"
                height={1280}
                src="/assets/landing-echo-station-phone.png"
                width={960}
              />
            </figure>
            <div className="glass-panel rounded-[2rem] p-8">
              <p className="font-body text-xs uppercase tracking-[0.2em] text-text-muted">
                Sound memories
              </p>
              <p className="mt-5 font-display text-3xl leading-9 tracking-[-0.035em]">
                The day returns as an abstract landscape
              </p>
              <p className="mt-4 font-body text-sm leading-5 text-text-muted">
                Place Echo on its station to transfer moments of co-presence
                into a digital interface, where encounters can be revisited as
                an evolving archive of audio-reactive visual landscapes.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
        <div className="mb-10 max-w-6xl">
          <p className="font-body text-xs uppercase tracking-[0.2em] text-text-muted">
            Three parts, one companion system
          </p>
          <h2 className="mt-4 font-display text-[clamp(2.6rem,5vw,5.4rem)] leading-[0.88] tracking-[-0.06em]">
            Companion, Station, Interface
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {projectComponents.map((item) => (
            <article
              className="glass-panel rounded-[1.75rem] p-6"
              key={item.title}
            >
              <h3 className="font-display text-3xl tracking-[-0.045em]">
                {item.title}
              </h3>
              <p className="mt-4 font-body text-sm leading-5 text-text-muted">
                {item.body}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-12 lg:py-24">
        <div
          aria-hidden
          className="absolute inset-x-8 top-1/2 -z-10 h-48 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(118,214,220,0.24),rgba(244,190,231,0.18)_50%,rgba(252,250,246,0)_72%)] blur-2xl"
        />
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
          <div>
            <p className="font-body text-xs uppercase tracking-[0.2em] text-text-muted">
              How it works
            </p>
            <h2 className="mt-4 font-display text-[clamp(2.6rem,6vw,5.4rem)] leading-[0.88] tracking-[-0.06em]">
              The day becomes a sound memory
            </h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-3">
            {journey.map((item, index) => (
              <article className="relative" key={item.title}>
                <div className="mb-4 font-display text-5xl leading-none tracking-[-0.08em] text-text/15">
                  0{index + 1}
                </div>
                <h3 className="font-display text-3xl tracking-[-0.045em]">
                  {item.title}
                </h3>
                <p className="mt-3 font-body text-sm leading-5 text-text-muted">
                  {item.body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="relative z-10 px-5 pb-24 pt-8 sm:px-8 lg:px-12">
        <div className="mx-auto grid max-w-7xl gap-8 overflow-hidden rounded-[2.25rem] bg-white/40 p-5 shadow-[0_18px_80px_rgba(42,36,30,0.08)] backdrop-blur-md lg:grid-cols-[0.9fr_1.1fr] lg:p-8">
          <figure className="overflow-hidden rounded-[1.75rem]">
            <Image
              alt="Close view of an Echo companion resting on its station"
              className="aspect-[4/5] h-full w-full object-cover"
              height={1280}
              src="/assets/landing-echo-station-close.png"
              width={960}
            />
          </figure>
          <div className="flex flex-col justify-center px-3 py-8 sm:px-6 lg:px-10">
            <h2 className="max-w-2xl font-display text-[clamp(3rem,6vw,7rem)] leading-[0.7] tracking-[-0.07em]">
              Carry presence
            </h2>
            <h2 className="mt-12 max-w-2xl font-display text-[clamp(3rem,6vw,7rem)] leading-[0.7] tracking-[-0.07em]">
              Revisit connection
            </h2>
            <p className="mt-7 max-w-xl font-body text-base leading-5 text-text-muted">
              Over time, encounters leave traces within each Echo companion.
              Echo invites us to explore how subtle moments of co-presence can
              gradually become a sense of connection.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
