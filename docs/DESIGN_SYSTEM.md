# CruxLog — Design System (v2.0, dark matte)

A calm, dark, photo-forward look: flat charcoal surfaces, one soft purple accent, big friendly numbers, grade colours as the signature, and small reward moments when you climb well. No glow gradients, no glass, no shadows on cards.

Companion docs: `MVP_SPEC.md` (what exists), `USER_FLOW.md` (how it is used), `COMPONENTS.md` (what is built). This file says **how it looks and behaves**.

> **v2.0 changes:** active theme is now **dark matte** (v1.1 light is kept as `theme/tokens.light.ts`, inactive). Synced to the real component inventory (Sora + Inter, `HeroCard`, `GradePill`, `ResultDonut`, `WeekStrip`, `FloatingTabBar`, analytics, session and celebration components). New: per-screen recipes with one named hero, a placeholder-art and hold-photo spec, a duplicate-component register, and a rule that the Progress screen has one hero chart with the rest under "Deep dive".
> Items marked **(verify)** were written from screenshots or the component index and should be checked against the code. If the code and this file differ, decide which wins and update both in the same commit.

---

## 1. Principles

1. **Calm first.** Few controls, lots of air, one primary action per screen.
2. **One hero per screen.** Name it before designing the screen. Everything else is visibly smaller and quieter.
3. **Numbers are the hero.** Big stat values, small uppercase labels.
4. **Grade colour is the signature.** The same four band colours everywhere a grade appears.
5. **Photo-forward.** Projects and routes lead with an image (a real photo, or our hold placeholder), never an empty grey box.
6. **Rewards, not noise.** Celebrate sends and personal bests; stay quiet otherwise.
7. **Gym-proof.** Large targets, high-contrast text, one-handed use, no gestures without a visible alternative.
8. **Offline is invisible.** Nothing waits on the network; the only trace is the small sync chip.

---

## 2. Design Tokens

Single source of truth in `theme/tokens.ts`. Components never hard-code colours, sizes, radii, spacing or fonts. The inactive light set lives in `theme/tokens.light.ts` with the same keys, so a light theme can return later without touching components.

```ts
export const colors = {
  // Surfaces: separated by tone and a hairline border, not by shadow
  bg: "#101014",
  card: "#1A1A20",
  cardMuted: "#22222A", // inset tiles, inputs, unselected chips
  border: "rgba(255, 255, 255, 0.07)",

  // Text
  text: "#F2F3F7",
  textMuted: "#9A9AA8",
  textOnAccent: "#FFFFFF",

  // Accent: purple means "do this" (primary action), "you are here" (active), or "Top" (a result)
  accent: "#7059DB", // filled buttons and the centre Start button (white text)
  accentPressed: "#5F49C4",
  accentSoft: "#2D2B3E", // selected chip, active tab capsule, tinted card
  accentText: "#A596F5", // links, active icons, text on accentSoft

  // Results (fills for chart segments and dots; text uses *Text; always with a text label)
  flash: "#5ED16B",
  flashSoft: "#25372C",
  flashText: "#8BE59A",
  top: "#8B7CF6",
  topSoft: "#2C2A42",
  topText: "#A596F5",
  attempt: "#B8A66A",
  attemptSoft: "#33302C",
  attemptText: "#D9C99A",
  fail: "#7A7987",
  failSoft: "#292930",
  failText: "#B4B3C0",

  // Grade bands (see Section 5)
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

  // Feedback (red is reserved for destructive actions and errors)
  danger: "#E5483B",
  dangerSoft: "#3A2124",
  dangerText: "#FF8A80",
  success: "#5ED16B",

  // Overlay
  scrim: "rgba(0, 0, 0, 0.55)",
};

export const radius = { sm: 10, md: 16, lg: 22, xl: 28, pill: 999 };
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 }; // 4pt grid

// Cards have NO shadow on dark. Only the floating centre button gets one.
export const shadow = {
  floating: {
    shadowColor: "#000000",
    shadowOpacity: 0.5,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
};

export const type = {
  display: {
    fontFamily: "Sora_600SemiBold",
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -0.5,
  },
  title: { fontFamily: "Sora_600SemiBold", fontSize: 22, lineHeight: 28 },
  stat: {
    fontFamily: "Sora_600SemiBold",
    fontSize: 34,
    lineHeight: 38,
    fontVariant: ["tabular-nums"],
  },
  statSm: {
    fontFamily: "Sora_600SemiBold",
    fontSize: 24,
    lineHeight: 28,
    fontVariant: ["tabular-nums"],
  },
  heading: { fontFamily: "Inter_600SemiBold", fontSize: 17, lineHeight: 22 },
  body: { fontFamily: "Inter_400Regular", fontSize: 15, lineHeight: 22 },
  control: { fontFamily: "Inter_500Medium", fontSize: 14, lineHeight: 20 }, // chips, buttons, toggles: sentence case
  label: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  }, // section and stat labels only
  caption: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 16 },
};

export const motion = {
  duration: { fast: 120, base: 200, slow: 320, celebrate: 900 }, // ms
  easing: {
    standard: [0.2, 0, 0, 1],
    enter: [0, 0, 0, 1],
    exit: [0.4, 0, 1, 1],
  }, // cubic-bezier
  spring: { damping: 18, stiffness: 220 },
};
```

