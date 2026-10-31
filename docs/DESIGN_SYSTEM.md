# Gripped (CruxLog) — Design System (v4.3, Spatial Chalk & Glass Editorial)

An atmospheric, tactile, photo-forward dark interface engineered for the climbing gym floor: translucent obsidian-charcoal cards suspended over an authentic magnesium-carbonate chalked wall canvas (`assets/chalk_bg.jpg`), an optical frosted-glass floating dock (`FloatingTabBar`), a jewel-like 3D faceted volume brand mark (`assets/logo.png`), electric lavender action accents (`#8E7CFF`), tabular `Sora` & `Inter` typography, and signature four-band grade color coding.

Companion specifications: `MVP_SPEC.md` (product architecture & offline SQLite engine), `USER_FLOW.md` (navigation & interaction flows), `COMPONENTS.md` (component inventory). This document is the single source of truth for **visual craft, materiality, tokens, and motion**.

---

## 1. Design Philosophy & Spatial Architecture

1. **Tactile Authenticity.** A climbing logbook should feel like the gym wall, not a generic SaaS dashboard. Every screen rests over a brushed magnesium-carbonate chalk backdrop (`assets/chalk_bg.jpg`) that gives physical depth to the dark canvas while keeping text razor-sharp.
2. **Three-Plane Spatial Depth.** Surfaces are organized into three distinct optical planes:
   - **Plane 0 — Chalked Wall Canvas:** `#0D0D12` base + `assets/chalk_bg.jpg` (`opacity: 0.52`) + vertical atmospheric scrim (`backdropScrimTop` → `backdropScrimBottom`).
   - **Plane 1 — Translucent Slate Cards:** `rgba(22, 22, 30, 0.86)` (`colors.card`) with a `1px` specular hairline border (`rgba(255, 255, 255, 0.08)`) and soft ambient shadow (`shadow.card`).
   - **Plane 2 — Optical Frosted Glass:** Floating navigation (`FloatingTabBar`) and photo overlays (`OverlayChip`) use real-time dark blur (`BlurView`, `intensity={55}`), `colors.glass` tint, a top-edge specular gradient (`colors.glassHighlight`), and a `1px` `colors.glassBorder` rim (`rgba(255, 255, 255, 0.16)`).
3. **One Hero Per Screen.** Every screen has a single unmistakable focal point (Home: `HeroCard`; Progress: `ResultDonut`; Project Detail: 3D Hold / Route Photo; Active Session: Live Elapsed Timer). Secondary elements step back in size and contrast.
4. **Numbers Are the Hero.** Metrics, grades, and live timers use `Sora` with `tabular-nums` at generous scale, anchored by micro-tracked uppercase `Inter` labels (`10px`, `letterSpacing: 2.5`).
5. **Grade Colour Is the Signature.** The four grade bands (Beginner Slate, Intermediate Teal, Advanced Amber, Expert Plum) are sacred—used exclusively for difficulty across pills, card accent stripes, and pyramid bars.
6. **Gym-Proof Ergonomics.** Minimum `44×44pt` touch targets (`52pt` primary buttons), one-handed thumb reach for session logging, high-contrast legibility under harsh gym lighting, and zero network latency (100% local SQLite reads/writes).

---

## 2. Brand Identity & Dual-Mark Asset System

Gripped separates its **OS Launcher Icon** from its **In-App Brand Mark** so the emblem renders with jewel-like precision at every scale without double-border clipping:

