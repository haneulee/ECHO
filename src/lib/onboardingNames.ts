import type { EchoType } from "./types";

const NAME_POOLS: Record<EchoType, readonly string[]> = {
  shy: [
    "Tiny Moth",
    "Soft Pebble",
    "Quiet Bloom",
    "Hush Feather",
    "Gentle Shell",
    "Whisper Pocket",
    "Blush Cloud",
    "Hidden Sprout",
  ],
  messy: [
    "Tangle Spark",
    "Happy Spill",
    "Glitter Soup",
    "Muddy Party",
    "Jumble Patch",
    "Wild Yarn",
    "Crumple Pop",
    "Fizz Storm",
  ],
  bounce: [
    "Bop Bean",
    "Skip Soda",
    "Zing Mint",
    "Pogo Puff",
    "Spring Sky",
    "Pop Glee",
    "Boing Biscuit",
    "Sunny Ping",
  ],
};

/** Curated two-word names tuned to each model temperament (shy / messy / bounce). */
export function randomTwoWordEchoName(type: EchoType): string {
  const pool = NAME_POOLS[type];
  return pool[Math.floor(Math.random() * pool.length)] ?? "Bop Bean";
}
