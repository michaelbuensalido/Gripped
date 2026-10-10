# CruxLog UI/UX Audit & Redesign Plan

Based on the **Emil Kowalski UI Polish & Motion (`emil-design-eng`)** and **Frontend Design Taste (`design-taste-frontend`)** skills, translated for React Native, Reanimated, Pressable feedback, and `expo-haptics`.

---

## 1. Audit Findings Table

| Issue / Before | File | Principle Violated | Fix / After |
| :--- | :--- | :--- | :--- |
| **Tokens Lack Unified Easings & Durations**: Tokens define `slow: 320ms` and `celebrate: 900ms` without standard Reanimated ease-out curves or consistent `<300ms` UI duration scale. Accent color is `#9A85FF` instead of `#8E7CFF` and flash color `#72FF9B` instead of `#6EE756`. | `theme/tokens.ts` | **Duration (<300ms), Design Consistency, Easing Curves** | Normalize UI durations to `fast: 120ms`, `base: 200ms`, `slow: 280ms`. Add Reanimated cubic ease-out curves (`Easing.bezier(0.23, 1, 0.32, 1)`) and standard spring configs (`damping: 15, stiffness: 300`). Enforce Violet `#8E7CFF` and Flash Green `#6EE756`. |
| **Raw `TouchableOpacity` with Opacity Glitch**: `SecondaryButton` uses raw `TouchableOpacity` with `activeOpacity={0.75}` and no scale or physics feedback. | `components/ui/SecondaryButton.tsx` | **Micro-interactions & Physics Feedback** | Replace with shared `ScalePressable` / AnimatedPressable that scales to `0.97` on press-in with light/medium haptics and respects `reduceMotion`. Ensure minHeight 44pt (currently 56pt). |
| **Chips Lack Tactile Press Physics**: `Chip` uses raw `TouchableOpacity` with `activeOpacity={0.7}`, lacking Reanimated spring scaling and unified touch targets. | `components/ui/Chip.tsx` | **Tangible Feedback & Touch Targets** | Wrap in `ScalePressable` with subtle `scale: 0.96`, provide 44pt minimum touch hitSlop, and crisp haptic feedback. |
| **Legacy Animated API & No Haptics in Card**: `Card` uses React Native's legacy `Animated` with arbitrary speed/bounciness instead of Reanimated and misses haptic feedback on press. | `components/ui/Card.tsx` | **Unified Animation Stack & Tactile Feel** | Migrate to `ScalePressable` or Reanimated `useAnimatedStyle` with `motion.pressSpring`, adding `triggerHaptic('light')`. |
| **ClimbRow Row Tap Uses Opacity Only**: `ClimbRow` uses `TouchableOpacity` with `activeOpacity={0.7}`. Also, `entering={FadeInDown.duration(400)}` violates the `<300ms` animation rule. | `components/ui/ClimbRow.tsx` | **Duration (<300ms) & Interactive Polish** | Wrap the main row card in `ScalePressable` (subtle `0.98` scale). Reduce entry animation duration to `220ms` ease-out. |
| **ProjectCard Inconsistent Press & Actions**: Uses `TouchableOpacity` with `activeOpacity={0.7}` for the card and internal attempt button. | `components/ui/ProjectCard.tsx` | **Micro-interactions & Consistent Feedback** | Integrate `ScalePressable` for card and the "Attempt" button. Guarantee touch target `>= 44pt`. |
| **UndoToast Abrupt Entrance/Exit**: `UndoToast` conditionally mounts with `if (!visible) return null;` without entering or exiting transitions. | `components/ui/UndoToast.tsx` | **Enter from Scale(0.95)+TranslateY, Smooth Exits** | Animate entrance with Reanimated: translate from `+24px` and scale from `0.95` to `1` with `Easing.bezier(0.23, 1, 0.32, 1)`, and smooth fade out on dismiss. Respect `reduceMotion`. |
| **Modal & Sheet Native Transitions**: `LogSheet` and `StartSessionSheet` use React Native `Modal` with generic `animationType="slide"` and no backdrop fade or sheet physics. | `components/session/LogSheet.tsx`, `components/session/StartSessionSheet.tsx` | **Sheet Transitions, Backdrop Fade, Interruptibility** | Smooth backdrop opacity transition and sheet translateY slide-up with spring physics (`damping: 20, stiffness: 240`) under `<300ms`. |
| **Session Completion Modal Jarring Appearance**: `SessionCompletionModal` uses full-screen modal with stock slide and instant unmount. | `components/session/SessionCompletionModal.tsx` | **Seamless Transition & Celebration Polish** | Provide smooth backdrop fade, card entry scale `0.96 -> 1.0`, and refined confetti burst timing. |
| **Missing List States**: Empty state in Active Session climb stream is an ad-hoc inline card. Empty state in explore screen uses un-themed plain text. | `app/session/index.tsx`, `app/explore.tsx`, `components/ui/EmptyState.tsx` | **Comprehensive UI States (Empty/Loading/Error)** | Standardize on `components/ui/EmptyState` with customized iconography, typographic hierarchy, and actionable CTAs. |
| **Active Session Screen Raw Inline Buttons**: "Quick +1 Attempt", "Rest Timer", and options menu buttons use raw `TouchableOpacity` with inline styles. | `app/session/index.tsx` | **Design Consistency & Touch Physics** | Use `ScalePressable` for telemetry tiles, rest timer toggle, quick attempt button, and headers. Ensure all touch targets `>= 44pt`. |
| **Home Screen Custom Button Violations**: Home screen uses a raw `TouchableOpacity` for the hero "START SESSION" / "RESUME SESSION" button (lines 325-345) instead of `PrimaryButton`. | `app/index.tsx` | **Design System Token Adherence & Component Reuse** | Replace custom `TouchableOpacity` with `PrimaryButton` (which has built-in Reanimated scale, haptics, and pill shape). Ensure project carousel and stat tiles have scale press feedback. |
| **Project Detail Action Rhythm & Feedback**: Status chips, notes edit triggers, and log attempt buttons lack uniform feedback and smooth transitions. | `app/project/[id].tsx` | **Editorial Typographic Contrast & Motion Feedback** | Wrap all interactive cards and action pills in `ScalePressable`. Polish the Beta notes expandable container and grade pills. |
| **Analytics Period Filter Sheet & Chart States**: Analytics period selector modal lacks smooth ease-out entrance. Missing or rudimentary zero-data states for charts. | `app/analytics.tsx` | **Translucent Materials & Seamless Bottom Sheets** | Upgrade Period Sheet with fluid bottom-sheet entrance (`scale 0.96` or `translateY`), add `ScalePressable` to period tabs and metric tiles, and polish empty/loading states. |
| **Logbook Filter Header & Action Hierarchy**: Logbook filter chips and period dropdown lack tactile spring feedback. Calendar vs list toggle has abrupt layout shifts. | `app/profile.tsx` | **Layout Animation & Tactile Tabs** | Wrap filter chips, view mode segmented control, and summary stat tiles in `ScalePressable`. |
| **Explore Gym Search & Add Interaction**: Explore search input and "Add Gym" modal lack refined sheet transitions and active touch states. | `app/explore.tsx` | **Anti-slop Polish & Modal Fluidity** | Upgrade gym list items with `ScalePressable`, add smooth animated modal for "Add Gym", and improve empty search results display. |