| Asset | File Path | Resolution | Usage & Framing Rules |
| :--- | :--- | :--- | :--- |
| **In-App Brand Mark** | `assets/logo.png` | `512 × 512 px` (24-bit RGB PNG) | Standalone 3D faceted obsidian climbing volume with glowing neon-chartreuse undercling geometry on a full-bleed `#0B0B0F` field (no outer squircle ring). Framed in UI with a `1px` `colors.glassBorder` rim:<br>• **Home Header:** `38×38pt`, `radius.sm`<br>• **Settings About Card:** `44×44pt`, `radius.md`<br>• **Welcome Hero:** `68×68pt`, `radius.lg`<br>• **Launch Sequence:** `140×140pt`, `borderRadius: 32`<br>• **Share Cards:** `16×16pt`, `borderRadius: 4` |
| **OS Launcher Icon** | `assets/icon.png` | `1024 × 1024 px` (24-bit RGB PNG) | Full-bleed store & home-screen launcher icon referenced only in `app.json`. Never used inside small in-app headers. |
| **Splash Emblem** | `assets/splash-icon.png` | `1024 × 1024 px` | Native launch screen centerpiece (`resizeMode: "contain"` on `#000000`). |
| **Chalk Wall Canvas** | `assets/chalk_bg.jpg` | `768 × 1376 px` (~369 KB JPG) | Authentic dark climbing wall with organic white magnesium-carbonate chalk dust and brushed texture. |

---

## 3. Design Tokens (`theme/tokens.ts`)

Single source of truth in `theme/tokens.ts`. Components never hard-code colours, font sizes, radii, spacing, or shadows—always consume tokens via `useTheme()` or `theme/tokens.ts`.

```ts
export const colors = {
  // Surfaces: translucent on dark chalk-dusted climbing wall background
  bg: "transparent",
  bgTexture: "#0D0D12",
  // Backdrop dimming: chalk wall texture sits visibly behind content
  backdropImageOpacity: 0.52,
  backdropScrimTop: "rgba(13, 13, 18, 0.25)",
  backdropScrimBottom: "rgba(13, 13, 18, 0.55)",
  card: "rgba(22, 22, 30, 0.86)",
  cardMuted: "rgba(28, 28, 38, 0.76)", // inset tiles, inputs, unselected chips
  border: "rgba(255, 255, 255, 0.08)",
  // Zero-state chart skeleton
  chartGhost: "rgba(255, 255, 255, 0.06)",
  chartGhostStrong: "rgba(255, 255, 255, 0.12)",

  // Text
  text: "#FFFFFF",
  textMuted: "rgba(255, 255, 255, 0.60)",
  textOnAccent: "#FFFFFF",

  // Accent: Primary Neon Violet / Electric Lavender
  accent: "#8E7CFF",
  accentPressed: "#7A67F5",
  accentSoft: "rgba(142, 124, 255, 0.22)", // selected chip, active tab capsule
  accentText: "#D4CCFF",

  // Results: High-Contrast Semantic Palette
  flash: "#6EE756",
  flashSoft: "rgba(110, 231, 86, 0.18)",
  flashText: "#6EE756",
  top: "#8E7CFF",
  topSoft: "rgba(142, 124, 255, 0.18)",
  topText: "#D4CCFF",
  attempt: "#E2DCBA",
  attemptSoft: "rgba(226, 220, 186, 0.18)",
  attemptText: "#E2DCBA",
  fail: "#5E6068",
  failSoft: "rgba(94, 96, 104, 0.20)",
  failText: "#8E909A",

  // Grade bands (see Section 6)
  bandBeginnerSoft: "#2D303B",
  bandBeginnerText: "#B3C2DE",
  bandBeginner: "#8FA3C7",
  bandIntermediateSoft: "#1D363A",
  bandIntermediateText: "#6BDDD9",
  bandIntermediate: "#2FC7C2",
  bandAdvancedSoft: "#3C3124",
  bandAdvancedText: "#F6C46E",
  bandAdvanced: "#F0A93B",
  bandExpertSoft: "#38283B",
  bandExpertText: "#E59BDB",
  bandExpert: "#D473C8",

  // Feedback (red is strictly reserved for destructive actions and errors)
  danger: "#FF4D4D",
  dangerSoft: "rgba(255, 77, 77, 0.15)",
  dangerText: "#FF9999",
  success: "#6EE756",

  // Overlay & Optical Frosted Glass
  scrim: "rgba(0, 0, 0, 0.75)",
  glass: "rgba(22, 22, 32, 0.48)",
  glassHighlight: "rgba(255, 255, 255, 0.12)",

  // Depth & Specular Rim Borders
  bevelHighlight: "rgba(255, 255, 255, 0.08)",
  bevelShadow: "rgba(0, 0, 0, 0.6)",
  glassBorder: "rgba(255, 255, 255, 0.16)",
  glow: "rgba(142, 124, 255, 0.25)",
  glowFlash: "rgba(110, 231, 86, 0.20)",

  // Translucent Materials (v4.2 Spatial Editorial)
  materialBase: "rgba(22, 22, 30, 0.88)",
  materialBorder: "rgba(255, 255, 255, 0.08)",
  materialHighlight: "rgba(255, 255, 255, 0.12)",
  surfaceInset: "rgba(13, 13, 18, 0.48)", // recessed telemetry strips inside hero cards
  divider: "rgba(255, 255, 255, 0.06)",      // 1px vertical/horizontal cell hairlines

  // Translucent Typography
  textWhitePrimary: "#FFFFFF",
  textWhiteSecondary: "rgba(255, 255, 255, 0.60)",
  textWhiteMuted: "rgba(255, 255, 255, 0.40)",

  // Drill-down hero washes + chart grid (v4.3)
  washAccent: "rgba(142, 124, 255, 0.16)", // top-edge linear wash on volume / neutral heroes
  washFlash: "rgba(110, 231, 86, 0.12)",   // top-edge linear wash on flash heroes
  chartGrid: "rgba(255, 255, 255, 0.05)",  // hairline gridlines behind charts
};

/** Applies alpha to a 6-digit hex (e.g. grade-band `solid` → hero wash). Exposed via `useTheme().withAlpha`. */
export function withAlpha(hex: string, alpha: number): string;

export const radius = { sm: 10, md: 16, lg: 22, xl: 28, pill: 999 };
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 }; // 4pt spatial grid

export const shadow = {
  card: {
    shadowColor: "#000000",
    shadowOpacity: 0.5,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  floating: {
    shadowColor: "#000000",
    shadowOpacity: 0.5,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
};
```

