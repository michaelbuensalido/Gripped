# Bouldering App — Design System (v1.1, light theme)

A calm, rounded, single-accent look that stays readable in a bright gym with chalky hands. Soft cards, one purple accent, big friendly numbers, grade colours as the app's signature, and small reward moments when you climb well.

Companion docs: `MVP_SPEC.md` (what exists), `USER_FLOW.md` (how it is used). This file says **how it looks and behaves**.

> **v1.1 changes:** synced to the built app (tabs, Active Session without tab bar, Logbook, richer cards); new rules for density, floating elements, typography, component states, motion, icons and imagery, and content; grade bands now have full tokens (V6–V8 is amber, not red); v1 sections 6 and 8 replaced.
> Items marked **(verify)** were written from screenshots and should be checked against the code.

---

## 1. Principles

1. **Calm first.** Few controls, lots of air, one primary action per screen.
2. **Numbers are the hero.** Big stat values, quiet labels.
3. **Grade colour is the signature.** The same four band colours everywhere a grade appears.
4. **Rewards, not noise.** Celebrate sends and personal bests; stay quiet otherwise.
5. **Gym-proof.** Large targets, high contrast, one-handed use, no gestures without a visible alternative.
6. **Offline is invisible.** Nothing waits on the network; the only trace is the small sync chip.

---

## 2. Design Tokens

Single source of truth in `theme/tokens.ts`. Components never hard-code colours, sizes, radii, spacing or fonts. Dark mode later = a second token set. **(verify)** that this block matches the real file; if it differs, the file wins and this doc is updated in the same commit.

