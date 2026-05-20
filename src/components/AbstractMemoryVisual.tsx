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
}: AbstractMemoryVisualProps) {
  const random = seededRandom(seed);
  const center = svgRound(size / 2);
  const baseRadius = svgRound(size * 0.29);
  const ringThickness = svgRound(getRingThicknessFromDensity(density));
  const safeEncounters = encounters.length > 0 ? encounters : [];
  const idSuffix = visualId?.replace(/[^a-zA-Z0-9_-]/g, "-") ?? "default";
  const id = `memory-${seed}-${idSuffix}`;
  const duration = `${Math.max(9, 18 - movement * 10)}s`;

  const blobs = safeEncounters.flatMap((encounter, encounterIndex) => {
    const repeats = Math.max(2, Math.round(2 + density * 4));
    const palette = getEchoColorPalette(encounter.otherEchoType);

    return Array.from({ length: repeats }).map((_, repeatIndex) => {
      const angle =
        ((encounterIndex + repeatIndex / repeats) / safeEncounters.length) *
          Math.PI *
          2 +
        (random() - 0.5) * 0.7;
      const orbitalWobble = (random() - 0.5) * ringThickness * 1.15;
      const radius = baseRadius + orbitalWobble;
      const x = svgRound(center + Math.cos(angle) * radius);
      const y = svgRound(center + Math.sin(angle) * radius);
      const blobRadius = svgRound(
        getBlobSizeFromDuration(encounter.durationSec) * (0.72 + random() * 0.68),
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
            <stop offset="0%" stopColor={blob.color} stopOpacity="0.86" />
            <stop offset="46%" stopColor={blob.secondaryColor} stopOpacity="0.46" />
            <stop offset="100%" stopColor={blob.secondaryColor} stopOpacity="0" />
          </radialGradient>
        ))}
      </defs>

      <circle
        cx={center}
        cy={center}
        fill={`url(#${id}-paper)`}
        filter={`url(#${id}-paper-soften)`}
        r={svgRound(size * 0.46)}
      />
      <g
        className="memory-drift"
        style={{
          animationDuration: duration,
          transformOrigin: `${center}px ${center}px`,
        }}
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

        <g filter={`url(#${id}-diffuse)`}>
          {blobs.map((blob) => (
            <circle
              cx={blob.x}
              cy={blob.y}
              fill={`url(#${id}-${blob.key})`}
              key={blob.key}
              opacity={blob.opacity}
              r={blob.radius}
            />
          ))}
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