### Contrast & Accessibility Guarantees (WCAG 2.1)

| Token Pair | Contrast Ratio | Rating |
| :--- | :--- | :--- |
| `text` (`#FFFFFF`) on `card` / `bgTexture` | `15.8 : 1` / `19.1 : 1` | **AAA** |
| `textMuted` (`rgba(255,255,255,0.60)`) on `card` | `7.4 : 1` | **AAA** |
| `accentText` (`#D4CCFF`) on `accentSoft` / `card` | `6.8 : 1` / `11.2 : 1` | **AA / AAA** |
| `flashText` (`#6EE756`) on `flashSoft` / `card` | `8.9 : 1` / `11.4 : 1` | **AAA** |
| `band*Text` on `band*Soft` (all 4 grade bands) | `6.5 : 1` – `7.9 : 1` | **AA / AAA** |

---

## 4. Layout, Surfaces & Glass Rules

- **Spatial Grid:** `20pt` horizontal screen padding; `24pt` (`space.xl`) vertical rhythm between sections; `12pt` (`space.md`) gap between cards or rows in a stack.
- **Root Screen Transparency:** All screens inside `app/_layout.tsx` use `backgroundColor: colors.bg` (`"transparent"`) so the global chalk wall canvas remains continuous across tab switches and stack transitions. Full-screen modals use `ScreenContainer` or render `assets/chalk_bg.jpg` over `colors.bgTexture`.
- **Card Anatomy:** `colors.card` fill (`rgba(22, 22, 30, 0.86)`), `1px` `colors.border` rim, `radius.lg` (`22pt`), `16pt` (`space.lg`) internal padding, and `shadow.card`. Interactive cards wrap in `ScalePressable` (`activeScale: 0.97`).
- **Gradients (Strictly Controlled):**
  1. **Atmospheric Wall Scrim:** `LinearGradient` (`[colors.backdropScrimTop, colors.backdropScrimBottom]`) over `assets/chalk_bg.jpg`.
  2. **Glass Specular Highlight:** Top-to-center `LinearGradient` (`[colors.glassHighlight, 'transparent']`) inside `FloatingTabBar`.
  3. **Hero & Photo Scrims:** Radial/linear purple glow (`colors.glow`) on `HeroCard` and legibility scrims over user photography.
