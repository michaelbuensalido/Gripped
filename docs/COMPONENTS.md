# CruxLog — Components (v3.0)

The full component register (with the duplicate-component table) lives in `DESIGN_SYSTEM.md` Section 7. This file lists what the **v3.0 premium depth** pass added or changed. Reuse before creating.

## New

| Component / module | Where | Purpose |
| --- | --- | --- |
| `GlowBackdrop` | `components/ui/GlowBackdrop.tsx` | Radial glow (`colors.glow`) as the first child of an achievement element: the Home "New best" banner and the streak pill in `WeekStrip`. Props: `spread` (px the glow bleeds past the parent, default `space.xl`). Non-interactive, hidden from screen readers. |
| `listLayout` | `theme/layout.ts` | Shared spring `LinearTransition` built from `motion.layoutSpring`. Use as `layout={listLayout}` on a Reanimated view, or `itemLayoutAnimation` on `Animated.FlatList` (single column only). |

## Changed

| Component | Change |
| --- | --- |
| `Card` | 3D bevel: `borderTopColor: bevelHighlight`, `borderBottomColor: bevelShadow`, sides `border`, plus `shadow.card`. `variant="muted"` keeps the bevel but drops the shadow (inset). |
| `FloatingTabBar` | Frosted glass: `BlurView` (`tint="dark"`, `intensity={80}`) on a separate layer with a `glassBorder` hairline; Android uses the `glass` token. Container stays `overflow: visible`. |
| `PrimaryButton` | Reanimated spring scale on press (`motion.pressSpring`), no opacity fade; skipped under reduce-motion. |
| `StatTile` | Label now uses the `label` token untouched (0.2em tracking). |
| `ClimbRow` | Always wrapped in a Reanimated view with `layout={listLayout}`; entry animation still opt-in via `animateEntry`. |
| `Screen` and all screens/sheets with scrolling | `ScrollView` is now `Animated.ScrollView` (Reanimated). Home's scroll-linked status-bar scrim runs on the UI thread. |
| `WeekStrip` | Streak pill sits on a `GlowBackdrop`. |
| Analytics charts | `label` style comes from the token (no per-chart `letterSpacing` or `fontSize`). |

## Tokens added (`theme/tokens.ts`, mirrored in `tokens.light.ts`)

`colors.bevelHighlight`, `colors.bevelShadow`, `colors.glassBorder`, `colors.glow`, `shadow.card` (now a real shadow), `motion.layoutSpring`, `motion.pressSpring`; `type.label` is 11px with 2.2 (0.2em) tracking; every `type.*` style has `fontVariant: ['tabular-nums']`.

## Known gaps

- `SectionList` (Logbook) has no Reanimated version, so it keeps React Native's and has no item layout animation.
- `Animated.FlatList` ignores `itemLayoutAnimation` when `numColumns > 1` (the unused `GradeSheet` grid).
- `HeroCard` uses `overflow: 'hidden'`, which clips the iOS card shadow on that card.
