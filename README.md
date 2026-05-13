# Echo

Echo is a small wearable sound-reactive companion that senses nearby Echoes and transforms moments of proximity into sound memories.

The project explores how belonging can emerge through subtle forms of co-presence rather than direct conversation, constant messaging, or social performance.

## Concept

Echo devices detect nearby Echoes through Bluetooth proximity. Each Echo has a sound identity. When another Echo is nearby, the device plays that Echo's melody.

Distance does not primarily control volume. Instead, closeness controls harmonic density:

- Far: melody note only
- Near: melody note + fifth
- Close: melody note + fifth + octave
- Very close: melody note + fifth + octave + shimmer note

If two Echoes stay very close for a sustained time, they exchange a small melody fragment. At the end of the day, the Station/Nest uploads encounter logs and the app visualizes them as ambient chromatography-like memories.

This version uses mock data only. No real hardware, Bluetooth, Raspberry Pi, ESP32, or Supabase integration is implemented yet.

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Tone.js for browser sound testing
- SVG for chromatography-inspired sound memory visuals

## Routes

- `/onboarding` - connect a new Echo, choose type, name it, and confirm setup
- `/profile` - view the user's Echo profile and current sonic identity
- `/today` - view today's daily sound memory
- `/archive` - browse past daily memories
- `/evolution` - see melody fragment exchanges over time
- `/sound-test` - test the three Echo voices with proximity-based harmonic expansion

## Project Structure

```txt
src/
  app/
    onboarding/
    profile/
    today/
    archive/
    evolution/
    sound-test/
  components/
    AbstractMemoryVisual.tsx
    AppShell.tsx
    EchoCard.tsx
    EvolutionCard.tsx
    MemoryCard.tsx
    SoundTestVoice.tsx
  lib/
    mockData.ts
    soundRules.ts
    types.ts
    visualRules.ts
```

## Getting Started

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open the app at:

```txt
http://localhost:3000
```

## Verification

Run type checks:

```bash
npm run typecheck
```

Run lint:

```bash
npm run lint
```

Create a production build:

```bash
npm run build
```

## Raspberry Pi station ingest (optional)

BLE 업로드 후 Pi가 호출하는 HTTPS 인제스트(`INGEST_SECRET` Bearer)는 **`docs/STATION_AND_INTEGRATION.md`**에 스키마·`deviceId` 규칙·`curl` 예시가 정리되어 있습니다. 엔드포인트: `/api/ingest/encounters`, `/api/ingest/evolutions`, `/api/ingest/echo-state`.

## Design Direction

Echo should feel soft, quiet, intimate, and ambient. The app should read as a poetic archive rather than an analytics dashboard.

The visual language uses circular chromatography-inspired traces:

- soft overlapping color stains
- translucent gradients
- irregular orbital rings
- subtle breathing animation
- warm off-white background
- no charts, bars, waveforms, or dashboard styling

## Todo

- [ ] Prototype / test sonic visuals in p5.js
- [ ] Echo logo and preview imagery
- [ ] Map personality controls to sound (personality tuning → sound matching)

## Future Integration

The mock data is shaped to be compatible with future database tables:

- `users`
- `echo_devices`
- `sound_profiles`
- `sound_voices`
- `encounters`
- `daily_memories`
- `echo_evolutions`

Real API calls can later replace `src/lib/mockData.ts` while preserving the current UI structure.
