import { encounterDisplayPalette } from "@/lib/encounterDisplay";
import type { DailyMemory, Encounter } from "@/lib/types";
import {
  getBlobSizeFromDuration,
  getEchoColorPalette,
  getOpacityFromCloseness,
  getRingThicknessFromDensity,
  seededRandom,
  svgRound,
} from "@/lib/visualRules";

export type AbstractMemoryVisualProps = {
  size?: number;
  seed: number;
  density: number;
  brightness: number;
  movement: number;
  encounters: Encounter[];
  composition: DailyMemory["composition"];
  showMutation?: boolean;
  gradientOnly?: boolean;
  visualId?: string;
  bleed?: boolean;
  /** Slow breathing drift for the gradient blobs (e.g. active memory on /memories). */
  gradientMotion?: boolean;
  /** Lighter SVG for mobile / low-power devices — fewer blobs, no SVG blur filter. */
  lowGpuCost?: boolean;
};

export function AbstractMemoryVisual({
  size = 360,
  seed,
  density,
  brightness,
  movement,
  encounters,
  composition,
  showMutation = false,
  gradientOnly = false,
  visualId,
  bleed = false,
  gradientMotion = false,
  lowGpuCost = false,
}: AbstractMemoryVisualProps) {
  const random = seededRandom(seed);
  const center = svgRound(size / 2);
  const baseRadius = svgRound(size * 0.29);
  const ringThickness = svgRound(getRingThicknessFromDensity(density));
  const safeEncounters = encounters.length > 0 ? encounters : [];
  const maxEncounters = lowGpuCost ? 6 : safeEncounters.length;
  const visualEncounters =
    lowGpuCost && safeEncounters.length > maxEncounters
      ? sampleEncountersEvenly(safeEncounters, maxEncounters)
      : safeEncounters;
  const idSuffix = visualId?.replace(/[^a-zA-Z0-9_-]/g, "-") ?? "default";
  const id = `memory-${seed}-${idSuffix}`;
  const duration = `${Math.max(9, 18 - movement * 10)}s`;
  const useSvgBlur = !lowGpuCost;
  const blobMotion = gradientMotion && !lowGpuCost;

  const blobs = visualEncounters.flatMap((encounter, encounterIndex) => {
    const repeats = lowGpuCost
      ? Math.max(1, Math.min(2, Math.round(1 + density * 1.2)))
      : Math.max(2, Math.round(2 + density * 4));
    const palette = encounterDisplayPalette(encounter);

    return Array.from({ length: repeats }).map((_, repeatIndex) => {
      const progress =
        (encounterIndex + repeatIndex / repeats) / Math.max(1, visualEncounters.length);
      const angle =
        -progress *
          Math.PI *
          2 +
        (random() - 0.5) * 0.7;
      const orbitalWobble = (random() - 0.5) * ringThickness * 1.15;
      const radius = baseRadius + orbitalWobble;
      const x = svgRound(center + Math.cos(angle) * radius);
      const y = svgRound(center + Math.sin(angle) * radius);
      const blobRadius = svgRound(
        getBlobSizeFromDuration(encounter.durationSec) *
          (0.72 + random() * 0.68) *
          (lowGpuCost ? 1.18 : 1),
      );
      const color = palette[Math.floor(random() * palette.length)];
      const secondaryColor = palette[Math.floor(random() * palette.length)];
      const opacity = svgRound(
        getOpacityFromCloseness(encounter.closenessAvg) *
          (0.7 + brightness * 0.4),
        6,
      );

      return {
        key: `${encounter.id}-${repeatIndex}`,
        x,
        y,
        radius: blobRadius,
        color,
        secondaryColor,
        opacity,
      };
    });
  });

  return (
    <svg
      aria-label="Chromatography-inspired sound memory"
      className="memory-breathe h-auto max-w-full overflow-visible"
      height={size}
      role="img"
      viewBox={`0 0 ${size} ${size}`}
      width={size}
    >
      <defs>
        <filter
          id={`${id}-diffuse`}
          x={bleed ? "-80%" : "-40%"}
          y={bleed ? "-80%" : "-40%"}
          width={bleed ? "260%" : "180%"}
          height={bleed ? "260%" : "180%"}
        >
          <feGaussianBlur stdDeviation={bleed ? "16" : "10"} />
        </filter>
        <filter
          id={`${id}-paper-soften`}
          x={bleed ? "-60%" : "-20%"}
          y={bleed ? "-60%" : "-20%"}
          width={bleed ? "220%" : "140%"}
          height={bleed ? "220%" : "140%"}
        >
          <feGaussianBlur stdDeviation="1.2" />
        </filter>
        <radialGradient id={`${id}-paper`} cx="50%" cy="50%" r="62%">
          <stop offset="0%" stopColor="#FFFCF7" />
          <stop offset="74%" stopColor="#F7F5F0" />
          <stop offset="100%" stopColor="#EFEAE1" />
        </radialGradient>
        {composition.voices.map((voice, index) => {
          const palette = getEchoColorPalette(voice.echoType);

          return (
            <radialGradient id={`${id}-voice-${index}`} key={voice.echoType}>
              <stop offset="0%" stopColor={palette[0]} stopOpacity="0.72" />
              <stop offset="58%" stopColor={palette[1]} stopOpacity="0.28" />
              <stop offset="100%" stopColor={palette[2]} stopOpacity="0" />
            </radialGradient>
          );
        })}
        {blobs.map((blob) => (
          <radialGradient id={`${id}-${blob.key}`} key={`${blob.key}-gradient`}>
            <stop
              offset="0%"
              stopColor={blob.color}
              stopOpacity={lowGpuCost ? "0.78" : "0.86"}
            />
            <stop
              offset="46%"
              stopColor={blob.secondaryColor}
              stopOpacity={lowGpuCost ? "0.34" : "0.46"}
            />
            <stop offset="100%" stopColor={blob.secondaryColor} stopOpacity="0" />
          </radialGradient>
        ))}
      </defs>

      {!gradientOnly ? (
        <circle
          cx={center}
          cy={center}
          fill={`url(#${id}-paper)`}
          filter={`url(#${id}-paper-soften)`}
          r={svgRound(size * 0.46)}
        />
      ) : null}
      <g
        className={gradientMotion ? "memory-active-drift" : undefined}
        style={
          gradientMotion
            ? {
                animationDuration: duration,
                transformOrigin: `${center}px ${center}px`,
              }
            : { transformOrigin: `${center}px ${center}px` }
        }
      >
        {!gradientOnly ? (
          <>
            <ellipse
              cx={center}
              cy={svgRound(center + size * 0.006)}
              fill="none"
              opacity="0.12"
              rx={svgRound(baseRadius * 1.08)}
              ry={svgRound(baseRadius * 0.92)}
              stroke="#CFC7BA"
              strokeDasharray="1 18"
              strokeLinecap="round"
              strokeWidth={svgRound(Math.max(10, ringThickness * 0.62))}
            />
            {composition.voices.map((voice, index) => {
              const radius = svgRound(
                baseRadius + (index - 1) * ringThickness * 0.42,
              );
              const circumference = svgRound(2 * Math.PI * radius);
              const dash = svgRound(circumference * voice.presence);

              return (
                <circle
                  cx={center}
                  cy={center}
                  fill="none"
                  key={`${voice.echoType}-ring`}
                  opacity={svgRound(0.14 + voice.presence * 0.24, 6)}
                  r={radius}
                  stroke={`url(#${id}-voice-${index})`}
                  strokeDasharray={`${dash} ${circumference}`}
                  strokeLinecap="round"
                  strokeWidth={svgRound(
                    ringThickness * (0.7 + voice.averageCloseness * 0.46),
                  )}
                  transform={`rotate(${index * 84 - 24} ${center} ${center})`}
                />
              );
            })}
          </>
        ) : null}

        <g filter={useSvgBlur ? `url(#${id}-diffuse)` : undefined}>
          {blobs.map((blob, blobIndex) => {
            const driftVariant = !blobMotion
              ? undefined
              : blobIndex % 3 === 0
                ? "memory-active-blob-drift"
                : blobIndex % 3 === 1
                  ? "memory-active-blob-drift memory-active-blob-drift--b"
                  : "memory-active-blob-drift memory-active-blob-drift--c";
            const driftDuration = 16 + (blob.key.length % 9) + movement * 4;
            const driftDelay = -(blob.key.charCodeAt(0) % 11);

            return (
              <g key={blob.key} transform={`translate(${blob.x} ${blob.y})`}>
                <g
                  className={driftVariant}
                  style={
                    blobMotion
                      ? {
                          animationDuration: `${driftDuration}s`,
                          animationDelay: `${driftDelay}s`,
                        }
                      : undefined
                  }
                >
                  <circle
                    cx={0}
                    cy={0}
                    fill={`url(#${id}-${blob.key})`}
                    opacity={blob.opacity}
                    r={blob.radius}
                  />
                </g>
              </g>
            );
          })}
        </g>

        {showMutation && !gradientOnly ? (
          <path
            d={`M ${center - baseRadius * 0.72} ${center - baseRadius * 0.54}
                C ${center - 8} ${center - baseRadius * 0.98},
                  ${center + 28} ${center + baseRadius * 0.86},
                  ${center + baseRadius * 0.72} ${center + baseRadius * 0.42}`}
            fill="none"
            opacity="0.46"
            stroke="#F45BC5"
            strokeLinecap="round"
            strokeWidth="10"
          />
        ) : null}
      </g>
    </svg>
  );
}

function sampleEncountersEvenly<T>(items: T[], count: number): T[] {
  if (items.length <= count) return items;
  const step = (items.length - 1) / Math.max(1, count - 1);
  return Array.from({ length: count }, (_, index) => {
    const slot = Math.min(items.length - 1, Math.round(index * step));
    return items[slot]!;
  });
}
