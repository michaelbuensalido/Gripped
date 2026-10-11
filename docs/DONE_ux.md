# Definition of Done: UI/UX Consistency and Accessibility

This checklist defines the acceptance criteria and verification status for UI/UX consistency, accessibility, responsiveness, and Settings completeness in CruxLog.

---

## 1. Designed Loading, Empty, and Error States
- [x] **1.1** **Home Screen (`app/index.tsx`)**: Has dynamic active session header, designed empty states for projects carousel ("Add a project") and recent sessions list ("No sessions logged yet" with "+ START FIRST SESSION" CTA), and error resilience.
- [x] **1.2** **Active Session (`app/session/active.tsx`)**: Has designed EmptyState when no session is active with back button and "+ START SESSION" CTA, and clean EmptyState when session has 0 climbs ("Ready to send? Tap + LOG CLIMB").
- [x] **1.3** **Projects Screen (`app/projects.tsx`)**: Has designed empty states for each tab (Active, Sent, Archived) and for filtered queries with "Clear filters" action.
- [x] **1.4** **Project Detail (`app/project/[id].tsx`)**: Has designed EmptyState when project is not found or fails to load, with "BACK TO PROJECTS" CTA.
- [x] **1.5** **Analytics / Progress Screen (`app/analytics.tsx`)**: Has designed EmptyState when insufficient climb data exists, with "+ START A SESSION" CTA, plus menu link to settings.
- [x] **1.6** **Logbook / History Screen (`app/explore.tsx`)**: Has designed EmptyState when no gyms match filter or none exist yet, with "+ Add gym" CTA.
- [x] **1.7** **Media Gallery (`app/gallery.tsx`)**: Design system showcase for buttons, chips, grade pills, cards, stat tiles, and empty states.
- [x] **1.8** **Session Detail & Summary (`app/session/detail/[id].tsx`, `app/session/summary.tsx`)**: Has designed EmptyState when session is not found, and designed EmptyState when a session has 0 climbs.

---

## 2. Accessibility & WCAG AA Compliance
- [x] **2.1** **Accessibility Labels & Roles**: Every interactive element (`ScalePressable`, `PrimaryButton`, `SecondaryButton`, `Chip`, `GradePill`, `ResultChip`, `ResultToggle`, `ProjectCard`, `ClimbRow`) has descriptive `accessibilityRole` and `accessibilityLabel` (and `accessibilityState` where applicable).
- [x] **2.2** **Touch Target Size**: All interactive elements have touch targets of at least 44pt x 44pt (heights 48–56pt or hitSlop).
- [x] **2.3** **WCAG AA Contrast**: Text colors (`colors.text`, `colors.textMuted`, `colors.accentText`, `colors.flashText`, `colors.dangerText`) meet and exceed WCAG AA contrast ratio (≥ 4.5:1 for normal text, ≥ 3:1 for large text and key UI icons) against dark backgrounds (`colors.bg`, `colors.card`, `colors.cardMuted`).
- [x] **2.4** **Multi-Modal Signaling (Color is Never the Only Signal)**:
  - Flash: Flash green color (#6EE756) PLUS ⚡ bolt icon and visible "Flash" label.
  - Send / Top: Accent violet / cyan PLUS checkmark icon and visible "Top" label.
  - Attempt: Amber / muted color PLUS circle/arrow icon and visible "Attempt" label.
  - Implemented in `ResultChip.tsx`, `ResultToggle.tsx`, and `ClimbRow.tsx`.

---

## 3. Dynamic Text, Small/Large Phone Layouts & Forms
- [x] **3.1** **Dynamic Type Resilience**: Text does not clip or overflow ungracefully; containers use flex or ScrollView; titles and labels use `adjustsFontSizeToFit` or `numberOfLines`.
- [x] **3.2** **Small Device Support (iPhone SE 375x667)**: All primary screens wrap content in `ScrollView` containers with proper bottom insets to prevent bottom clipping or unreachable action buttons.
- [x] **3.3** **Safe Area Insets**: All screens, navigation bars, bottom sheets, and modals respect `useSafeAreaInsets()` (top notch, bottom home indicator, and horizontal padding).
- [x] **3.4** **Keyboard Avoidance**: Forms, sheets, and text inputs (`LogSheet`, `CreateProjectModal`, `SettingsScreen`, `app/session/end.tsx`, `SessionCompletionModal`) wrap inputs in `KeyboardAvoidingView` with proper offsets to prevent input occlusion.

---

## 4. Haptics & Motion Settings
- [x] **4.1** **Haptics Consistency & Master Switch**:
  - Haptic feedback across the entire app uses `triggerHaptic()`.
  - Haptic toggle in Settings is persisted (`AsyncStorage`) and strictly honored; disabling haptics mutes all vibrations immediately.
- [x] **4.2** **Reduce Motion Respect**:
  - Motion transitions and spring/timing animations check system reduce-motion preferences (`useReducedMotion()`) in `ScalePressable`, `UndoToast`, `EmptyState`, `StartSessionSheet`, `LogSheet`, and `ClimbRow` shimmer, gracefully skipping animations when enabled.
  - Animation durations remain snappy (< 300ms) with ease-out curves.

---

## 5. Design System Tokens & Shared Components
- [x] **5.1** **Tokens Only**: No hardcoded arbitrary colors (hex/rgb), font sizes, border radii, or margins/paddings. All styles reference `tokens.ts` or `useTheme()`. Cleaned up `Pill.tsx`, `EmptyStateCard.tsx`, `GradePill.tsx`.
- [x] **5.2** **Shared Component Usage**: Common UI elements use `components/ui/` (`ScalePressable`, `PrimaryButton`, `SecondaryButton`, `Card`, `Chip`, `GradePill`, `EmptyState`, `SectionHeader`, etc.).
- [x] **5.3** **Visual Cohesion**: Consistent dark glassmorphism aesthetic with Violet `#8E7CFF` and Flash Green `#6EE756`.

---

## 6. Complete Settings Screen
- [x] **6.1** **Haptics Setting**: Toggle for vibration cues during logging, persisted to AsyncStorage, mutes all app haptics when toggled off.
- [x] **6.2** **Rest Timer Default**: Configurable default rest time (10–600 seconds) with quick preset chips (60s, 90s, 120s, 180s) and custom numeric input, persisted to `@cruxlog/rest_timer_seconds`.
- [x] **6.3** **Grade System Preference**: Choice between V-Scale (Hueco, V0–V16) and Font scale (Fontainebleau, 4–8C+), persisted via `utils/preferences.ts`, dynamically updating `GradePill` and grading displays.
- [x] **6.4** **Units Preference**: Metric (kg, cm, m) vs Imperial (lbs, in, ft) selector, persisted in preferences via `utils/preferences.ts`.
- [x] **6.5** **Export Data**: Full SQLite database export to JSON with standard sharing (`Sharing.shareAsync` or filesystem save).
- [x] **6.6** **Import Data**: JSON backup restore modal with local export file detection or paste JSON backup string, format validation, confirmation dialog, and atomic SQLite restore via `importDataFromJSON`.
- [x] **6.7** **Storage Usage**: Live calculation of SQLite database size and cached media storage in KB/MB with refresh capability.
- [x] **6.8** **Clear Data**: Destructive wipe of all sessions, climbs, and projects with explicit confirmation dialog and haptic cue via `clearAllData()`.
- [x] **6.9** **About Section**: App version (v1.0.0, Build 42), offline-first SQLite architecture description, and zero-telemetry guarantee.
- [x] **6.10** **Privacy Policy**: Dedicated accessible navigation row pointing to `/privacy-policy`.
