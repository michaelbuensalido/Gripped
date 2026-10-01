# Bouldering App — Light Mode Design System

Derived from the dark reference screens (Home, Progress). The goal is to keep what makes them feel good (soft rounded cards, one confident accent colour, big friendly numbers, a floating pill tab bar, a donut-style progress chart) and translate it to a light theme that reads well in bright gyms and outdoors.

Companion to `MVP_SPEC.md`. The spec defines _what_ each screen does; this file defines _how it looks_.

---

## 1. What to keep from the reference

| Pattern in the reference                                              | Keep as                                                    |
| --------------------------------------------------------------------- | ---------------------------------------------------------- |
| Large friendly greeting + grade chip                                  | Screen header with display-font title, optional grade chip |
| Three equal stat tiles (108 / 6 / 32)                                 | `StatTile` row, used on Home, Progress, Profile            |
| One hero card with a single purple CTA                                | `HeroCard` (Start / Resume Session)                        |
| Image-led route cards in a horizontal scroll                          | `ProblemCard` in a carousel                                |
| Floating, rounded, blurred tab bar with a pill-highlighted active tab | `FloatingTabBar`                                           |
| Donut chart with a big centre number + colour legend                  | `ResultDonut`                                              |
| Trend tiles with a mini sparkline                                     | `TrendTile`                                                |
| Thin list rows: thumbnail, name, grade, result, date                  | `ClimbRow` / `SessionRow`                                  |
| Subtle speckled "gym floor" background texture                        | Light chalk-fleck texture at ~4% opacity                   |
| Colour-coded grade pills                                              | `GradePill`                                                |

---

## 2. Design Tokens (light theme)

Single source of truth. Components must never hard-code colours, sizes or radii; they read from these tokens. Dark mode can be added later by supplying a second token set.

```ts
// theme/tokens.ts
export const colors = {
  // Surfaces
  bg: "#F5F2EC", // warm off-white, like chalk/limestone
  bgTexture: "#E9E4DA", // fleck colour for the background texture
  card: "#FFFFFF",
  cardMuted: "#F0ECE4", // inset tiles, input backgrounds
  border: "rgba(28, 27, 34, 0.08)",

  // Text
  text: "#1C1B22",
  textMuted: "#6B6877",
  textOnAccent: "#FFFFFF",

  // Brand accent (purple)
  accent: "#6A52D1",
  accentPressed: "#5440B5",
  accentSoft: "#ECE8FB", // chips, active tab pill, selected states
  accentText: "#5440B5", // accent-coloured text on soft backgrounds

  // Result colours (fills are for charts/badges; always paired with a text label)
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

  // Feedback
  danger: "#C0392B",
  dangerSoft: "#FBE3E6",
  dangerText: "#9B2C3A",
  success: "#2E8B4F",

  // Overlay / glass
  glass: "rgba(255, 255, 255, 0.78)", // tab bar, sheets (with blur)
  scrim: "rgba(28, 27, 34, 0.40)",
};

export const radius = { sm: 10, md: 16, lg: 22, xl: 28, pill: 999 };

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 }; // 4pt grid

export const shadow = {
  // Light mode uses soft shadows instead of the dark theme's glow/borders.
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
  // Display font: a wide geometric sans. Closest free matches: Sora, Plus Jakarta Sans, Outfit.
  // Body font: Inter (or the system font).
  display: {
    fontFamily: "Sora_600SemiBold",
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -0.5,
  },
  title: { fontFamily: "Sora_600SemiBold", fontSize: 22, lineHeight: 28 },
  stat: { fontFamily: "Sora_600SemiBold", fontSize: 34, lineHeight: 38 },
  heading: { fontFamily: "Inter_600SemiBold", fontSize: 17, lineHeight: 22 },
  body: { fontFamily: "Inter_400Regular", fontSize: 15, lineHeight: 22 },
  label: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  }, // "FINISHED ROUTES", section titles
  caption: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 16 },
};

export const motion = { fast: 120, base: 200, slow: 320 }; // ms
```

### Contrast check (WCAG, computed)

| Pair                           | Ratio     | Result    |
| ------------------------------ | --------- | --------- |
| `text` on `bg`                 | 15.3      | Pass      |
| `text` on `card`               | 17.1      | Pass      |
| `textMuted` on `card` / `bg`   | 5.4 / 4.9 | Pass (AA) |
| `textOnAccent` on `accent`     | 5.6       | Pass      |
| `accentText` on `accentSoft`   | 6.3       | Pass      |
| `flashText` on `flashSoft`     | 5.5       | Pass      |
| `attemptText` on `attemptSoft` | 5.4       | Pass      |
| `failText` on `failSoft`       | 7.1       | Pass      |
| `dangerText` on `dangerSoft`   | 6.1       | Pass      |