```ts
export const colors = {
  // Surfaces
  bg: "#F5F2EC", // warm off-white
  bgTexture: "#E9E4DA",
  card: "#FFFFFF",
  cardMuted: "#F0ECE4", // inset tiles, inputs, unselected chips
  border: "rgba(28, 27, 34, 0.08)",

  // Text
  text: "#1C1B22",
  textMuted: "#6B6877",
  textOnAccent: "#FFFFFF",

  // Brand accent
  accent: "#6A52D1",
  accentPressed: "#5440B5",
  accentSoft: "#ECE8FB",
  accentText: "#5440B5",

  // Results (fills for charts/dots; text uses *Text; always with a text label)
  flash: "#3BA462",
  flashSoft: "#DDF1D3",
  flashText: "#1F6B3A",
  top: "#6A52D1",
  topSoft: "#ECE8FB",
  topText: "#5440B5",
  attempt: "#D9C99A",
  attemptSoft: "#EFE7D0",
  attemptText: "#6B5B2E",
  fail: "#9A99A6",
  failSoft: "#E6E5EA",
  failText: "#4A4955",

  // Grade bands (see Section 5)
  bandBeginnerSoft: "#E6EBF3",
  bandBeginnerText: "#3B4A66",
  bandBeginner: "#6E82A6",
  bandIntermediateSoft: "#D9F0EE",
  bandIntermediateText: "#17615C",
  bandIntermediate: "#2A9A91",
  bandAdvancedSoft: "#FCEBC8",
  bandAdvancedText: "#7A4A06",
  bandAdvanced: "#C27A00",
  bandExpertSoft: "#F3DDF0",
  bandExpertText: "#7A2A70",
  bandExpert: "#B04AA3",

  // Feedback (red is reserved for destructive actions and errors)
  danger: "#C0392B",
  dangerSoft: "#FBE3E6",
  dangerText: "#9B2C3A",
  success: "#2E8B4F",

  // Overlay
  glass: "rgba(255, 255, 255, 0.78)",
  scrim: "rgba(28, 27, 34, 0.40)",
};

export const radius = { sm: 10, md: 16, lg: 22, xl: 28, pill: 999 };
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 }; // 4pt grid

export const shadow = {
  card: {
    shadowColor: "#1C1B22",
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  floating: {
    shadowColor: "#1C1B22",
    shadowOpacity: 0.12,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
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
  }, // section labels only
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

### Contrast (WCAG, computed)

| Pair                                                                 | Ratio                 | Result  |
| -------------------------------------------------------------------- | --------------------- | ------- |
| `text` on `bg` / `card`                                              | 15.3 / 17.1           | Pass    |
| `textMuted` on `card` / `bg` / `cardMuted`                           | 5.4 / 4.9 / 4.6       | Pass AA |
| `textOnAccent` on `accent`                                           | 5.6                   | Pass    |
| `accentText` on `accentSoft` / `cardMuted`                           | 6.3 / 6.4             | Pass    |
| `flashText` on `flashSoft`                                           | 5.5                   | Pass    |
| `attemptText` on `attemptSoft`                                       | 5.4                   | Pass    |
| `failText` on `failSoft`                                             | 7.1                   | Pass    |
| `dangerText` on `dangerSoft` / `card`                                | 6.1 / 7.5             | Pass    |
| Band text on band soft (beginner / intermediate / advanced / expert) | 7.4 / 6.1 / 6.4 / 6.9 | Pass    |
| Band text on `card`                                                  | 8.9 / 7.2 / 7.5 / 8.8 | Pass    |
| Band solid on `card` (stripe, chart bars): 3:1 needed for graphics   | 3.9 / 3.4 / 3.5 / 4.8 | Pass    |

Rules: text uses the `*Text` tokens, never fills. Fills are for chart segments, dots and stripes, and always sit beside a text label, so meaning never depends on colour alone.

---

## 3. Layout Rules (every screen)

- **Padding:** 20px sides; 24px between sections; 12px between items in a section.
- **Safe areas:** respect top and bottom insets. When content scrolls under the status bar, a blurred or solid scrim fades in behind it.
- **Cards:** `card` background, `radius.lg`, `shadow.card`, 16px padding. Never clip a card's shadow (give list containers enough padding or keep overflow visible).
- **Section labels:** `label` style, `textMuted`, 12px above content.
- **Touch targets:** at least 44×44. Primary buttons 52px high.
- **One primary action per screen:** one filled-accent control. Everything else is secondary (`accentSoft`) or text.
- **Texture:** optional chalk-fleck texture at about 4% opacity behind scroll content only. Drop it if it costs performance.

### 3.1 Density rules (keeps screens calm)

1. **At most one row of controls above the content** (for example a segmented toggle plus icon buttons). Anything else (gym, grade range, sort, wall angle) goes in a **filter bottom sheet**.
2. **First content item starts within 40% of the screen height** on a typical phone (about 390×844).
3. **No number appears twice on one screen** (no tiles repeating the toggle counts).
4. **Maximum four stat tiles in a row**; each value on one line (`statSm` with `adjustsFontSizeToFit`), never wrapped.
5. **Lists show only what helps the decision.** Empty values ("0 burns, none, not yet") collapse into one line such as "No attempts yet".
6. **Chips and buttons use sentence case** (`control` type). Wide-tracked uppercase is only for the small section `label`.

### 3.2 Floating elements

1. **One floating element per screen** besides the tab bar (for example the centre button _or_ a pinned primary button, never a floating pill on top of it).
2. Scroll content gets bottom padding = tab bar height (about 64) + centre-button overhang (14) + 24. On screens without a tab bar (Active Session), padding = pinned button height + 24.
3. Nothing may cover a card or a row at rest. If a screen needs a primary action, put it in the header (Projects: "＋ New") or pin it.
4. The **Active Session screen hides the tab bar**; leaving it with the back chevron shows the bar again with the centre button reading "Resume".

---

## 4. Navigation (as built)

```
Tab bar:  Home · Projects · [ Start / Resume ] · Progress · Logbook
Settings: gear icon in the Home and Logbook headers
```

- **Centre button:** an action, not a tab. 56px circle, `accent`, raised 14px above the bar with a ring in the bar's colour and `shadow.floating`.
  - No session: "＋" icon, label "Start" → opens the Start Session sheet (gym pre-filled to the last gym, Outdoor / Other option, one primary button).
  - Session running: live elapsed time in the circle (mm:ss, h:mm:ss after an hour), label "Resume" → goes to Active Session. Optional soft pulse ring; off under reduce-motion.
  - One shared `startOrResume` action serves Home, this button and "Start & log attempt".
- **Tab items:** icon + label always; active item gets the `accentSoft` pill. Five items must fit the smallest phone width without truncation.
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

> **Decision flagged:** v1 used green for V3–V5 and the app currently does too. Green also means **Flash**, so one colour carried two meanings. v1.1 moves V3–V5 to teal. Red is no longer a grade colour: it is reserved for destructive actions and errors.

Where band colours appear, always with the grade as text:

- `GradePill` (soft background + band text colour).
- A **4px left accent stripe** on `ProjectCard` and `ClimbRow`, inset 14px from the top and bottom with fully rounded ends (never clipped by the card corner).
- Bars in the grade pyramid and session insight charts (solid colour).
- The tint on the "Hardest" stat tile.

---

## 6. Typography Usage

| Use                                            | Style                                     |
| ---------------------------------------------- | ----------------------------------------- |
| Screen title, greeting                         | `display` / `title` (Sora)                |
| Stat values, timers, grades in pills           | `stat` / `statSm` (Sora, tabular figures) |
| Row titles, card titles                        | `heading`                                 |
| Paragraphs, notes                              | `body`                                    |
| Chips, segmented toggles, buttons, links       | `control` (sentence case)                 |
| Section titles ("Projects", "Recent sessions") | `label` (uppercase, tracked)              |
| Secondary info, timestamps, captions           | `caption` in `textMuted`                  |

- Timers and counts use **tabular figures** so digits don't jump.
- Support large system text: layouts must reflow, not clip. Stat values shrink to fit on one line.
- Fonts load before the splash screen hides (no flash of system font).

---

## 7. Shared Components

Built once in `components/ui/`; screens are assembled from these. **(verify)** the props column against the code.

### Primitives

| Component                                          | Notes                                                                                                         |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `Screen`                                           | Background, safe areas, header (title, optional subtitle, right actions), status-bar scrim on scroll          |
| `Card`                                             | `default \| muted \| hero`; optional `onPress`; optional left stripe                                          |
| `PrimaryButton` / `SecondaryButton` / `TextButton` | Filled accent / `accentSoft` / text only; `control` type; icon optional; loading state                        |
| `IconButton`                                       | 40–44px, 24px icon, `cardMuted` or transparent background                                                     |
| `Chip` / `FilterChip`                              | Sentence case; selected = `accentSoft` + `accentText`; unselected = `cardMuted`                               |
| `SegmentedControl`                                 | Compact, fits the screen width, sentence case, optional counts                                                |
| `GradePill`                                        | `gradeIndex` → band colours, reads the user's grade system; shows "—" if there is no grade, never "undefined" |
| `ResultChip`                                       | Flash / Top / Attempt; soft fill + text label + dot                                                           |
| `SectionHeader`                                    | `label` style with optional "See all"                                                                         |
| `EmptyState`                                       | Optional illustration, title, one line, one action                                                            |
| `Toast`                                            | With optional Undo (5 seconds); never blocks input                                                            |
| `BottomSheet`                                      | `radius.xl` top corners, drag handle, `card` or glass background                                              |
| `SyncChip`                                         | Synced / Syncing / N waiting / Offline                                                                        |

### Data components

| Component          | Notes                                                                                                                                                                                                                                                    |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `StatTile`         | Value (`stat`/`statSm`, one line), label, optional icon and meaning-based soft tint, optional secondary line                                                                                                                                             |
| `TrendTile`        | Label, value, delta, sparkline                                                                                                                                                                                                                           |
| `HeroCard`         | `accentSoft` → `card` gradient, one primary button, faint rounded climbing-hold silhouette (about 8% opacity, partly off the edge)                                                                                                                       |
| `WeekStrip`        | Mon–Sun dots (filled = climbed, ringed = today) and "N-week streak" with an icon, no emoji                                                                                                                                                               |
| `SessionCard`      | Date badge, gym, time range, duration, climbs / sends / flashes, result-mix bar with legend, "Hardest" + `GradePill`, optional effort and notes line, badges                                                                                             |
| `ProjectCard`      | Compact: `GradePill`, nickname (one line), caption "Gym · tags", then "No attempts yet" or "N burns · N moves linked · last tried", band stripe, small "Log attempt" action; status chip only when informative ("Working", "Close", never "Not started") |
| `ClimbRow`         | Grade pill, result chip, time, attempts if above 1, project nickname if linked, band stripe                                                                                                                                                              |
| `ResultDonut`      | Rounded caps, small gaps, centre value, text legend                                                                                                                                                                                                      |
| `GradePyramid`     | Sends per grade, band colours, labelled bars                                                                                                                                                                                                             |
| `ChartCard`        | Title, chart, one-line takeaway; chart values labelled on the bars                                                                                                                                                                                       |
| `InsightCarousel`  | Paged cards with dots (session pyramid, result mix, difficulty curve)                                                                                                                                                                                    |
| `RestTimer`        | Countdown chip with "+30s" and "Skip"; computed from a stored end time so it survives backgrounding                                                                                                                                                      |
| `CalendarMonth`    | Month grid with a dot per climbing day, today ringed, tap a day to filter                                                                                                                                                                                |
| `CelebrationSheet` | "Sent!" sheet for a topped project (see Section 10)                                                                                                                                                                                                      |
| `FloatingTabBar`   | See Section 4                                                                                                                                                                                                                                            |

### Component states (every interactive component)

| State                            | Treatment                                                                                                          |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Default                          | As specified                                                                                                       |
| Pressed                          | 96% scale or `accentPressed`, `motion.duration.fast`; light haptic on primary actions                              |
| Disabled                         | 40% opacity, no shadow; still readable, never the only cue                                                         |
| Loading                          | Button shows a spinner and keeps its width; lists show `cardMuted` skeleton blocks                                 |
| Error                            | Inline `dangerSoft` message with `dangerText` and a retry action; fields get a `danger` border plus a text message |
| Focus (keyboard / screen reader) | 2px `accent` ring; logical focus order                                                                             |
| Selected                         | `accentSoft` background + `accentText`, and a checkmark or other non-colour cue where practical                    |

---

## 8. Screens

Status: **Built** = seen in the app. **Verify** = exists or was specified but not checked. **Planned** = not yet built.

| Screen                                        | Treatment                                                                                                                                                                                                                                                                                                                          | Status                 |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| Splash, Welcome, Sign up / Log in, Onboarding | Brand moment with the welcome illustration in a rounded card; one primary action; "Try without an account" as text                                                                                                                                                                                                                 | Verify                 |
| **Home**                                      | Greeting + "Best Vx" chip; `HeroCard` (Start / Resume); `WeekStrip`; 3 compact `StatTile`s (sessions, climbs, sends); Projects strip (`ProjectCard` compact); weekly volume `ChartCard`; best-send banner (strictly harder than any previous send); recent sessions (`SessionCard` compact)                                        | Built                  |
| **Active Session** (no tab bar)               | Header: back chevron, gym + `SyncChip`, ⋯ menu (Change gym, Discard session), End; large live timer; `RestTimer` when active; four compact tiles; result toggle (Flash / Top / Attempt) + quick-add grade chips; projects strip; `InsightCarousel`; `ClimbRow` list with swipe-to-delete + Undo; pinned "Log climb" primary button | Built (extras verify)  |
| **Log Climb sheet**                           | `BottomSheet`; result, grade, attempts, optional project, notes, photo; Save                                                                                                                                                                                                                                                       | Built                  |
| **Session Detail / Summary**                  | Back chevron, gym, date + time range + duration, ⋯ menu (Edit, Delete with confirmation + Undo); tiles (climbs, sends, flashes, hardest); result donut or bar; `ClimbRow`s; notes and effort; summary variant adds personal bests and one "Done" button                                                                            | Verify                 |
| **Projects**                                  | Header "＋ New"; one caption line of totals; one control row (In progress \| Sent toggle, sort and filter icon buttons); compact `ProjectCard`s; Add project form; Project detail (history by session, notes, Log attempt, Mark as sent, Archive, Delete)                                                                          | Built (detail verify)  |
| **Logbook**                                   | Header with search and List / Calendar toggle; period segmented control; filter button (sheet); summary tiles; month headers with totals; `SessionCard`s; calendar view                                                                                                                                                            | Built (polish pending) |
| **Progress**                                  | Period control; `ResultDonut` with average grade; `TrendTile`s; grade pyramid; recent sessions                                                                                                                                                                                                                                     | Verify                 |
| **Settings**                                  | Grouped list cards; Celebrations and haptics switch; rest-timer length; Sync section with `SyncChip`; destructive actions in `dangerText` on `dangerSoft`; Developer section (dev builds only)                                                                                                                                     | Verify                 |
| Explore (gyms, shared problems)               | See `MVP_SPEC.md`; not in the current tab set                                                                                                                                                                                                                                                                                      | Planned                |

### States on every screen

- **Loading:** `cardMuted` skeletons (data is local, so this should be near-instant).
- **Empty:** `EmptyState` with an illustration where one exists and one clear action.
- **Offline / waiting to sync:** `SyncChip` in the header; never a blocking error.
- **Error:** inline `dangerSoft` card with retry.

---

## 9. Imagery and Iconography

- **Icons:** one icon set (lucide-react-native or Phosphor), 24px in navigation and 20px inline, 1.75 stroke, `textMuted` by default and `accentText` when active. **No emoji in the UI.**
- **Illustration style:** flat, soft vector with rounded shapes and subtle grain on a solid warm off-white, palette limited to accent purple, lavender, soft green, sand and charcoal, no text in images.
- **Assets** live in `assets/images/` and are bundled (offline-first): `icon.png`, `welcome-hero.png`, `empty-sessions.png`, `empty-projects.png`, `empty-synced.png`. About 1200px wide (hero) or 800×600 (empty states), under 200KB each, WebP or PNG.
- **Where used:** welcome illustration in a rounded card (card colour sampled from the image's corner); empty states on Home first-run, Logbook, Projects and Settings → Sync; the app icon on the splash.
- **Decorative images** are hidden from screen readers; informative ones get a label.

---

## 10. Motion, Haptics and Celebrations

- **Motion:** use `motion.duration` and `motion.easing` tokens. Press feedback `fast`; sheets and toasts `base`; count-ups and chart entries `slow`. Animate with Reanimated worklets so a timer or animation never re-renders a list.
- **Celebration levels** (computed from local data, fired once, remembered in a local-only store, cancelled by Undo, never for deleted climbs):
  - **Small:** a Flash gets a row shimmer, a light haptic and a toast.
  - **Medium:** a new hardest send (strictly harder than every previous send, only when a previous best exists) pulses the Hardest tile, with a success haptic and a toast "New hardest: V5".
  - **Big:** a topped project opens a dismissible "Sent!" sheet ("V6 · 14 burns over 4 sessions") with a short confetti burst.
  - **Milestones:** weekly streak at 2, 4, 8 and 12 weeks as a banner.
- **Number count-ups** must always land on the true value (a missing final value is a bug), including with reduce-motion on.
- **Reduce motion or "Celebrations and haptics" off:** replace animation with the static toast or banner, skip confetti, keep at most one light haptic if haptics are on.
- Logging is never blocked by an animation.

---

## 11. Content Rules

- **Four nouns only:** Session, Climb, Project, Gym. No "route", "boulder", "group" or "routine" in visible text.
- **Results:** Flash, Top, Attempt. **A send is a Flash or a Top; an Attempt is never a send.** One shared `isSend()` function is used everywhere.
- **Dates:** relative for the recent past ("Today", "Yesterday", "3 days ago"), then "Wed 1 Oct". **Durations:** "<1 min" under a minute, then "12m", "1h 4m".
- **Plurals:** one `plural(n, "session")` helper everywhere ("1 session", never "1 sessions").
- **Missing values:** "—" or a plain phrase ("No attempts yet", "Not yet"). Never "undefined", "null" or "NaN".
- **Titles:** a project's title is its nickname, with the gym as a secondary line.
- **Empty-state copy:** say what is missing and offer one next step ("Log your first session", "Add something to work on next").
- **Tone:** short, encouraging, no exclamation marks except celebrations.

---

## 12. Checklist for Any UI Change

Use this instead of the old step-by-step build prompt. Anyone, human or agent, follows it for every UI change:

1. Read this file and `USER_FLOW.md`.
2. Use tokens and shared components only. No hard-coded colours, sizes, radii, spacing or fonts.
3. Respect the density rules (3.1) and floating-element rules (3.2).
4. Use grade bands through `gradeBand()`; red only for destructive actions and errors.
5. Cover all states (loading, empty, error, offline) and all component states.
6. Check contrast, a small phone, large system text and reduce-motion.
7. Keep reads reactive from the local database and writes through the query layer; no network calls.
8. If you change a token or a shared component, **update this file in the same commit**, and list any deviation from it.

---

## 13. Later

- **Dark theme:** a second token set (the original dark reference screens are the starting point), switched by `useColorScheme()`; no screen changes needed because components read tokens.
- **Texture, richer illustration set, and a motion pass** once the core screens are stable.
