import Link from "next/link";
import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";

import { LandingGradientBackground } from "@/components/LandingGradientBackground";
import { resolveSessionUser } from "@/lib/auth/resolveSessionUser";
import {
  ECHO_TYPE_PAGE_ORDER,
  echoTypePageContent,
  echoTypePagePath,
} from "@/lib/echoTypePageContent";
import { echoTypeDescriptions } from "@/lib/echoTypeMeta";
import { isLocalMockMode, logDatabaseUnavailable } from "@/lib/localMockMode";
import { echoJourney } from "@/lib/uiPoetics";
import { getEchoColorPalette } from "@/lib/visualRules";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Echo, A sonic companion for co-presence",
};

const projectComponents = [
  {
    title: "Companion",
    body: "Carried through the day. Each one has its own voice, and grows richer with every encounter.",
  },
  {
    title: "Station",
    body: "Where the day is set down. What was heard becomes an evolving sound memory.",
  },
  {
    title: "Interface",
    body: "An archive of resonance, where encounters return as audio-reactive landscapes.",
  },
];

const shell = "mx-auto w-full max-w-[105rem] px-6 sm:px-10 lg:px-14";
const rule = "border-text/[0.12]";
const numeral = "font-body text-[0.75rem] tracking-[0.2em] text-text-muted";
const btnSolid =
  "rounded-full bg-text px-5 py-2.5 font-body text-sm leading-none text-bg transition-opacity hover:opacity-80";