The `*Soft` colours are solid values blended for use **on `card`**. On `bg` they look slightly different, which is fine.

### Contrast (WCAG, computed)

| Pair                                                                     | Ratio                       | Result                                            |
| ------------------------------------------------------------------------ | --------------------------- | ------------------------------------------------- |
| `text` on `bg` / `card` / `cardMuted`                                    | 17.1 / 15.6 / 14.2          | Pass                                              |
| `textMuted` on `bg` / `card` / `cardMuted`                               | 6.8 / 6.2 / 5.7             | Pass AA                                           |
| `textOnAccent` on `accent` / `accentPressed`                             | 5.1 / 6.5                   | Pass                                              |
| `accentText` on `card` / `accentSoft` / `bg`                             | 6.8 / 5.4 / 7.5             | Pass                                              |
| `flashText` on `flashSoft`                                               | 8.3                         | Pass                                              |
| `topText` on `topSoft`                                                   | 5.5                         | Pass                                              |
| `attemptText` on `attemptSoft`                                           | 8.0                         | Pass                                              |
| `failText` on `failSoft`                                                 | 7.0                         | Pass                                              |
| `dangerText` on `dangerSoft` / `card`                                    | 6.5 / 7.6                   | Pass                                              |
| Band text on band soft (beginner / intermediate / advanced / expert)     | 7.3 / 7.9 / 7.9 / 6.5       | Pass                                              |
| Band text on `card`                                                      | 9.6 / 10.7 / 10.8 / 8.3     | Pass                                              |
| Band solid on `card` (stripe, chart bars): 3:1 needed for graphics       | 6.8 / 8.3 / 8.6 / 5.8       | Pass                                              |
| Result fills on `card` (flash / top / attempt / fail / danger), graphics | 8.9 / 5.2 / 7.2 / 4.1 / 4.4 | Pass                                              |
| `card` vs `bg`, `border` vs `card`                                       | 1.1 / 1.2                   | Decorative separation only, never carries meaning |

Rules: text uses the `*Text` tokens, never fills. Fills are for chart segments, dots and stripes, and always sit beside a text label, so meaning never depends on colour alone. Because surfaces separate only slightly, **every `Card` needs its 1px `border`**.

---

## 3. Layout Rules (every screen)