Rule: text uses the `*Text` colours, never the fill colours. The fill colours (`flash`, `attempt`, `fail`) are for chart segments and dots only, and are always accompanied by a text label or legend so meaning never depends on colour alone.

### Grade pill colours

Group grades into bands so the pill colour tells difficulty at a glance. Use the soft background with a dark text colour of the same hue.

| Band         | Example grades | Pill            |
| ------------ | -------------- | --------------- |
| Beginner     | V0–V2          | blue-grey soft  |
| Intermediate | V3–V5          | green soft      |
| Advanced     | V6–V8          | amber/rose soft |
| Expert       | V9+            | purple soft     |

Mapping lives in one function, `gradeBand(gradeIndex)`, because the grade is stored as a numeric index (spec Section 5.1). That way the colour is correct whichever grade system (V-scale or Font) the user displays.

---

## 3. Layout Rules (apply to every screen)

- **Screen padding:** 20 px sides. Sections spaced 24 px apart; items inside a section 12 px apart.
- **Safe areas:** respect top and bottom insets. Scrollable content gets bottom padding equal to the tab bar height + 24 px so nothing hides behind the floating bar.
- **Cards:** `card` background, `radius.lg`, `shadow.card`, 16 px inner padding. No heavy borders; use the hairline `border` only where a card sits on another card.
- **Section titles:** `label` style (small, uppercase, `textMuted`), 12 px above content.
- **Touch targets:** minimum 44 × 44. Primary buttons are 52 px high and full width.
- **One accent per screen:** exactly one primary (filled purple) button on a screen. Everything else is secondary (soft purple background) or text-only.
- **Gym-friendly:** big tap targets and high contrast, because people use this with chalky hands in bright light.
- **Background texture:** a repeating fleck image (`bgTexture` on `bg`) at ~4% opacity behind scroll content only, not behind cards or text blocks. If it hurts performance, drop it; the design works without it.

---

## 4. Shared Components

Build these once in `components/ui/`, then every screen is assembled from them. This is what makes the pattern consistent across all pages.

| Component                 | Props                                           | Notes                                                                                          |
| ------------------------- | ----------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `Screen`                  | `title?`, `subtitle?`, `scroll`, `headerRight?` | Applies bg, texture, padding, safe areas and the display-font header                           |
| `Card`                    | `variant: default \| muted \| hero`, `onPress?` | `hero` uses `accentSoft` gradient to `card`                                                    |
| `StatTile`                | `value`, `label`, `trend?`                      | Value in `stat` font, label in `label` style                                                   |
| `TrendTile`               | `label`, `value`, `delta`, `spark[]`            | Mini sparkline; delta coloured `flashText` or `dangerText`                                     |
| `PrimaryButton`           | `label`, `icon?`, `loading?`                    | Filled `accent`, white text, `radius.md`                                                       |
| `SecondaryButton`         | `label`                                         | `accentSoft` fill, `accentText` text                                                           |
| `GradePill`               | `gradeIndex`                                    | Band colour; reads user's grade system                                                         |
| `ResultChip`              | `result: flash \| top \| attempt \| fail`       | Soft fill + text label + small dot                                                             |
| `ProblemCard`             | `problem`, `size: lg \| row`                    | Photo, grade pill, name, wall; `lg` for carousels, `row` for lists                             |
| `ClimbRow` / `SessionRow` | data                                            | Thumbnail, name, grade, `ResultChip`, date                                                     |
| `ResultDonut`             | `segments[]`, `centerValue`, `centerLabel`      | SVG ring with rounded caps, legend on the right                                                |
| `FloatingTabBar`          | tabs                                            | Glass background with blur, `radius.pill`, active tab gets `accentSoft` pill with icon + label |
| `BottomSheet`             | children                                        | `radius.xl` top corners, glass or `card` background, drag handle                               |
| `Chip` / `FilterChip`     | `selected`                                      | Selected = `accentSoft` + `accentText`; unselected = `cardMuted`                               |
| `SyncChip`                | `state`                                         | The offline-first status chip from the spec (Synced / Syncing / N waiting / Offline)           |
| `EmptyState`              | `icon`, `title`, `body`, `cta?`                 | Friendly illustration area + one action                                                        |
| `SectionHeader`           | `title`, `action?`                              | `label` style with an optional "See all" link                                                  |

### Component details worth getting right