const btnGhost =
  "rounded-full border border-text/15 px-5 py-2.5 font-body text-sm leading-none text-text transition-colors hover:bg-text/[0.06]";

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

      <header
        className={`sticky top-0 z-30 border-b ${rule} bg-bg/60 backdrop-blur-md`}
      >
        <div
          className={`${shell} flex h-[4.5rem] items-center justify-between`}
        >
          <Image
            alt="Echo"
            className="h-auto w-[4.75rem] sm:w-[5.5rem]"
            height={100}
            priority
            src="/brand/echo_logo.png"
            width={200}
          />
          <nav className="flex items-center gap-2 sm:gap-3">
            <Link className={btnGhost} href="/login">
              Log in
            </Link>
            <Link className={btnSolid} href="/signup">
              <span className="sm:hidden">Begin</span>
              <span className="hidden sm:inline">Begin with Echo</span>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className={`relative z-10 ${shell} pb-16 pt-24 sm:pt-32`}>
        <h1 className="max-w-[16ch] font-display text-[clamp(3.4rem,8.5vw,11rem)] leading-[0.82] tracking-[-0.075em]">
          A sonic companion for co-presence
        </h1>
        <p className="mt-14 max-w-[38ch] font-body text-lg leading-6 text-text-muted md:ml-auto md:text-xl">
          A small device that listens for the ones nearby. Three types, three
          temperaments, each with a voice of its own.
        </p>
      </section>

      <figure className="relative z-10">
        <Image
          alt="Pink and blue Echo companions held outside"
          className="h-[58vh] min-h-[22rem] w-full object-cover sm:h-[76vh]"
          height={1024}
          priority
          src="/assets/landing-echo-hand-pair.png"
          width={1280}
        />
      </figure>

      {/* Three types — hairline index */}
      <section className={`relative z-10 ${shell} pt-20 sm:pt-28`}>
        <h2 className="font-display text-[clamp(2rem,3.6vw,3.4rem)] leading-none tracking-[-0.06em]">
          Three temperaments
        </h2>
        <div className={`mt-10 border-t ${rule}`}>
          {ECHO_TYPE_PAGE_ORDER.map((type, index) => {
            const item = echoTypePageContent[type];
            const palette = getEchoColorPalette(type);
            return (
              <Link
                className={`group grid items-baseline gap-x-6 gap-y-4 border-b ${rule} py-8 transition-colors duration-300 hover:bg-text/[0.025] md:grid-cols-12 md:py-10`}
                href={echoTypePagePath(type)}
                key={type}
              >
                <span className={`${numeral} md:col-span-1`}>0{index + 1}</span>
                <p className="font-display text-[clamp(2.1rem,3.4vw,3.4rem)] leading-none tracking-[-0.05em] md:col-span-3">
                  {item.label}
                </p>
                <p className="max-w-xl font-body text-base leading-6 text-text-muted md:col-span-5">
                  {echoTypeDescriptions[type]}
                </p>
                <div className="flex gap-1.5 md:col-span-3 md:justify-end">
                  {palette.map((color) => (
                    <span
                      aria-hidden
                      className="h-2.5 w-2.5 rounded-full transition-transform duration-500 group-hover:scale-125"
                      key={color}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Statement */}
      <section className={`relative z-10 ${shell} py-24 sm:py-36`}>
        <div className="grid gap-12 lg:grid-cols-12">
          <h2 className="font-display text-[clamp(2.6rem,5.6vw,5.8rem)] leading-[0.9] tracking-[-0.07em] lg:col-span-6">
            Alone it stays quiet. Together it sings.
          </h2>
          <p className="max-w-xl font-body text-lg leading-6 text-text-muted lg:col-span-5 lg:col-start-8 lg:self-end sm:text-xl">
            When two Echoes come close, layered tones and shifting rhythms rise
            between them. Nearness turns into something you can hear.
          </p>
        </div>
      </section>

      <figure className="relative z-10">
        <iframe
          allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share"
          allowFullScreen
          className="aspect-video w-full"
          frameBorder="0"
          referrerPolicy="strict-origin-when-cross-origin"
          src="https://player.vimeo.com/video/1203478966?h=503be9502c&autoplay=1&loop=1&muted=1&autopause=0"
          title="Echo project video"
        />
      </figure>

      {/* Sound memories */}
      <section className="relative z-10 pt-20 sm:pt-28">
        <div className="grid items-stretch gap-y-14 lg:grid-cols-2">
          <figure className="lg:order-1">
            <Image
              alt="Two Echo companions connected by a chain"
              className="h-full min-h-[26rem] w-full object-cover lg:min-h-[42rem]"
              height={1024}
              src="/assets/landing-echo-field-pair.png"
              width={768}
            />
          </figure>
          <div
            className={`${shell} flex flex-col justify-end gap-10 lg:order-2 lg:max-w-none lg:pb-6`}
          >
            <h2 className="max-w-[20ch] font-display text-[clamp(2.2rem,4.2vw,4.4rem)] leading-[0.92] tracking-[-0.06em]">
              The day comes back as a landscape
            </h2>
            <p
              className={`max-w-md border-t ${rule} pt-6 font-body text-base leading-6 text-text-muted`}
            >
              Rest Echo on its station, and the encounters it carried become
              sound and image you can wander through again.
            </p>
          </div>
        </div>
      </section>

      <figure className="relative z-10 mt-14">
        <Image
          alt="Echo on its station beside the digital interface"
          className="h-[52vh] min-h-[20rem] w-full object-cover sm:h-[72vh]"
          height={1280}
          src="/assets/landing-echo-station-phone.png"
          width={960}
        />
      </figure>

      {/* System */}
      <section className={`relative z-10 ${shell} py-24 sm:py-36`}>
        <div className="grid gap-12 lg:grid-cols-12">
          <h2 className="font-display text-[clamp(2.4rem,4.8vw,4.8rem)] leading-[0.9] tracking-[-0.07em] lg:col-span-4">
            One system, three parts
          </h2>
          <div className="grid gap-x-8 gap-y-10 lg:col-span-7 lg:col-start-6 md:grid-cols-3">
            {projectComponents.map((item) => (
              <article className={`border-t ${rule} pt-6`} key={item.title}>
                <h3 className="font-display text-2xl leading-tight tracking-[-0.05em]">
                  {item.title}
                </h3>
                <p className="mt-4 font-body text-base leading-6 text-text-muted">
                  {item.body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Journey */}
      <section className={`relative z-10 ${shell} pb-24 sm:pb-36`}>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-8 top-1/2 -z-10 h-48 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(118,214,220,0.24),rgba(244,190,231,0.18)_50%,rgba(252,250,246,0)_72%)] blur-2xl"
        />
        <h2 className="max-w-[16ch] font-display text-[clamp(2.4rem,5.4vw,5.4rem)] leading-[0.9] tracking-[-0.07em]">
          Carry, meet, remember
        </h2>
        <div className={`mt-14 border-t ${rule}`}>
          {echoJourney.map((item, index) => (
            <article
              className={`grid items-baseline gap-x-6 gap-y-3 border-b ${rule} py-8 md:grid-cols-12`}
              key={item.title}
            >
              <span className={`${numeral} md:col-span-1`}>0{index + 1}</span>
              <h3 className="font-display text-[clamp(1.8rem,2.8vw,2.6rem)] leading-none tracking-[-0.05em] md:col-span-4">
                {item.title}
              </h3>
              <p className="max-w-xl font-body text-base leading-6 text-text-muted md:col-span-6 md:col-start-7">
                {item.body}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* Closing */}
      <section className="relative z-10 grid gap-y-14 lg:grid-cols-12">
        <figure className="lg:col-span-5">
          <Image
            alt="Close view of an Echo companion resting on its station"
            className="h-full min-h-[26rem] w-full object-cover lg:min-h-[46rem]"
            height={1280}
            src="/assets/landing-echo-station-close.png"
            width={960}
          />
        </figure>
        <div
          className={`${shell} flex flex-col justify-center lg:col-span-7 lg:max-w-none`}
        >
          <h2 className="font-display text-[clamp(2.8rem,6vw,7rem)] leading-[0.82] tracking-[-0.075em]">
            Carry presence
          </h2>
          <h2 className="mt-3 pl-[0.12em] font-display text-[clamp(2.8rem,6vw,7rem)] leading-[0.82] tracking-[-0.075em] text-text-muted">
            Revisit connection
          </h2>
          <p
            className={`mt-12 max-w-lg border-t ${rule} pt-6 font-body text-lg leading-6 text-text-muted`}
          >
            Every encounter leaves a trace. Echo asks how small moments of
            nearness slowly become connection.
          </p>
          <div className="mt-12 flex flex-wrap items-center gap-3">
            <Link className={btnSolid} href="/signup">
              Begin with Echo
            </Link>
            <Link className={btnGhost} href="/login">
              Log in
            </Link>
          </div>
        </div>
      </section>

      <footer className={`relative z-10 mt-24 border-t ${rule}`}>
        <div
          className={`${shell} flex flex-wrap items-center justify-between gap-6 py-10`}
        >
          <Image
            alt="Echo"
            className="h-auto w-[4.25rem]"
            height={100}
            src="/brand/echo_logo.png"
            width={200}
          />
          <p className="flex items-baseline gap-2 font-body text-sm text-text-muted">
            Made by
            <a
              className="group inline-flex items-baseline gap-1 border-b border-text/40 pb-0.5 text-base text-text transition-colors hover:border-text"
              href="https://www.haneul-lee.com"
              rel="noreferrer"
              target="_blank"
            >
              Haneul Lee
              <span
                aria-hidden
                className="text-xs transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              >
                &#8599;
              </span>
            </a>
          </p>
        </div>
      </footer>
    </main>
  );
}