- **Padding:** 20px sides; 24px between sections; 12px between items in a section.
- **Safe areas:** respect top and bottom insets. When content scrolls under the status bar, a **solid `bg` scrim** sits behind it, so text never shows through the clock.
- **Cards:** one style only. `card` background, 1px `border`, `radius.lg`, 16px padding, **no shadow**, spring press-scale when tappable.
- **Section labels:** `label` style, `textMuted`, 12px above content.
- **Touch targets:** at least 44×44. Primary buttons 52px high.
- **One primary action per screen:** one filled-`accent` control. Everything else is secondary (`accentSoft`) or text.
- **No gradients, no glass, no blur** except where Section 4 allows. Texture is optional: a faint speckle at about 3% opacity behind scroll content only, off by default.

### 3.1 Density rules (keeps screens calm)

1. **One hero element per screen**, named in the screen recipe (Section 8).
2. **At most one row of controls above the content.** Anything else goes in a filter bottom sheet.
3. **First content item starts within 40% of the screen height** on a typical phone (about 390×844).
4. **No number appears twice on one screen.**
5. **Maximum four stat tiles in a row**; each value on one line (`adjustsFontSizeToFit`), never wrapped.
6. **Empty values collapse** into one line such as "No attempts yet".
7. **Chips and buttons use sentence case** (`control`). Uppercase tracked text is only for small `label`s.
8. **Progress opens with one hero chart and three trend tiles.** Every other chart lives under "Deep dive" (Section 8).

### 3.2 Floating elements

1. **One floating element per screen** besides the tab bar (the centre button _or_ a pinned primary button).
2. Scroll content gets bottom padding = tab bar height (about 64) + centre-button overhang (14) + 24. On Active Session (no tab bar), padding = pinned button height + 24.
3. Nothing may cover a card or a row at rest.
4. **Active Session hides the tab bar**; leaving it shows the bar again with the centre button reading "Resume".
5. The centre button must never be clipped: the bar container uses `overflow: visible`.

---

## 4. Navigation

```
Tab bar:  Home · Projects · [ Start / Resume ] · Progress · Logbook
Settings: gear icon in the Home and Logbook headers
```

- **`FloatingTabBar`:** a flat dark pill (`card`, 1px `border`), **no blur**. The active tab gets an `accentSoft` capsule with `accentText` icon and label. Icon + label always. Five items must fit the smallest phone without truncation.
- **Centre button:** an action, not a tab. 56px circle, `accent`, raised 14px above the bar with a ring in `bg` colour and `shadow.floating`. Label baseline matches the other tabs.
  - No session: "＋", label "Start" → Start Session sheet (gym pre-filled to the last gym).
  - Session running: live elapsed time, label "Resume" → Active Session. Soft pulse off under reduce-motion.
  - One shared `startOrResume` action serves Home, this button and "Start & log attempt".
- **Hidden:** while the keyboard is open, and on Active Session.

---

## 5. Grade Bands (the signature)

Grades are stored as an index. `gradeBand(gradeIndex)` is the only mapping; it works for any display grade system (V-scale or Font).

| Band         | V-scale | Colour     | Tokens              |
| ------------ | ------- | ---------- | ------------------- |
| Beginner     | V0–V2   | slate blue | `bandBeginner*`     |
| Intermediate | V3–V5   | teal       | `bandIntermediate*` |
| Advanced     | V6–V8   | amber      | `bandAdvanced*`     |
| Expert       | V9+     | plum       | `bandExpert*`       |

> **Decision flagged:** the original app used green for V3–V5, but green also means **Flash**. On dark, Flash is a clear green (hue about 127°) and Intermediate is a cyan-teal (about 178°) so they stay apart. Red is never a grade colour.

Where band colours appear, always with the grade as text:

- `GradePill` (soft background + band text colour).
- **Grade chip on photo cards:** `GradePill` pinned top-left over the image, on a solid `bg` at 70% so it reads on any photo.
- A **4px left accent stripe** on `ProjectCard` and `ClimbRow`, inset 14px from top and bottom with fully rounded ends (never clipped by the card corner).
- Bars in `GradePyramid`, `AscentPyramid` and `SessionPyramidChart` (solid fill).
- The tint on the "Hardest" stat tile and the hold placeholder art (Section 9).