- **Density Guardrails:**
  - Maximum **1 hero component** per screen.
  - Maximum **1 control row** (segmented toggle or search/filter bar) above scroll content; secondary filters live in bottom sheets.
  - Maximum **4 `StatTile`s** in a single row; numeric values never wrap (`numberOfLines={1}`, `adjustsFontSizeToFit`).
  - Scroll views reserve `130pt` bottom padding to clear the floating glass dock and raised center button.

---

## 5. Frosted Glass Navigation (`FloatingTabBar`)

```
Floating Dock:  Home · Explore · [ + Start / Resume ] · Progress · Logbook
```

- **Optical Glass Pill (`components/ui/FloatingTabBar.tsx`):**
  - Positioned `24pt` from the bottom edge, `16pt` horizontal inset, `66pt` height, `borderRadius: radius.pill` (`999`), `shadow.floating`.
  - **3-Layer Glass Stack:**
    1. `BlurView` (`intensity={55}`, `tint="dark"`, guarded by native capability check).
    2. Translucent obsidian tint (`backgroundColor: colors.glass`).
    3. Top specular sheen (`LinearGradient` from `colors.glassHighlight` to `'transparent'`) enclosed in a `1px` `colors.glassBorder` rim.
  - **Active Tab Capsule:** `colors.accentSoft` fill + `1px` `colors.glassBorder` rim + `colors.accentText` icon (`strokeWidth: 2`) and label (`fontWeight: '600'`).
- **Raised Center Action (`CenterSessionButton`):**
  - `54×54pt` circle in `colors.accent` (`#8E7CFF`), elevated `18pt` above the dock (`marginTop: -18`), framed by a `2px` `colors.glassBorder` ring and a diffused `colors.accent` drop glow (`shadowOpacity: 0.55`, `shadowRadius: 12`).
  - **Idle State:** `+` icon with `"Start"` caption → opens `StartSessionSheet`.
  - **Active Session State:** Live tabular timer (`MM:SS` / `H:MM:SS`) with `"Resume"` caption and a breathing ring pulse (`pulseAnim`, disabled when `reduceMotion` is on).

---

## 6. Signature Grade Bands

Grades are stored in SQLite as a normalized difficulty index and mapped exclusively through `gradeBand(gradeIndex)` across V-scale and Font scales.

| Band | V-Scale | Palette | Tokens |
| :--- | :--- | :--- | :--- |
| **Beginner** | `V0 – V2` | Slate Blue | `bandBeginner`, `bandBeginnerSoft`, `bandBeginnerText` |
| **Intermediate** | `V3 – V5` | Cyan Teal | `bandIntermediate`, `bandIntermediateSoft`, `bandIntermediateText` |
| **Advanced** | `V6 – V8` | Warm Amber | `bandAdvanced`, `bandAdvancedSoft`, `bandAdvancedText` |
| **Expert** | `V9+` | Electric Plum | `bandExpert`, `bandExpertSoft`, `bandExpertText` |

Where grade colours appear (always accompanied by explicit grade text):
- `GradePill`: `band*Soft` background + `band*Text` label.
- `ProjectCard` & `ClimbRow`: `4pt` vertical left accent bar in solid `band*` colour.
- `GradePyramid`, `AscentPyramid`, & `SessionPyramidChart`: solid `band*` bar fills.

---

## 7. Typography System (`Sora` & `Inter`)