---

## 2. Implementation Execution Plan

### Step 2: System Level
1. **`theme/tokens.ts`**:
   - Palette check: Primary Violet `#8E7CFF`, Flash Green `#6EE756`.
   - Motion tokens: `duration.fast` (120ms), `duration.base` (200ms), `duration.slow` (280ms).
   - Unified cubic-bezier easing constants: `Easing.bezier(0.23, 1, 0.32, 1)` (fluid ease-out) and `Easing.bezier(0.4, 0, 1, 1)` (exit).
   - Spring presets for scale-down (`damping: 18, stiffness: 350`) and sheet/layout (`damping: 20, stiffness: 240`).
2. **`components/ui/ScalePressable.tsx`**:
   - Universal Reanimated pressable component.
   - Applies subtle scale down (`0.97` or configurable `0.96 - 0.98`), triggers `triggerHaptic(hapticStyle)` on press, and honors `useReducedMotion()`.
   - Integrate into `PrimaryButton`, `SecondaryButton`, `Chip`, `Card`, `ClimbRow`, `ProjectCard`.
3. **Motion Rules**:
   - Enforce duration `< 300ms` across all transitions.
   - Ease-out entrances starting from `scale(0.95)` or `translateY(16)`.
   - Wrap with `useReducedMotion()` fallback everywhere.
4. **Sheet & Toast Transitions**:
   - Refactor `UndoToast` with Reanimated translateY + scale enter/exit.
   - Refactor `LogSheet`, `StartSessionSheet`, and `SessionCompletionModal` with backdrop fade + spring sheet slide.
5. **Empty, Loading & Error States**:
   - Enhance `components/ui/EmptyState.tsx` to handle bento glass cards, actions, and crisp typography.

### Step 3: Screens (In Exact Order)
1. **Active Session** (`app/session/index.tsx`)
2. **LogSheet** (`components/session/LogSheet.tsx`)
3. **Home** (`app/index.tsx`)
4. **Project Detail** (`app/project/[id].tsx`)
5. **Analytics** (`app/analytics.tsx`)
6. **Logbook** (`app/profile.tsx`)
7. **Explore** (`app/explore.tsx`)
