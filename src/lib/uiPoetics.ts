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
  { kind: "link" as const, href: "/memories", label: "Memories" },
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

export function encounterDayHeadline(encounterCount: number, echoName: string) {
  if (encounterCount === 0) {
    return `Quiet day... ${echoName} is still holding its own color.`;
  }
  if (encounterCount === 1) {
    return `Only one encounter found ${echoName}.`;
  }
  if (encounterCount >= 8) {
    return `${echoName} met many echoes today.`;
  }
  if (encounterCount >= 4) {
    return `${echoName} had quite a few encounters today.`;
  }
  return `${encounterCount} encounters around ${echoName}.`;
}

export const mainHome = {
  title: "Your daily encounters",
  encountersOverviewCta: "Encounters overview",
  memoriesCta: "Memories",
} as const;

export const overviewPage = {
  title: "Overview",
} as const;

export const overviewLabels = {
  timespanDaily: "Daily",
  timespanWeekly: "Weekly",
  timespanMonthly: "Monthly",
  timespanSelectLabel: "Encounter overview timespan",
  prev: "Previous",
  next: "Next",
  openFromMemory: "Encounters overview",
} as const;

export const aboutPage = {
  title: "About",
  brandName: "Echo",
  tagline: "A sonic companion for co-presence",
  sections: {
    about: "",
    reflection: "",
  },
  creditGroups: {
    team: "Design & Development",
    institution: "Program",
    guidance: "Guidance",
  },
  footerNote: "HEAD — Genève · Master Media Design",
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
    school: "HEAD – Genève (Haute école d’art et de design)",
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

/** Landing “How it works” journey — also onboarding steps 2–4 (Carry → Meet → Remember). */
export const echoJourney = [
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
] as const;

export const onboarding = {
  stepCounter: (step: number, total: number) =>
    `Onboarding step ${step + 1} of ${total}`,
  nameFieldLabel: "Name them as you would a river",
  namePlaceholder: "Something short enough to carry",
  firmwareModelLabel: "Echo firmware ID",
  firmwareModelPlaceholder: "ECHO_BOUNCE_001",
  firmwareModelHelp:
    "Matches ECHO_UNIQUE_MODEL_NAME in firmware Config.h—the same id your station uses for encounters.",
  firmwareModelInvalid:
    "Enter a firmware ID like ECHO_BOUNCE_001 (from Config.h on your device).",
  primaryContinue: "Further",
  primaryFinish: "Step through",
  back: "Back",
  nextChapter: "Onward",
} as const;
