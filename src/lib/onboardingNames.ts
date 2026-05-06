import type { EchoType } from "./types";

const NAME_POOLS: Record<
  EchoType,
  { first: readonly string[]; second: readonly string[] }
> = {
  shy: {
    first: [
      "Blush",
      "Quiet",
      "Tiny",
      "Soft",
      "Hush",
      "Dim",
      "Bashful",
      "Whisper",
      "Veiled",
      "Gentle",
    ],
    second: [
      "Pocket",
      "Moth",
      "Pebble",
      "Bloom",
      "Hide",
      "Drift",
      "Bubble",
      "Shell",
      "Feather",
      "Pause",
    ],
  },
  messy: {
    first: [
      "Tangle",
      "Spill",
      "Happy",
      "Crumple",
      "Wild",
      "Muddy",
      "Jumble",
      "Fray",
      "Glitter",
      "Chaos",
    ],
    second: [
      "Fizz",
      "Party",
      "Stack",
      "Pop",
      "Spark",
      "Yarn",
      "Soup",
      "Loop",
      "Storm",
      "Patch",
    ],
  },
  bounce: {
    first: [
      "Bop",
      "Jitter",
      "Zing",
      "Boing",
      "Spring",
      "Pop",
      "Pogo",
      "Zappy",
      "Rattle",
      "Skip",
    ],
    second: [
      "Bean",
      "Puff",
      "Mint",
      "Soda",
      "Hops",
      "Glee",
      "Sky",
      "Ping",
      "Trampoline",
      "Rubber",
    ],
  },
};

/** Two-word names tuned to each model temperament (shy / messy / bounce). */
export function randomTwoWordEchoName(type: EchoType): string {
  const pool = NAME_POOLS[type];
  const first = pool.first[Math.floor(Math.random() * pool.first.length)];
  const second = pool.second[Math.floor(Math.random() * pool.second.length)];
  return `${first} ${second}`;
}