---

## 6. Typography Usage

| Use                                                   | Style                                     |
| ----------------------------------------------------- | ----------------------------------------- |
| Screen title, greeting                                | `display` / `title` (Sora)                |
| Stat values, timers, grades in pills                  | `stat` / `statSm` (Sora, tabular figures) |
| Row titles, card titles                               | `heading`                                 |
| Paragraphs, notes                                     | `body`                                    |
| Chips, segmented toggles, buttons, links              | `control` (sentence case)                 |
| Section titles ("Projects"), stat labels ("SESSIONS") | `label` (uppercase, tracked)              |
| Secondary info, timestamps, captions                  | `caption` in `textMuted`                  |

- Timers and counts use **tabular figures** so digits don't jump.
- Support large system text: layouts reflow, not clip. Stat values shrink to fit on one line.
- Fonts load before the splash screen hides.

---

## 7. Component Register

Built in `components/ui/`, `components/session/`, `components/analytics/`, `components/celebration/`. **Reuse before creating.** Every new or removed component updates `COMPONENTS.md` and this table in the same commit.

### 7.1 Core (`components/ui/`) and their matte treatment

| Component                          | Matte treatment                                                                                                                                                                        |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Card`                             | Solid `card`, 1px `border`, `radius.lg`, no shadow, press-scale when tappable. The only card style.                                                                                    |
| `PrimaryButton`                    | Full-width, `accent` fill, white text, 52px, press scale, light haptic                                                                                                                 |
| `SecondaryButton`                  | `accentSoft` fill, `accentText`                                                                                                                                                        |
| `Chip` / `Pill`                    | Sentence case; selected = `accentSoft` + `accentText`; unselected = `cardMuted`                                                                                                        |
| `ResultChip`                       | Flash / Top / Attempt: soft fill + text label + dot                                                                                                                                    |
| `GradePill`                        | Band soft + band text; "—" when no grade, never "undefined"                                                                                                                            |
| `StatTile`                         | `statSm`/`stat` value on one line, `label` below, optional icon and meaning-based soft tint                                                                                            |
| `HeroCard`                         | Flat `Card` variant, **no gradient**; optional faint hold silhouette at about 6% opacity, partly off the edge                                                                          |
| `ProjectCard`                      | Photo or hold placeholder on top, grade chip top-left, nickname (one line), "Gym · tags", then "No attempts yet" or "N burns · last tried", left band stripe, sparkline, swipe actions |
| `SentProjectCard`                  | Compact card with a Flash/Top badge                                                                                                                                                    |
| `SessionCard`                      | Date badge, gym, time range, duration, climbs / sends / flashes, **segmented result bar in result colours**, "Hardest" + `GradePill`                                                   |
| `ClimbRow`                         | Grade pill, result chip, time, attempts if above 1, project nickname if linked, band stripe, swipe-to-delete                                                                           |
| `WeekStrip`                        | Mon–Sun dots (filled = climbed, ringed = today), streak pill with a vector flame, no emoji                                                                                             |
| `SectionHeader`                    | `label` with optional "See all" in `accentText`                                                                                                                                        |
| `EmptyState` / `EmptyStateCard`    | Hold illustration, title, one line, one action                                                                                                                                         |
| `FloatingTabBar`                   | See Section 4                                                                                                                                                                          |
| `AnimatedCounter`                  | Always lands on the true value, even with reduce-motion                                                                                                                                |
| `UndoToast`                        | 5 seconds, never blocks input                                                                                                                                                          |
| `SyncChip`                         | Synced / Syncing / N waiting / Offline                                                                                                                                                 |
| `ResultDonut`                      | Rounded caps, small gaps, centre value, text legend; the Progress hero                                                                                                                 |
| `GradePyramid`, `VolumeChart`      | Band / result colours, labelled values                                                                                                                                                 |
| `LogbookCalendar`                  | Month grid, dot per climbing day, today ringed, tap to filter                                                                                                                          |
| `ConfettiBurst`, `VideoPlayerView` | Celebration and beta playback (Section 10)                                                                                                                                             |

### 7.2 Session (`components/session/`)

`StartSessionSheet`, `LogSheet`, `GradeSheet`, `GradeEstimationSheet`, `RestTimerPickerSheet` use the shared bottom-sheet style: `card` background, `radius.xl` top corners, drag handle, `scrim` behind. `ResultToggle` (three-way, result colours when selected), `LoggerControls`, `FailureReasonPrompt` + `FailureTagSelector` (chips: Pump, Foot slip, Power, Beta error, Fear), `RestTimer` + `RestTimerPill` (countdown from a stored end time so it survives backgrounding), `SessionInsights`, `SessionPyramidChart`, `ShareWorkoutCard` (off-screen card rendered to an image; uses the dark tokens so the shared image matches the app).

### 7.3 Analytics (`components/analytics/`)

`AscentPyramid`, `GradeProgressionTimeline`, `WallAngleRadar`, `RootCauseFailureChart`, `ACWRWidget`, `WeeklyCapsuleBarChart`, `MonthlyVolumeWidget`, `OutcomeRingGauge`. Each sits in a `Card` with a title and a one-line takeaway. Chart colours come from result and band tokens only. Gridlines use `border`, axis text `textMuted`.

### 7.4 Duplicate register (report, do not merge without approval)

| Overlap                | Where                                                         | Direction                                      |
| ---------------------- | ------------------------------------------------------------- | ---------------------------------------------- |
| Three pyramids         | `GradePyramid`, `AscentPyramid`, `SessionPyramidChart`        | One pyramid component with a `mode` prop       |
| Three volume charts    | `VolumeChart`, `WeeklyCapsuleBarChart`, `MonthlyVolumeWidget` | One bar chart with a `period` prop             |
| Two ring/donut results | `ResultDonut`, `OutcomeRingGauge`                             | Keep `ResultDonut`; make the gauge a `variant` |
| Two empty states       | `EmptyState`, `EmptyStateCard`                                | One component with `inline` prop               |
| Three button files     | `Button`, `PrimaryButton`, `SecondaryButton`                  | Remove `Button` if only the other two are used |
| Chip family            | `Chip`, `Pill`, `ResultChip`                                  | `ResultChip` stays; merge `Chip` and `Pill`    |

### 7.5 States (every interactive component)

| State                            | Treatment                                                                                                         |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Default                          | As specified                                                                                                      |
| Pressed                          | 96% scale or `accentPressed`, `motion.duration.fast`; light haptic on primary actions                             |
| Disabled                         | 40% opacity, still readable, never the only cue                                                                   |
| Loading                          | Button shows a spinner and keeps its width; lists show `cardMuted` skeleton blocks                                |
| Error                            | Inline `dangerSoft` message with `dangerText` and a retry action; fields get a `danger` border and a text message |
| Focus (keyboard / screen reader) | 2px `accentText` ring; logical focus order                                                                        |
| Selected                         | `accentSoft` + `accentText`, plus a checkmark or other non-colour cue where practical                             |

---

## 8. Screens

Each screen has **one named hero**. Status: **Built** = exists in the app. **Restyle** = exists, needs the matte treatment. **Planned** = not built yet.

| Screen                                                   | Hero                         | Layout                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | Status  |
| -------------------------------------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| **Home** (`app/index.tsx`)                               | "Today's session" `HeroCard` | Greeting "Keep climbing, <name>" with a badge for the hardest send this month → three `StatTile`s (Sessions, Climbs, Sends this week) → "Today's session" card: last gym, last session summary, `WeekStrip` dots as the weekly goal, one full-width "Start session" button ("Resume session" + live timer when active) → best-send banner (strictly harder than any previous send) → Projects strip (`ProjectCard`) → Recent sessions (`SessionCard`, three). First-run: welcome illustration + "Log your first session". | Restyle |
| **Progress** (`app/analytics.tsx`)                       | `ResultDonut`                | Period filter → hero donut (Flash / Top / Attempt) with "<grade> average of last 20 climbs" in the centre and the legend on the right → three trend tiles (Weekly volume, Flash rate, Hardest grade) with sparklines → **Deep dive** section: `GradeProgressionTimeline`, `AscentPyramid`, `WallAngleRadar`, `RootCauseFailureChart`, `ACWRWidget`, each in a `Card`                                                                                                                                                      | Restyle |
| **Projects** (`app/projects.tsx`)                        | The project photo cards      | Header "＋ New" → one control row (In progress / Sent / Abandoned) → `ProjectCard` list with photo or hold placeholder; `SentProjectCard` in the Sent tab; illustrated empty states per tab                                                                                                                                                                                                                                                                                                                               | Restyle |
| **Project detail** (`app/project/[id].tsx`)              | Media header                 | Photo or video header with back button and ⋯ → grade, wall angle and hold-type chips → burns counter and high-watermark moves → beta notes → attempt history and tick log → "Log attempt"                                                                                                                                                                                                                                                                                                                                 | Restyle |
| **Active Session** (`app/session/index.tsx`, no tab bar) | Live timer                   | Header: back, gym + `SyncChip`, "Finish session" → large timer + climbs count → `RestTimerPill` when active → `LoggerControls` + `ResultToggle` + quick "+1 attempt" → `ClimbRow` stream with swipe-to-delete and Undo → pinned "Log climb" button. Fall prompt after an Attempt.                                                                                                                                                                                                                                         | Restyle |
| **End** (`app/session/end.tsx`)                          | Effort rating                | Effort 1–5, notes, gym → one "Finish" button                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | Restyle |
| **Session summary** (`app/session/detail/[id].tsx`)      | Sends count + hardest send   | Celebration trigger → stat row → `ResultDonut` + `SessionPyramidChart` → `SessionInsights` → `ShareWorkoutCard` → one "Done" button                                                                                                                                                                                                                                                                                                                                                                                       | Restyle |
| **Logbook** (`app/profile.tsx`)                          | Lifetime stats banner        | Lifetime stats → `LogbookCalendar` → month-grouped `SessionCard`s                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Restyle |
| **Settings** (`app/settings.tsx`)                        | — (list)                     | Grade scale, home gym, celebrations and haptics, rest timer length, sync, data tools; destructive actions in `dangerText` on `dangerSoft`                                                                                                                                                                                                                                                                                                                                                                                 | Restyle |

### States on every screen

- **Loading:** `cardMuted` skeletons (data is local, so near-instant).
- **Empty:** `EmptyState` with a hold illustration and one clear action.
- **Offline / waiting to sync:** `SyncChip` in the header; never a blocking error.
- **Error:** inline `dangerSoft` card with retry.

---

## 9. Imagery and Iconography

- **Icons:** one icon set, 24px in navigation and 20px inline, 1.75 stroke, `textMuted` by default and `accentText` when active. **No emoji in the UI.**
- **Hold photography (preferred):** moody close-ups of one climbing hold on a dark speckled wall, matte plastic, soft studio light, lots of dark space, no text, no logos, no people. Six colours (teal, magenta-pink, warm yellow, orange, purple, off-white), 1:1 for cards and 16:9 for the project header. Stored in `assets/holds/`, under 200KB each, WebP or PNG, bundled for offline use.
- **Placeholder art** (when a project has no photo and no hold image is available): a flat `cardMuted` surface with a large rounded hold shape drawn in `react-native-svg`, tinted with the grade-band soft colour and a 1px band-colour outline at 40% opacity. Never an empty grey box.
- **Project photos from the user** are cropped to 4:3 with a `bg` gradient at the bottom edge only if text sits on them.
- **Illustration style (empty states, welcome):** flat, soft vector or photo-style hold on a dark surface; palette limited to charcoal, accent purple, and one band colour; no text in images. Assets: `welcome-hero.png`, `empty-sessions.png`, `empty-projects.png`, `empty-synced.png`. They were made for the light theme, so regenerate them on a dark background or place them in a `card` with rounded corners until then.
- **Decorative images** are hidden from screen readers; informative ones get a label.
- Do not copy another app's photos, brand name, avatars or icons.

---

## 10. Motion, Haptics and Celebrations

- **Motion:** use `motion.duration` and `motion.easing` tokens. Press feedback `fast`; sheets and toasts `base`; count-ups and chart entries `slow`. Animate with Reanimated worklets so a timer or animation never re-renders a list.
- **Celebration levels** (`CelebrationProvider`: `triggerSmall`, `triggerMedium`, `triggerBig`, `triggerStreak`; computed from local data, fired once, remembered in a local-only store, cancelled by Undo, never for deleted climbs):
  - **Small:** a Flash gets a row shimmer, a light haptic and a toast.
  - **Medium:** a new hardest send (strictly harder than every previous send, only when a previous best exists) pulses the Hardest tile, with a success haptic and a toast "New hardest: V5".
  - **Big:** a topped project opens a dismissible "Sent!" sheet ("V6 · 14 burns over 4 sessions") with `ConfettiOverlay`.
  - **Streak:** weekly streak at 2, 4, 8 and 12 weeks as a banner.
- Confetti colours come from the result and band tokens, so they work on dark.
- **Reduce motion or "Celebrations" off:** replace animation with the static toast or banner, skip confetti, keep at most one light haptic if haptics are on.
- Logging is never blocked by an animation.

---

## 11. Content Rules

- **Four nouns only:** Session, Climb, Project, Gym. No "route", "boulder", "group" or "routine" in visible text.
- **Results:** Flash, Top, Attempt. **A send is a Flash or a Top; an Attempt is never a send.** One shared `isSend()` function is used everywhere.
- **Dates:** relative for the recent past ("Today", "Yesterday", "3 days ago"), then "Wed 1 Oct". **Durations:** "<1 min" under a minute, then "12m", "1h 4m".
- **Plurals:** one `plural(n, "session")` helper everywhere.
- **Missing values:** "—" or a plain phrase ("No attempts yet", "Not yet"). Never "undefined", "null" or "NaN".
- **Titles:** a project's title is its nickname, with the gym as a secondary line.
- **Empty-state copy:** say what is missing and offer one next step.
- **Tone:** short, encouraging, no exclamation marks except celebrations.

---

## 12. Checklist for Any UI Change

1. Read this file, `USER_FLOW.md` and `COMPONENTS.md`.
2. Name the screen's hero before changing it.
3. Use tokens and existing components only. No hard-coded colours, sizes, radii, spacing or fonts. Do not create a component that already exists.
4. One card style: solid, 1px border, no shadow. No gradients, glass or blur.
5. Respect the density rules (3.1) and floating-element rules (3.2).
6. Grade colours through `gradeBand()`; red only for destructive actions and errors; purple only for primary actions, active states and Top results.
7. Cover all states (loading, empty, error, offline) and all component states.
8. Check contrast (4.5:1 text, 3:1 graphics), a small phone, large system text and reduce-motion.
9. Keep reads reactive from the local database and writes through the query layer; no network calls from screens.
10. If you change a token or a component, **update this file and `COMPONENTS.md` in the same commit**, and list any deviation.

---

## 13. Later

- **Light theme:** re-enable `theme/tokens.light.ts` behind a Settings switch ("System / Light / Dark") using `useColorScheme()`. The light grade bands need a re-check against this file.
- **Suggested focus** line on the Home hero (weakest wall angle from `WallAngleRadar` data).
- **Mark holds on a project photo** (tap to pin a hold on the image).
- **Speckle texture** and a refreshed illustration set once the core screens are stable.
