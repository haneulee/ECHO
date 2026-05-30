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

- `/` - marketing landing; redirects signed-in users to `/main`
- `/login`, `/signup` - authentication
- `/onboarding` - register an Echo (name, firmware model name, glow color)
- `/main` - home hub after login (daily visual, Echo settings entry, navigation)
- `/overview` - 3D encounters landscape (replaces `/today`; `/today` redirects here)
- `/archive` - **Memories** carousel of past days
- `/info` - about page with credits popup
- `/profile` - redirects to `/main`
- `/evolution` - melody fragment exchanges over time
- `/sound-test` - proximity-based harmonic expansion lab

Protected routes require a session (or local mock mode). See `src/middleware.ts`.

## Project Structure

```txt
src/
  app/
    main/           # home hub
    overview/       # 3D encounters (TodayPageView)
    archive/        # memories carousel
    info/           # credits
    onboarding/
    today/          # redirects to overview
    profile/        # redirects to main
    evolution/
    sound-test/
  components/
    SonicPresenceLandscape.tsx
    AbstractMemoryVisual.tsx
    AppShell.tsx
    AppAccountMenu.tsx
    EchoSettingsDialog.tsx
    OverviewRangeControls.tsx
    NavigateWithLoader.tsx
  lib/
    echoThemeColor.ts
    uiPoetics.ts
    encounterDisplay.ts
    mockData.ts
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

### UI finetuning (glass + encounters)

Recent UI work aligns the web app with the physical Echo (translucent pebble / frosted glass) and tightens navigation copy.

**Global theme**

- Neutral cream background (`#FCFAF6`); saved `echoColor` tints accents (nav, buttons, inner glow) instead of saturating the whole page
- Echo type themes (`shy` / `messy` / `bounce`) are no longer applied as full-page palettes
- Glass utilities: `.glass-panel`, `.glass-btn-primary`, `.glass-btn-secondary` in `src/app/globals.css`
- Logo mark without a white circle; wordmark vertically aligned with the symbol (`AppShell`)

**Landing (`/main`)**

- Header **Your daily encounters** sits under the logo; the Echo visual is centered
- Click the gradient circle or Echo name to open **Echo settings** (name + glow color)
- Top-right **···** menu: Echo settings, **Info & credits**, **Log out**
- CTAs: **Encounters overview** → `/overview`, **Memories** → `/archive`
- Gradient-dot loader when navigating to overview or archive (`NavigateWithLoader`, `EchoGradientLoader`)
- `gradientOnly` memory visuals omit the white paper disc so they match the logo treatment

**Encounters overview (`/overview`)**

- Three.js glass spheres on a soft terrain (`SonicPresenceLandscape`)
- **Daily / Weekly / Monthly** span + previous/next day (`OverviewRangeControls`; API `?span=weekly|monthly`)
- Labels sit just above each orbit sphere (not at the large orbit ring radius)
- Hover: pointer cursor + encounter time window tooltip
- While sound plays: brighter emissive color, scale/position pulse
- Terrain dots fade into the background at the edges
- `back` on the left; account menu on the right

**Memories (`/archive`)**

- Centered title **Memories**; removed “At the station…” eyebrow/intro copy
- Day headline varies by encounter count (e.g. quiet day, “Wow—that’s a lot…”)
- Carousel uses a circular slide path and horizontal edge fade
- CTA **Encounters overview** (with loader) opens `/overview?date=…`

**Info (`/info`)**

- Credits popup (team / 제작 정보)

**Key files**

| Area | Paths |
|------|--------|
| Theme | `src/lib/echoThemeColor.ts`, `src/app/globals.css` |
| Shell / account | `src/components/AppShell.tsx`, `src/components/AppAccountMenu.tsx` |
| Echo settings | `src/components/EchoSettingsDialog.tsx` |
| Main home | `src/app/main/MainHomeView.tsx` |
| 3D overview | `src/components/SonicPresenceLandscape.tsx`, `src/app/today/TodayPageView.tsx` |
| Memories | `src/app/archive/ArchivePageView.tsx` |
| Copy | `src/lib/uiPoetics.ts` |
| Overview span API | `src/lib/zonedDayRange.ts`, `src/app/api/today/route.ts` |

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