| Role | Token | Typeface & Weight | Size / Line Height | Tracking & Features |
| :--- | :--- | :--- | :--- | :--- |
| **Hero Stat Readout** | `type.heroStat` | `Sora_700Bold` | `42pt / 46pt` | `-1.0pt`, `tabular-nums` |
| **Hero Display** | `type.display` | `Sora_400Regular` | `36pt / 42pt` | `-0.5pt`, `tabular-nums` |
| **Section / Card Title** | `type.title` | `Sora_400Regular` | `22pt / 28pt` | `0pt`, `tabular-nums` |
| **Bold Header / Metric** | `type.titleBold` | `Sora_700Bold` | `22pt / 28pt` | `-0.4pt`, `tabular-nums` |
| **Primary Stat / Timer** | `type.stat` | `Sora_400Regular` | `36pt / 40pt` | `0pt`, `tabular-nums` |
| **Compact Stat** | `type.statSm` | `Sora_400Regular` | `24pt / 28pt` | `0pt`, `tabular-nums` |
| **Inset Telemetry Stat** | `type.statBold` | `Sora_600SemiBold` | `20pt / 24pt` | `-0.3pt`, `tabular-nums` |
| **Row / Modal Heading** | `type.heading` | `Inter_400Regular` | `17pt / 22pt` | `0pt`, `tabular-nums` |
| **Section Subtitle** | `type.sectionTitle` | `Inter_600SemiBold` | `16pt / 22pt` | `0pt`, `tabular-nums` |
| **Body Copy / Notes** | `type.body` | `Inter_400Regular` | `15pt / 22pt` | `0pt`, `tabular-nums` |
| **Interactive Control** | `type.control` | `Inter_500Medium` | `14pt / 20pt` | Sentence case, `tabular-nums` |
| **Micro Eyebrow Label** | `type.label` | `Inter_500Medium` | `10pt / 14pt` | `UPPERCASE`, `+2.5pt` tracking |
| **Compact Micro Badge** | `type.micro` | `Inter_600SemiBold` | `10pt / 13pt` | `UPPERCASE`, `+1.4pt` tracking |
| **Timestamp / Caption** | `type.caption` | `Inter_400Regular` | `12pt / 16pt` | `colors.textMuted`, `tabular-nums` |
| **Medium Caption** | `type.captionMedium` | `Inter_500Medium` | `12pt / 16pt` | `tabular-nums` |
| **Semibold Caption** | `type.captionSemibold` | `Inter_600SemiBold` | `12pt / 16pt` | `tabular-nums` |

---

## 8. Component Architecture (`components/`)

Always compose screens from existing shared components before creating new primitives.

### 8.1 Core UI Primitives (`components/ui/`)

