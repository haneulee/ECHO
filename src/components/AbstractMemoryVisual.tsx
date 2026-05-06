import type { DailyMemory, Encounter } from "@/lib/types";
import {
  getBlobSizeFromDuration,
  getEchoColorPalette,
  getOpacityFromCloseness,
  getRingThicknessFromDensity,
  seededRandom,
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
}: AbstractMemoryVisualProps) {
  const random = seededRandom(seed);
  const center = size / 2;
  const baseRadius = size * 0.29;
  const ringThickness = getRingThicknessFromDensity(density);
  const safeEncounters = encounters.length > 0 ? encounters : [];
  const id = `memory-${seed}`;
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
      const x = center + Math.cos(angle) * radius;
      const y = center + Math.sin(angle) * radius;
      const blobRadius =
        getBlobSizeFromDuration(encounter.durationSec) * (0.72 + random() * 0.68);
      const color = palette[Math.floor(random() * palette.length)];
      const secondaryColor = palette[Math.floor(random() * palette.length)];
      const opacity =
        getOpacityFromCloseness(encounter.closenessAvg) * (0.7 + brightness * 0.4);

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
        <filter id={`${id}-diffuse`} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="10" />
        </filter>
        <filter id={`${id}-paper-soften`} x="-20%" y="-20%" width="140%" height="140%">
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
        r={size * 0.46}
      />
      <g
        className="memory-drift"
        style={{
          animationDuration: duration,
          transformOrigin: `${center}px ${center}px`,
        }}
      >
        <ellipse
          cx={center}
          cy={center + size * 0.006}
          fill="none"
          opacity="0.12"
          rx={baseRadius * 1.08}
          ry={baseRadius * 0.92}
          stroke="#CFC7BA"
          strokeDasharray="1 18"
          strokeLinecap="round"
          strokeWidth={Math.max(10, ringThickness * 0.62)}
        />
        {composition.voices.map((voice, index) => {
          const radius = baseRadius + (index - 1) * ringThickness * 0.42;
          const circumference = 2 * Math.PI * radius;

          return (
            <circle
              cx={center}
              cy={center}
              fill="none"
              key={`${voice.echoType}-ring`}
              opacity={0.14 + voice.presence * 0.24}
              r={radius}
              stroke={`url(#${id}-voice-${index})`}
              strokeDasharray={`${circumference * voice.presence} ${circumference}`}
              strokeLinecap="round"
              strokeWidth={ringThickness * (0.7 + voice.averageCloseness * 0.46)}
              transform={`rotate(${index * 84 - 24} ${center} ${center})`}
            />
          );
        })}

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

        {showMutation ? (
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
