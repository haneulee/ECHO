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
  name: "The name you carry",
  temperament: "How they wear the air",
  /** Value still from `vaguePresenceFromIso` */
  presence: "When nearness last stirred",
} as const;

export const navItems = [
  { kind: "link" as const, href: "/today", label: "This day" },
  { kind: "link" as const, href: "/profile", label: "Echo" },
  { kind: "link" as const, href: "/archive", label: "Past days" },
  {
    kind: "account" as const,
    signedInLabel: "Sign out",
    signedOutLabel: "Log in",
  },
] as const;

export type NavItem = (typeof navItems)[number];

export const profileHero = {
  eyebrow: "Small warmth against your skin",
  intro:
    "When another Echo draws near, sound gathers—soft proof you share the same air.",
} as const;

export const profileSections = {
  evolutionEyebrow: "What the hours took",
  evolutionTitle: "Melody altered by passing.",
  soundPlayerTitle: "The thread still humming",
} as const;

/** /profile when the account has no EchoDevice row yet */
export const profileNoDevice = {
  title: "No Echo at the sill yet",
  body: "Your account has no Echo device row yet. If you skipped onboarding, open it and finish the last step (legacy accounts may be asked for the unit code again). New sign-ups register the printed unit code at account creation.",
  ctaLabel: "Open onboarding",
  ctaHref: "/onboarding",
} as const;

export const todayHero = {
  intro:
    "Throughout the day, Echo recorded co-presence. Back on its nest, these encounters return as evolving traces of sound.",
} as const;

export const todaySoundTitle = "Unspool it";

export const archiveHero = {
  eyebrow: "Older tides",
  title: "Earlier crossings",
} as const;

/** Archive carousel — headline under the date */
export const archiveCarousel = {
  dayHeadline: (encounterCount: number) =>
    encounterCount === 0
      ? "Solitude wore the whole day through."
      : encounterCount === 1
        ? "Once, another orbit grazed yours."
        : `${encounterCount} thin crossings stitched the hours.`,
} as const;

export const encounterArchive = {
  eyebrow: "Others who breathed your radius",
  title: "Presence without the stage.",
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
