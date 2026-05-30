/**
 * Poetic UI copy — image, breath, and rhythm over dashboard utility.
 */

import type { ProximityZone } from "./types";

/** Encounter cards — replaces raw zone strings */
export const proximityWhisper: Record<ProximityZone, string> = {
  far: "light touch at the rim",
  near: "voice carried within reach",
  close: "almost handed across",
  very_close: "one shared breath",
};

export const profileLabels = {
  type: "Temperament",
  melodyNotes: "Sonic thread",
  /** Value still from `vaguePresenceFromIso` */
  presence: "Last near",
} as const;

export const navItems = [
  { kind: "link" as const, href: "/main", label: "Main" },
  { kind: "link" as const, href: "/overview", label: "Overview" },
  { kind: "link" as const, href: "/archive", label: "Archive" },
  {
    kind: "account" as const,
    signedInLabel: "Rest",
    signedOutLabel: "Log in",
  },
] as const;

export type NavItem = (typeof navItems)[number];

export const profileHero = {
  eyebrow: "Main",
  intro:
    "Each Echo has a temperament. Alone it stays quiet; near others, it finds harmony.",
} as const;

export const profileSections = {
  evolutionEyebrow: "What stayed after nearness",
  evolutionTitle: "A melody carrying someone else’s light",
  soundPlayerTitle: "Hear your companion",
} as const;

/** /profile when the account has no EchoDevice row yet */
export const profileNoDevice = {
  title: "No companion has arrived yet",
  body: "Echo begins as a small object in your hand. Finish the welcome ritual to name it and let its first temperament settle in.",
  ctaLabel: "Begin the ritual",
  ctaHref: "/onboarding",
} as const;

export const todayHero = {
  intro:
    "Carry Echo through the day. When another companion comes close, the air begins to sound.",
} as const;

export const todaySoundTitle = "Let the day play";

export const archiveHero = {
  title: "Memories",
} as const;

export const mainHome = {
  title: "Your daily encounters",
  encountersOverviewCta: "Encounters overview",
  memoriesCta: "Memories",
} as const;

export const overviewPage = {
  title: "Encounters overview",
} as const;

export const overviewLabels = {
  timespanDaily: "Daily",
  timespanWeekly: "Weekly",
  timespanMonthly: "Monthly",
  prev: "Previous",
  next: "Next",
  openFromMemory: "Encounters overview",
} as const;

/** Archive carousel — headline under the date */
export const archiveCarousel = {
  dayHeadline: (encounterCount: number) => {
    if (encounterCount === 0) return "Not so much today…";
    if (encounterCount === 1) return "One nearness left a small trace.";
    if (encounterCount >= 8) return "Wow—that’s a lot of nearness.";
    return `${encounterCount} moments of nearness stayed behind.`;
  },
} as const;

export const aboutPage = {
  title: "About",
  brandName: "Echo",
  tagline: "A sonic companion for co-presence",
  paragraphs: [
    "Echo is a small companion device that reacts to the presence of its peers through sound. Released as three different types, each has its own temperament expressed through sonic identity. When alone, it remains quiet. As two or more devices share proximity, they start playing sound in harmony thanks to layered tones and shifting rhythms. Echo somehow reflects the subtle sense of connection that can emerge when real-life encounters happen. It transforms physical proximity into a playful collective experience.",
    "Over time, encounters leave traces within each Echo companions. At the end of the day, users place it on its station, where moments of co-presence recorded during the day are transferred into a digital interface to revisit over time an evolving archive of sound memories displayed as audio-reactive visual landscapes.",
    "Echo invites us to explore how subtle moments of co-presence can gradually become a sense of connection.",
  ],
  credits: {
    author: {
      name: "Haneul Lee",
      url: "https://www.haneul-lee.com",
    },
    school: "HEAD – Genève (Haute école d'art et de design)",
    program: "Master Media Design",
    tutor: "Amaury Hamon",
    professors: [
      "Alexia Mathieu",
      "Daniel Sciboz",
      "Dominic Robson",
      "Douglas Edric Stanley",
      "Pierre Rossel",
    ],
  },
} as const;

export const encounterArchive = {
  eyebrow: "Who crossed the air",
  title: "Presence, softly kept.",
} as const;

export const evolutionPageHero = {
  eyebrow: "When two voices braiding",
  intro:
    "Linger near enough and rhythms yield—tones swap places, and your Echo returns carrying a spark not wholly its own.",
  title: (echoName: string) => `${echoName}, afterward`,
} as const;

export const evolutionCard = {
  eyebrow: (hash: string) => `Borrowed light · ${hash}`,
  lead: (echoName: string) =>
    `${echoName} cupped another Echo’s nearness until a shard of melody leaked through and stayed.`,
  melodyBefore: "Before the borrowing",
  melodyAfter: "Once the air cooled",
} as const;

export const soundTestHero = {
  eyebrow: "Tuning the veil between bodies",
  intro:
    "Strings widen when someone steps nearer—no feed, no reply, only thickness in the ear. Headphones; keep the room gentle.",
  title: "Let closeness become tone.",
} as const;

/** Under the profile name on /sound-test */
export const soundTestProfileIntro =
  "Decay like fog—no beat to chase—only a melody that waits while fifths, octaves, and shimmer gather when distance shrinks.";

export const onboarding = {
  stepCounter: (step: number, total: number) =>
    `Breath ${step + 1} of ${total}`,
  welcomeTitle: "Your Echo is sleeping lightly",
  welcomeBody:
    "A soft creature on your wrist: still when the world forgets you, listening when it doesn’t. What grows between people need not be clever—only noticed.",
  nameFieldLabel: "Name them as you would a river",
  namePlaceholder: "Something short enough to carry",
  howToLiveEyebrow: "Sun, nest, glass",
  howToLiveLeadStep3:
    "Three folds in the cloth—walk with them, lay them down, lift the edge when you want to see.",
  primaryWelcome: "Wake them gently",
  primaryContinue: "Further",
  primaryFinish: "Step through",
  back: "Return",
  nextChapter: "Onward",
  echoUnitSignupLabel: "Echo unit code",
  echoUnitSignupHelp:
    "The code printed on your Echo and embedded in firmware—your station labels encounters with this id.",
  echoUnitOnboardingLabel: "Echo unit code",
  echoUnitOnboardingHelp:
    "Only if this account has no device yet: enter the same code you use on the hardware (letters, digits, hyphen, underscore).",
} as const;