| Component | Craft & Visual Specification |
| :--- | :--- |
| `ScreenContainer` | Full-bleed root wrapper rendering `assets/chalk_bg.jpg` (`opacity: 0.52`) + `LinearGradient` scrim over `colors.bgTexture`. |
| `Screen` | Transparent scroll/static screen scaffold (`backgroundColor: colors.bg`) with safe-area header and `display` title. |
| `FloatingTabBar` | Optical frosted-glass dock (`BlurView` + `colors.glass` + `colors.glassHighlight` + `colors.glassBorder`) and raised `CenterSessionButton`. |
| `BrandedLaunchSequence` |Choreographed launch transition animating `assets/logo.png` (`140×140pt`, `borderRadius: 32`) on `#0B0B0F`. |
| `Card` | Translucent slate surface (`colors.card`), `1px` `colors.border`, `radius.lg`, `shadow.card`, spring press feedback. |
| `HeroCard` | Home centerpiece combining 3D hold artwork (`ClimbingHoldGraphic`), purple ambient glow, objective metadata, and primary CTA. |
| `ClimbingHoldGraphic` | High-resolution 3D studio-lit climbing hold renders (`assets/holds-images/*.png`) mapped by hold type and grade. |
| `PrimaryButton` | `52pt` height, `colors.accent` fill, `colors.textOnAccent` label, `radius.pill` / `radius.lg`, spring scale + haptic. |
| `SecondaryButton` | `colors.accentSoft` fill, `colors.accentText` label, `1px` `colors.border`. |
| `ScalePressable` | Reanimated worklet press wrapper (`motion.pressSpring`, `scale: 0.97`) with integrated `triggerHaptic`. |
| `GradePill` / `ResultChip` | Semantic grade band and outcome (`Flash`, `Top`, `Attempt`) badges with soft tinted fills and high-contrast text. |
| `StatTile` / `TrendTile` | Single-line tabular `Sora` stat value, tracked uppercase `type.label`, and optional sparkline or band tint. |
| `ProjectCard` / `SentProjectCard` | 3D hold or user photo thumbnail, `GradePill`, nickname, gym & tags, burns count, and `4pt` left grade band stripe. |
| `SessionCard` / `ClimbRow` | Session summary card with segmented outcome bar and individual climb stream rows with swipe-to-delete + `UndoToast`. |
| `ClimbLogCard` | Read-only cross-session route card (`components/ui/ClimbLogCard.tsx`) with `4pt` vertical grade-band stripe, `GradePill`, `ResultChip`, inline burns (`×N`), inline Peak label, linked project/notes/crux metadata, and gym/date footer. |
| `GlowBackdrop` | Radial SVG aura reserved for Home/Progress ring heroes (`colors.glow` default). Drill-down hero cards use a clean translucent slate surface + top-edge specular gradient without circular backdrop blobs. |
| `ResultDonut` | Progress hero ring gauge with `Flash`, `Top`, `Attempt`, and `Fail` arcs surrounding the average grade. |
| `DrillHeroCard` | Shared hero scaffold for every drill-down page: `Card variant="hero"` + `168pt` top-edge **linear** tint wash (`washAccent` / `washFlash` / grade-band `withAlpha(solid, 0.2)`) + eyebrow row (`32pt` circular `surfaceInset` icon badge, `type.micro` metric name, `type.captionMedium` context line, right-aligned `trailing` slot). |
| `ContextPill` | `28pt` pill for the hero `trailing` slot. Tones: `accent` (dismissible reset, e.g. `All weeks ×`), `positive` (delta up), `neutral`, `custom` (grade-band tinted, e.g. `All-time PB`). Pressable variants keep a `>= 44pt` hit area via `hitSlop`. |
| `StatStrip` | Recessed `surfaceInset` telemetry strip (2–4 cells, hairline `divider`s). **Value-first:** `type.statBold` numeral above a sentence-case `type.captionMedium` label; optional `valueColor` / `labelColor`. |
| `SegmentedBar` / `BarLegend` | Proportional outcome / band bar: each segment is its own `radius.pill` capsule separated by a `2pt` gap on a `chartGhost` track. `BarLegend` renders dot · bold count · muted label (count optional for pure colour keys). |
| `SessionShareCardModal` | Export sheet + 340pt PNG **share card** (captured at quality 1): chalk wall canvas + scrim, grade-band tinted top wash, brand/duration pills → `Session recap` eyebrow + gym `titleBold` + date → hero panel (`PEAK SEND` + `heroStat` grade in band colour + `Flashed`/`Sent` tag + band-glow `ClimbingHoldGraphic` via `holdTypeForGrade`) → `SegmentedBar` + `BarLegend` → `StatStrip` (`Climbs`, `Sends`, `Send rate`) → `GradePill` highlight sends (+N more) → `Tracked with Gripped` footer. Tokens only. |
| `ChartCardHeader` | Plane-1 chart card title block: `type.sectionTitle` + `type.caption` subtitle + quiet interaction-hint pill (`Tap a bar` / `Tap a grade` / `Tap a node`). |
| `SectionHeader` | Tracked `type.label` title with optional `count` badge (`cardMuted` pill) and optional `action`. |
| `WeekStrip` / `LogbookCalendar` | Weekly streak activity dots with vector flame badge and monthly climbing calendar grid. |

### 8.2 Progress Drill-Down Views (`components/analytics/views/`)

All four Progress drill-down pages share one anatomy (v4.3), built from the primitives above so they read as a single family:

1. **Pinned header** (`app/analytics/stat-detail.tsx`): circular `44×44pt` glass Back button (`glassBorder` rim, `shadow.card`) · two-line title block (`type.label` `PROGRESS` eyebrow over `type.titleBold` page title) · `accentSoft` Timeframe pill (`CalendarDays` + `7D/30D/3M/1Y/All` + chevron) opening the Timeframe sheet.
2. **Hero — `DrillHeroCard`** (1 per page): eyebrow row → primary readout (`type.heroStat` + `type.body` unit) → `SegmentedBar` + `BarLegend` (or hold artwork / focused-grade readout) → `StatStrip`. The top wash is tinted to the metric: lavender (volume, pyramid overview), green (flash), grade-band colour (hardest send, focused grade).
3. **Interactive chart — `Card` + `ChartCardHeader`** (1 per page): tappable `>= 44pt` columns / rows / nodes; selection = `accent` ring or `accentSoft` row, unselected items dim to `0.38–0.45` opacity; hairline `chartGrid` guides.
4. **Route stream:** `SectionHeader` with `count` badge → `Chip` filter row → `ClimbLogCard` list (`listLayout` spring reflow) or `EmptyState`.

Sections enter with a staggered `sectionEntering(i)` (`FadeInDown`, `motion.duration.slow`, `50ms` stagger, UI thread; disabled when `reduceMotion`).

| View | Visual & Interactive Specification |
| :--- | :--- |
| `WeeklyVolumeView` | Hero: total routes + vs-last-week `ContextPill` → outcome `SegmentedBar` + legend → `StatStrip` (`Weekly avg`, `Sessions`, `Wall time`). Chart: stacked capsule columns (`24pt` wide, `Flash` + `Top` + `Attempt`), `chartGrid` baseline / midpoint / ceiling, accent-dashed `avg` guide with pill label, current-week dot. Selecting a week re-scopes hero, strip and list. |
| `FlashEfficiencyView` | Hero: Flash Rate in `flashText` + `Peak flash` `GradePill` → conversion bar + legend → `StatStrip` (`Send rate`, `1st-try share`, `Avg burns`). Chart: `Conversion by grade` rows (`GradePill` · `SegmentedBar` · `statBold` rate + `x/y 1st`) with colour key. |
| `HardestSendView` | Hero: Peak Grade (`heroStat`, grade-band tint) + `All-time PB` `ContextPill` + `~88pt` hold artwork with band-coloured glow + `Best ascent` spotlight row → `StatStrip` (`All-time PB`, `Peak flash`, `Last-20 avg`). Chart: **smoothed (Catmull-Rom Bézier)** weekly progression curve with accent area gradient, grade Y-axis, halo'd peak node, grade value labels above the peak / selected node and a dashed drop line on selection. |
| `SendsByGradeView` | Dual-mode hero: overview (distinct sends, 4-band `SegmentedBar` + counted legend, `StatStrip`) ↔ focused grade (band-tinted readout, 4-cell strip, `All grades ×` reset). Chart: `Ascent pyramid` with flash / grade-band top / `attemptSoft` tail segments, colour key and per-row send + conversion readout. |

---

## 9. Screen Recipes & Hero Hierarchy