- **FloatingTabBar:** sits 12 px above the bottom inset, 16 px from the sides, height ~64. Uses `glass` with a backdrop blur (expo-blur) and `shadow.floating`. The active item gets an `accentSoft` rounded pill behind icon and label; inactive items show icon + label in `textMuted`.
- **ResultDonut:** 4 segments (flash, top, attempt, fail) with small gaps between them and rounded caps. The centre shows the average grade in `stat` font with a caption underneath. The legend uses dots plus text labels.
- **HeroCard:** `accentSoft` to `card` vertical gradient, a small `label` ("Today's session"), a title in `title` font, meta chips (e.g. gym, duration), then the single `PrimaryButton`.

---

## 5. Screen-by-Screen Application

How each screen in `MVP_SPEC.md` uses the shared components. Following this table means every page picks up the pattern automatically.

### Auth & onboarding

| Screen           | Treatment                                                                                                                                                                                     |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Splash           | `bg` with the logo in `accent`; no texture                                                                                                                                                    |
| Welcome          | Large display-font tagline, a hero illustration or photo with `radius.xl`, one `PrimaryButton` ("Get started"), social buttons as `SecondaryButton`s, "Try without an account" as a text link |
| Sign Up / Log In | `Screen` with a form inside a `Card`; inputs use `cardMuted` fill, `radius.md`; one `PrimaryButton`                                                                                           |
| Onboarding steps | Progress dots at top (`accent` active), selectable option `Card`s (selected state = `accentSoft` + accent border), `PrimaryButton` to continue                                                |

### Home

`Screen` with greeting header and grade chip, then `StatTile` × 3 (sessions, sends, flashes), `HeroCard` (Start or Resume Session), then a `SectionHeader` "Projects" with a horizontal `ProblemCard` carousel, then recent `SessionRow`s.

### Explore

| Screen                | Treatment                                                                                                                                                            |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Gym List              | Search field (`cardMuted`), `FilterChip`s, list of `Card`s with gym name and a "Ready offline ✓" chip                                                                |
| Gym Detail            | Header image or colour block, `StatTile`s for problem counts, `FilterChip`s for walls, `ProblemCard` rows, `PrimaryButton` "Start session here" pinned at the bottom |
| Problem List          | `FilterChip` row (grade, colour, status), list of `ProblemCard size="row"`                                                                                           |
| Problem Detail        | Large photo with `radius.xl`, `GradePill`, tag `Chip`s, "Your history" `Card` with `ResultChip`s, `PrimaryButton` "Log climb", `SecondaryButton` "Save as project"   |
| Add Gym / Add Problem | Form `Card`s, `ColourPicker` as round swatches, photo picker tile, one `PrimaryButton`                                                                               |

### Session flow

| Screen          | Treatment                                                                                                                                                          |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Select Gym      | `Card` list with the home gym pre-selected (`accentSoft` border)                                                                                                   |
| Active Session  | Sticky header with timer in `stat` font and `SyncChip`; running tally as 3 `StatTile`s; `ClimbRow` list; floating "+ Log climb" `PrimaryButton` above the tab area |
| Log Climb sheet | `BottomSheet`; `ResultChip` selector as 4 large tappable tiles; `GradePicker` as a horizontal chip scroller; attempts stepper; `PrimaryButton` "Save"              |
| End Session     | Centred dialog `Card`; effort selector as 5 round buttons                                                                                                          |
| Session Summary | `HeroCard`-style summary with duration, `StatTile`s, a mini `ResultDonut`, PB highlights as `accentSoft` banners                                                   |

### Progress

Mirrors the reference screen: period `FilterChip`s, `ResultDonut` with average grade, a row of `TrendTile`s (weekly volume, flash rate, hardest send), then recent `SessionRow`s. Tapping a tile opens Stat Detail with the same card style and a larger chart.

### Profile & Settings

Profile: avatar, name, `StatTile`s for lifetime stats, list `Card`s for Projects and Settings. Settings: grouped list `Card`s with rows (label left, value or toggle right); destructive actions in `dangerText` on `dangerSoft`; Sync settings use the `SyncChip`.

### States on every screen

- **Loading:** skeleton blocks in `cardMuted` (reads from the local DB, so this should be near-instant).
- **Empty:** `EmptyState` with one clear action.
- **Offline / waiting to sync:** `SyncChip` in the header, never a blocking error.
- **Error:** inline message `Card` in `dangerSoft`, with a retry button when relevant.

---

## 6. Differences Between the Reference and the MVP Spec

Decide these before building; they affect the data model and the navigation.

