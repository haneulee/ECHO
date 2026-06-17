import Link from "next/link";
import Image from "next/image";

import { EchoTypeGradientBackground } from "@/components/EchoTypeGradientBackground";
import {
  ECHO_TYPE_PAGE_ORDER,
  echoTypePageContent,
  echoTypePagePath,
  echoTypePrimaryColor,
} from "@/lib/echoTypePageContent";
import type { EchoType } from "@/lib/types";

type EchoTypeLandingPageProps = {
  echoType: EchoType;
};

export function EchoTypeLandingPage({ echoType }: EchoTypeLandingPageProps) {
  const content = echoTypePageContent[echoType];
  const accent = echoTypePrimaryColor(echoType);

  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-bg text-text">
      <EchoTypeGradientBackground echoType={echoType} />

      <section className="relative z-10 px-5 pb-24 pt-6 sm:px-8 lg:px-12">
        <nav className="mx-auto flex max-w-5xl items-center justify-between">
          <Link href="/">
            <Image
              alt="Echo"
              className="h-auto w-20 sm:w-24"
              height={100}
              priority
              src="/brand/echo_logo.png"
              width={200}
            />
          </Link>
          <div className="flex gap-1">
            {ECHO_TYPE_PAGE_ORDER.map((type) => (
              <Link
                className={[
                  "rounded-full px-3 py-1.5 font-body text-[11px] uppercase tracking-[0.12em]",
                  type === echoType
                    ? "text-text"
                    : "text-text-muted hover:text-text",
                ].join(" ")}
                href={echoTypePagePath(type)}
                key={type}
              >
                {echoTypePageContent[type].label}
              </Link>
            ))}
          </div>
        </nav>

        <div className="mx-auto max-w-5xl pt-16 sm:pt-24">
          <header className="text-center">
            <h1
              className="font-display text-[clamp(3.5rem,12vw,7rem)] leading-[0.85] tracking-[-0.07em]"
              style={{ color: accent }}
            >
              {content.label}
            </h1>
          </header>

          <figure className="mx-auto mt-12 max-w-3xl overflow-hidden rounded-[2rem] bg-white/40 shadow-[0_20px_70px_rgba(42,36,30,0.1)] backdrop-blur">
            <Image
              alt={content.heroImage.alt}
              className="aspect-[4/3] w-full object-cover sm:aspect-[16/10]"
              height={content.heroImage.height}
              priority
              src={content.heroImage.src}
              width={content.heroImage.width}
            />
          </figure>

          <div className="mt-16 grid gap-12 sm:mt-20 lg:grid-cols-2 lg:gap-16">
            <article>
              <p className="font-body text-xs uppercase tracking-[0.2em] text-text-muted">
                {content.personality.title}
              </p>
              <h2 className="mt-4 font-display text-[clamp(2rem,4vw,3rem)] leading-[1.02] tracking-[-0.05em]">
                Character
              </h2>
              <p className="mt-6 font-body text-base leading-7 text-text-muted sm:text-lg">
                {content.personality.body}
              </p>
            </article>

            <article>
              <p className="font-body text-xs uppercase tracking-[0.2em] text-text-muted">
                {content.sound.title}
              </p>
              <h2 className="mt-4 font-display text-[clamp(2rem,4vw,3rem)] leading-[1.02] tracking-[-0.05em]">
                Sonic identity
              </h2>
              <p className="mt-6 font-body text-base leading-7 text-text-muted sm:text-lg">
                {content.sound.body}
              </p>
            </article>
          </div>
        </div>
      </section>
    </main>
  );
}