| Screen | Named Hero | Spatial Composition |
| :--- | :--- | :--- |
| **Home** (`app/index.tsx`) | `HeroCard` ("Next Objective") | Brand header (`assets/logo.png` `38×38pt` + `GRIPPED` wordmark + Settings gear) →Greeting & `30d Peak Send` pill → 3 `StatTile`s → `HeroCard` with `"START SESSION"` CTA → `WeekStrip` card → Horizontal `PROJECTS` carousel → `RECENT SESSIONS` stack. |
| **Explore** (`app/explore.tsx`) | Gyms & Video Inbox | Display header + `+ ADD GYM` CTA → `GYMS` / `VIDEO INBOX` segmented pill → Search bar → Translucent gym cards & shared beta video cards over chalk backdrop. |
| **Progress** (`app/analytics.tsx`) | `ResultDonut` | Display header + period selector → `ResultDonut` hero card → 3 `Performance Trends` Bento Tiles (Weekly Volume, Flash Efficiency, Hardest Send) → `SENDS BY GRADE` pyramid (`Explore` + per-grade tap) → Deep-dive analytics cards (`WallAngleRadar`, `Recent Sessions`). |
| **Progress Drill-Downs** (`app/analytics/stat-detail.tsx`) | `Card variant="hero"` | Pinned navigation header (`Back`, `titleBold`, Timeframe Sheet pill) → Bespoke drill-down view (`WeeklyVolumeView`, `FlashEfficiencyView`, `HardestSendView`, or `SendsByGradeView`) over global chalk backdrop. |
| **Logbook** (`app/profile.tsx`) | Lifetime Telemetry Strip | Display header + action icons (Add, Search, List/Calendar toggle, Settings) → 4 lifetime `StatTile`s → Month-grouped `SessionCard` stream (or `LogbookCalendar`). |
| **Project Detail** (`app/project/[id].tsx`) | Full-Bleed Photo / 3D Hold | Top photo/hold header with glass overlay controls → Overlapping translucent sheet (`radius.xl`) with grade, burns, beta videos, sequence notes, and attempt history. |
| **Active Session** (`app/session/index.tsx`) | Live Elapsed Timer | Distraction-free logger (tab bar hidden) → Live session clock + `RestTimerPill` → Grade & outcome logger controls → Live `ClimbRow` stream + iOS Live Activity sync. |
| **Settings** (`app/settings.tsx`) | Spring Segmented Controls | Clean utility header → `Climbing` card (spring-sliding `Grade Scale` & `Units` segmented controls + `Rest Timer` presets) → `Feedback` card (`Haptics` & `Send Celebrations` switches) → `Data & Backups` card (`Local Storage`, `Export Backup`, `Restore from Backup`, `Clear All Data`) → `About` card & quiet version footer. |

---

## 10. Choreographed Motion, Haptics & Celebrations

- **Sub-300ms Rule:** All interactive transitions complete within `80ms–280ms` (`motion.duration`). Animations run exclusively on the UI thread via `react-native-reanimated` worklets.
- **Tactile Haptic Pairing:**
  - `triggerHaptic('light')`: Tab switches, chip toggles, filter selection, card presses.
  - `triggerHaptic('medium')`: Starting a session, logging an attempt, attaching beta video.
  - `triggerHaptic('success')`: Logging a Flash/Top, completing a project, setting a new personal best.
- **Tiered Send Celebrations (`CelebrationProvider`):**
  - **Small (Flash):** Subtle row highlight + light haptic + non-blocking toast.
  - **Medium (New Hardest Grade):** Stat pulse + success haptic + milestone banner.
  - **Big (Project Sent):** Dismissible celebration sheet with `ConfettiBurst` in grade-band colours and shareable `ProjectShareCardModal`.
- **Accessibility (`reduceMotion`):** Automatically disables looping pulses (`CenterSessionButton`), confetti particles, and spring bounces while preserving instant state transitions.

---

## 11. Pre-Flight Checklist for Any UI Change

1. **Tokens Only:** Never hard-code hex/rgba strings, font sizes, spacing, or radii. Import from `theme/tokens.ts` or `useTheme()`.
2. **Preserve the Chalk Canvas:** Keep screen root containers `backgroundColor: colors.bg` (`"transparent"`) so `assets/chalk_bg.jpg` remains visible behind all content.
3. **Use `assets/logo.png` for In-App Branding:** Never render `assets/icon.png` inside UI headers or cards; always use `assets/logo.png` with a `1px` `colors.glassBorder` rim.
4. **Reuse Shared Primitives:** Check `components/ui/` before creating any new component.
5. **Offline-First Purity:** Screens read reactively from local SQLite and write via `db/` queries; never make direct network calls from UI components.
6. **Sync Documentation:** Any token or component update must update `docs/DESIGN_SYSTEM.md` in the same commit.