| Reference design                                                                    | MVP spec                                                      | Recommendation                                                                                                                                                                        |
| ----------------------------------------------------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tabs: Home, Routes, Progress, Settings                                              | Tabs: Home, Explore, centre Session button, Progress, Profile | Keep the reference's clean 4-tab look, but add the centre "Start session" action. Putting Settings inside Profile frees a tab. Final: **Home, Explore, ＋Session, Progress, Profile** |
| "Routes"                                                                            | "Problems"                                                    | Bouldering climbers say "problems", but many apps say "routes". Pick one and use it everywhere (screens, code, database)                                                              |
| Results: Flash, Top, Attempt, Fail                                                  | Flash, Send, Attempt                                          | Adopt **Flash / Top / Attempt**. "Fail" overlaps with "Attempt", so drop it for the MVP, or define it clearly (e.g. gave up mid-climb)                                                |
| "Today's session" with a suggested plan (V5–V7A, Overhang, Power Endurance, 75 min) | Start Session card only                                       | The hero card stays, but it launches a normal session. Generated session plans are post-MVP                                                                                           |
| "Recommended routes"                                                                | Projects strip                                                | Show the user's projects and unclimbed problems at their home gym. No recommendation engine in the MVP                                                                                |
| "Overhang strength +8%" trend                                                       | Not in the spec                                               | Feasible offline if problems carry style tags: compute the average sent grade on tagged problems over time. Treat as a stretch goal                                                   |
| Notification bell + badge                                                           | Only a session reminder toggle                                | Drop the bell for the MVP                                                                                                                                                             |
| Profile avatar dropdown on Home                                                     | Profile tab                                                   | Show the avatar only; tapping goes to the Profile tab                                                                                                                                 |

---

## 7. Implementation Steps

Do this in order. The first two steps make every later screen cheaper.

1. **Install the foundations.** Fonts (`@expo-google-fonts/sora`, `@expo-google-fonts/inter`), `expo-blur`, `react-native-svg`, `expo-linear-gradient`, an icon set (lucide-react-native or Phosphor).
2. **Create `theme/tokens.ts`** (Section 2) and a `useTheme()` hook that returns the tokens. Everything below reads from it.
3. **Build the primitives** in `components/ui/`: `Screen`, `Card`, `PrimaryButton`, `SecondaryButton`, `GradePill`, `ResultChip`, `Chip`, `StatTile`, `SectionHeader`, `EmptyState`.
4. **Build `FloatingTabBar`** and wire it into the router as the custom tab bar. This single change makes the whole app feel like the reference.
5. **Rebuild Home and Progress first.** They match the reference screens, so they validate the system. Add `ResultDonut`, `TrendTile`, `HeroCard`.
6. **Migrate the remaining screens** in the order of the spec's build plan (session flow, then gyms and problems, then profile and settings). Replace ad-hoc styles with the shared components.
7. **Add a component gallery screen** (dev only) that renders every component and state. It's the easiest way to catch inconsistencies and is a nice portfolio artifact.
8. **Audit.** Grep for hard-coded hex values and magic numbers; there should be none outside `tokens.ts`. Test on a small phone, a large phone and with large system text.
9. **Dark mode (later).** Add a second token set (taken from the reference screens) and switch via `useColorScheme()`. Because components read tokens, no screen changes are needed.

---

## 8. Prompt for Your Coding Agent

Attach the two reference screenshots, then paste:

```
Read docs/DESIGN_SYSTEM.md and docs/MVP_SPEC.md. The attached screenshots show
the visual pattern I want, but in LIGHT mode (tokens in DESIGN_SYSTEM.md
Section 2). Don't copy the dark colours.

Step 1 (do now, then stop for review):
- Create theme/tokens.ts exactly as specified and a useTheme() hook.
- Build the shared components in Section 4: Screen, Card, PrimaryButton,
  SecondaryButton, GradePill, ResultChip, Chip, StatTile, SectionHeader,
  EmptyState, FloatingTabBar.
- Add a dev-only component gallery screen showing every component.
- No screen may use hard-coded colours, font sizes, radii or spacing;
  everything comes from tokens.

Step 2 (after I approve step 1):
- Rebuild Home and Progress to match the reference layout, using the
  components above plus ResultDonut, TrendTile and HeroCard.
- Follow the differences table in Section 6: tab set, "Flash/Top/Attempt"
  result names, and no notification bell.

Step 3 (one screen group at a time, after approval):
- Migrate the other screens following the Section 5 table.

Rules: keep the app running after each step, keep all data reads and writes
going through the local database (offline-first, per the spec), and tell me
whenever you deviate from the design system.
```
