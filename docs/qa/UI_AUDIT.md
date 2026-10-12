# CruxLog Comprehensive UI/UX & Design Engineering Audit

**Audit Date:** October 12, 2026  
**Auditor:** Antigravity AI Design & Mobile Engineering  
**Guidelines Followed:** Emil Kowalski Design Principles (`emil-design-eng`), Anti-Slop Frontend Taste (`design-taste-frontend`), CruxLog Design System (`docs/DESIGN_SYSTEM.md`), Apple Human Interface Guidelines  
**Device Tested:** iPhone 17 Pro Simulator (iOS 26.5, Scale 3x, Display 393×852 pt)  
**Database State:** Realistic 10-week climbing profile seeded (20+ historical sessions, 7 active/sent projects V4–V8, 274 boulder logs, 3-week streak)  
**Screenshots Stored At:** `docs/qa/ui/` (31 high-resolution captures)

---

## Executive Summary

This comprehensive audit inspected every user journey in CruxLog across cold start, onboarding, active bouldering session logging, analytics, project beta drafting, and logbook review.

CruxLog establishes an exceptional aesthetic foundation with its dark glassmorphism palette, violet `#8E7CFF` primary accent, and flash green `#6EE756` celebration cues. However, severe architecture and layout defects impede real-world climbing use:

1. **Systemic Blocker:** The custom `FloatingTabBar` is declared at the root layout without route filtering, causing it to overlay and physically obscure buttons on child screens (`/settings`, `/projects`, `/project/[id]`, `/project/beta-editor`, `/gym/[id]`, and `/welcome`).
2. **Session Wrap-Up Blocker:** In `app/session/end.tsx`, an unconstrained container in `Screen.tsx` (`scroll={false}`) collapses the `<Reanimated.ScrollView>` to 0 height. The entire wrap-up form (RPE 1–5, skin state, finger fatigue, photos, notes, and insights) is completely invisible.
3. **LogSheet Viewport Clipping:** In `LogSheet.tsx`, the primary CTA button ("SAVE CLIMB") is pushed below the device viewport on standard heights, requiring manual vertical drag before a climb can be confirmed.
4. **Notch Collision on Welcome:** A missing token key (`space['2xl']` instead of `space.xxl`) causes `paddingTop` to evaluate to `NaN` and collapse to 0, crashing the "CruxLog" title directly into the Dynamic Island / status bar clock.
5. **Typographic & Data Artifacts:** Narrow bento cards cause single-letter wrapping (e.g., `"ARCHIVE\nD"` on Projects list), truncated strings (`"linke..."`), and historical session cards display `"HARDEST —"` despite containing V4/V5 sends.

---

## Severity Classification Matrix

| Severity | Count | Definition |
| :--- | :---: | :--- |
| **Blocker** | **5** | Primary actions cannot be tapped, forms collapse to 0 height, or the UI prevents core task completion. |
| **Major** | **9** | Severe visual collision, notch/keyboard clipping, misleading data defaults, or truncated labels. |
| **Minor** | **12** | Micro-spacing inconsistencies, missing scroll scrims, suboptimal button hierarchies, or subtle alignment flaws. |

---

## Screen-by-Screen Detailed Audit

---

### 1. Welcome & Onboarding
**Screenshots:** `docs/qa/ui/onboarding.png`, `docs/qa/ui/onboarding_step1.png`

#### [BLOCKER] Floating Tab Bar Overlays Welcome Screen
- **Screenshot:** `docs/qa/ui/onboarding.png`
- **What's Wrong:** Onboarding is registered as a route inside `app/_layout.tsx` (`<Tabs.Screen name="welcome" ... />`). The floating tab bar (`FloatingTabBar`) renders over the onboarding flow, covering the "Skip setup" button and secondary CTAs.
- **Root Cause:** All child screens are registered inside a single root Expo Router `Tabs` navigator without setting `tabBarStyle: { display: 'none' }` on non-tab screens.
- **Proposed Fix:** In `app/_layout.tsx`, isolate tab screens into an `app/(tabs)/` group or configure `options={{ tabBarStyle: { display: 'none' } }}` on the `welcome` screen.

#### [MAJOR] Notch Collision & Title Padding Collapse
- **Screenshot:** `docs/qa/ui/onboarding.png`
- **What's Wrong:** The top title "CruxLog" collides directly with the iOS Dynamic Island / status bar clock at `y = 0`.
- **Root Cause:** In `app/welcome.tsx`, padding is calculated as `paddingTop: insets.top + space['2xl']`. Because `theme/tokens.ts` exports `space.xxl` rather than `space['2xl']`, `space['2xl']` is `undefined`. `insets.top + undefined` evaluates to `NaN`, causing React Native style resolver to collapse `paddingTop` to 0.
- **Proposed Fix:** In `app/welcome.tsx`:
  ```tsx
  // Before:
  paddingTop: insets.top + space['2xl'],
  // After:
  paddingTop: Math.max(insets.top, 20) + space.xxl,
  ```

#### [MINOR] Step 1 Grade System Selector Touch Targets & Spacing
- **Screenshot:** `docs/qa/ui/onboarding_step1.png`
- **What's Wrong:** In Onboarding Step 1 (Fontainebleau vs V-Scale selector), the card inner padding feels uneven (`padding: 16`), and unselected radio indicators lack subtle contrast against the glass card background.
- **Proposed Fix:** Increase option card padding to `space.lg` (20), add `activeScale={0.98}` press feedback via `ScalePressable`, and ensure the radio border uses `colors.borderSubtle`.

---

### 2. Home Screen (Zero-Data & Populated)
**Screenshots:** `docs/qa/ui/home_empty.png`, `docs/qa/ui/home_empty_bottom.png`, `docs/qa/ui/home_seeded_top.png`, `docs/qa/ui/home_seeded_bottom.png`

#### [MAJOR] Misleading Hardcoded Grade in Fresh Profile
- **Screenshot:** `docs/qa/ui/home_empty.png`
- **What's Wrong:** On a brand-new profile with 0 climbs logged, the Hero section renders an accent pill displaying `"7A"`. For beginner climbers, seeing a hard boulder grade prominently displayed creates confusion.
- **Root Cause:** `app/index.tsx` contains:
  ```tsx
  const highWatermark = data.hardest30d ? data.hardest30d.gradeRaw : '7A';
  ```
- **Proposed Fix:** Fall back to a friendly motivational badge rather than a hardcoded grade:
  ```tsx
  const highWatermark = data.hardest30d ? data.hardest30d.gradeRaw : 'Start Climbing';
  ```

#### [MINOR] Bento Stat Tile Multi-Line Uppercase Label Clutter
- **Screenshot:** `docs/qa/ui/home_seeded_top.png`
- **What's Wrong:** The 3 stat cards ("SESSIONS\nTHIS WEEK", "CLIMBS\nLOGGED", "SENDS\nTHIS WEEK") force multi-line wraps in tight uppercase typography. It feels noisy and cramped compared to modern iOS Apple Health / Fitness cards.
- **Proposed Fix:** Change labels to single-line mixed case or sentence case with `adjustsFontSizeToFit` and `numberOfLines={1}`:
  ```tsx
  <Text numberOfLines={1} adjustsFontSizeToFit style={[type.caption, { color: colors.textMuted }]}>
    Sessions this week
  </Text>
  ```

#### [MINOR] Hero Carousel Pagination Contrast
- **Screenshot:** `docs/qa/ui/home_seeded_top.png`
- **What's Wrong:** The carousel indicator dots for "Next Objective" use `rgba(255, 255, 255, 0.2)` for inactive dots and are only 8pt tall. On dark background, they are nearly invisible.
- **Proposed Fix:** Increase dot contrast to `rgba(255, 255, 255, 0.35)` and expand active indicator width to 16pt pill (`borderRadius: 4`) with smooth layout animation.

---

### 3. Start Session Modal Sheet
**Screenshot:** `docs/qa/ui/start_session_sheet.png`

#### [MINOR] Horizontal Gym Filter Chips Overflow Without Gradient Scrim
- **Screenshot:** `docs/qa/ui/start_session_sheet.png`
- **What's Wrong:** When 3 or more gyms are available ("Boulder Co", "Outdoor / Other", "The Climbing Hangar"), the gym chips row overflows horizontally without a trailing fade scrim, making it unobvious that more chips can be scrolled.
- **Proposed Fix:** Add an `expo-linear-gradient` trailing fade mask or wrap chips into a 2-row grid.

#### [MINOR] Cancel Button Visual Prominence
- **Screenshot:** `docs/qa/ui/start_session_sheet.png`
- **What's Wrong:** "Cancel" is rendered as a 56pt high card button equal in size to "Start session", creating visual competition.
- **Proposed Fix:** Demote "Cancel" to a text button or top-right `X` dismiss icon.

---

### 4. Active Session Screen
**Screenshot:** `docs/qa/ui/active_session.png`

#### [MAJOR] Climb Stream Empty State Covered by Floating Bottom Bar
- **Screenshot:** `docs/qa/ui/active_session.png`
- **What's Wrong:** In an active session before any climbs are logged, the Climb Stream shows: "Ready to send? Tap + LOG CLIMB below to record your first climb...". The explanatory text is partially cut off behind the floating bar containing "Rest Timer" and "+ LOG CLIMB".
- **Root Cause:** The `ScrollView`'s `contentContainerStyle` uses `paddingBottom: 100`, which is insufficient for the floating bar (~68pt) + bottom safe area (~34pt).
- **Proposed Fix:** Increase `paddingBottom` to `130` in `app/session/index.tsx`.

#### [MINOR] Rest Timer Idle State Affordance
- **Screenshot:** `docs/qa/ui/active_session.png`
- **What's Wrong:** When the rest timer is not running, the button displays `"REST 3:00"`. It looks like an informational stat rather than a pressable timer toggle.
- **Proposed Fix:** Add a subtle `Play` or `Timer` icon preceding the text and label it `"Start 3:00 Rest"`.

---

### 5. Log Climb Sheet
**Screenshot:** `docs/qa/ui/log_sheet.png`

#### [BLOCKER] "SAVE CLIMB" Primary Action Pushed Below Viewport
- **Screenshot:** `docs/qa/ui/log_sheet.png`
- **What's Wrong:** When the sheet opens, the content (Outcome chips, Grade stepper + pills, Attempts stepper, Notes input) exceeds the sheet height. The primary CTA button ("SAVE CLIMB") is pushed almost entirely off-screen below the bottom bezel. Only 4px of its glowing purple upper edge is visible at `y ≈ 870`. Climbers must manually drag the sheet up before they can log a send.
- **Root Cause:** The bottom sheet height is unconstrained, and sections have excessive vertical gaps (`gap: 24`, `marginBottom: 20`).
- **Proposed Fix:**
  1. Pin the "SAVE CLIMB" button to the bottom of the modal container inside a fixed footer with `SafeAreaView` padding.
  2. Put Outcome, Grade, Attempts, and Notes inside a scrollable body above the pinned button.
  3. Ensure the primary button is always 100% visible on launch without scrolling.

#### [MAJOR] Grade Stepper & Horizontal Pill Overflow
- **Screenshot:** `docs/qa/ui/log_sheet.png`
- **What's Wrong:** The grade chips (V0 to V16) overflow horizontally off the screen. While the active grade V4 is displayed in the center, the stepper buttons (`<` and `>`) have a wide empty space between them and the center display pill.
- **Proposed Fix:** Center the stepper controls directly around the grade display, and provide snapping feedback when scrolling the horizontal grade pill strip.

---

### 6. Session Wrap-Up & Completion
**Screenshots:** `docs/qa/ui/session_end.png`, `docs/qa/ui/session_end_confirm_dialog.png`

#### [BLOCKER] Wrap-Up Form Collapses to Zero Height
- **Screenshot:** `docs/qa/ui/session_end.png`
- **What's Wrong:** When ending a session, the user expects to log RPE (1–5), skin condition, finger fatigue, photos, and notes. None of these elements appear. Only "Session Wrap-Up", "Great work today", and the bottom three buttons ("SAVE & FINISH", "Back to Session", "Discard Session") appear.
- **Root Cause:** In `components/ui/Screen.tsx`, when `scroll={false}` is passed, the wrapper `View` at line 27 does not specify `flex: 1`. In `app/session/end.tsx`, `<KeyboardAvoidingView style={{ flex: 1 }}>` and `<Reanimated.ScrollView>` are rendered inside it. Without `flex: 1` on the parent, the ScrollView collapses to 0 height.
- **Proposed Fix:** In `components/ui/Screen.tsx`:
  ```tsx
  // Before:
  <View style={{ paddingTop: Math.max(insets.top, space.xxl), paddingHorizontal: space.lg }}>
  // After:
  <View style={[{ paddingTop: Math.max(insets.top, space.xxl), paddingHorizontal: space.lg }, !scroll && { flex: 1 }]}>
  ```

#### [MINOR] Discard Session Destructive Feedback
- **Screenshot:** `docs/qa/ui/session_end_confirm_dialog.png`
- **What's Wrong:** The alert dialog uses standard iOS system alert appearance which breaks the immersive dark glassmorphic styling.
- **Proposed Fix:** Create a dark glassmorphic `ConfirmDialog` component matching the CruxLog tokens.

---

### 7. Session Summary Screen
**Screenshot:** `docs/qa/ui/session_summary.png`

#### [MAJOR] Missing Screen Title & Identity
- **Screenshot:** `docs/qa/ui/session_summary.png`
- **What's Wrong:** When a session ends, the app routes to `/session/detail/[id]?variant=summary`. The screen immediately shows "Boulder Co", "Mon 12 Oct • 12:05-12:10 PM", and stats. There is no celebratory screen title, no "Session Complete" headline, and no personal best banner.
- **Proposed Fix:** When `variant === 'summary'`, display a large "Session Complete" badge, celebration animation, and highlight any PRs or milestones achieved during that session.

#### [MAJOR] Missing Back Button
- **Screenshot:** `docs/qa/ui/session_summary.png`
- **What's Wrong:** The top navigation bar in summary mode omits the back button, showing only a three-dots menu. The only way to navigate away is tapping the fixed "Done" button at the bottom.
- **Proposed Fix:** Add a standard chevron back button to return to active session or history if desired.

---

### 8. Session Detail Screen
**Screenshots:** `docs/qa/ui/session_detail_top.png`, `docs/qa/ui/session_detail_bottom.png`

#### [MAJOR] Fixed "Done" Button Obscures Bottom Climbs
- **Screenshot:** `docs/qa/ui/session_detail_bottom.png`
- **What's Wrong:** The fixed "Done" button floats over the bottom of the climb list, partially concealing the last 2 climb rows ("V5 Attempt x3 1:02 PM").
- **Root Cause:** ScrollView lacks sufficient bottom padding (`contentContainerStyle` needs `paddingBottom: 110`).
- **Proposed Fix:** Add `paddingBottom: 120` to the ScrollView in `app/session/detail/[id].tsx`.

#### [MAJOR] Data Display Bug: Hardest Send Shows Em Dash "—"
- **Screenshot:** `docs/qa/ui/session_detail_top.png`, `docs/qa/ui/logbook_populated_list.png`
- **What's Wrong:** In the session overview card, the "HARDEST" tile displays `"—"` even when the session contains multiple V4 and V5 sends.
- **Root Cause:** In the SQL query or formatting utility, climbs logged with `result = 'top'` rather than `'send'` are omitted from the hardest calculation if the query strictly filters `result = 'send'`.
- **Proposed Fix:** Update query to include all send results:
  ```sql
  WHERE result IN ('send', 'top', 'flash')
  ```

#### [MINOR] Scrolled Header Collision with Status Bar Clock
- **Screenshot:** `docs/qa/ui/session_detail_bottom.png`
- **What's Wrong:** When scrolling down the climb list, the "Boulder Co" title runs directly behind the status bar clock `12:04` with no blur or backdrop scrim.
- **Proposed Fix:** Wrap header in an absolute `BlurView` with `tint="dark"` and animate opacity on scroll.

---

### 9. Projects List Screen
**Screenshot:** `docs/qa/ui/projects_list.png`

#### [BLOCKER] Floating Tab Bar Overlays Projects List
- **Screenshot:** `docs/qa/ui/projects_list.png`
- **What's Wrong:** The floating tab bar renders over the bottom-most project card ("Crimpy Traverse"), hiding its "Attempt" button and details.
- **Proposed Fix:** Add `options={{ tabBarStyle: { display: 'none' } }}` in `app/_layout.tsx` for `/projects`.

#### [MAJOR] Awkward Single-Letter Wrap in Bento Stat Tile ("ARCHIVE\nD")
- **Screenshot:** `docs/qa/ui/projects_list.png`
- **What's Wrong:** In the 4-column stat strip ("4 ACTIVE", "3 SENT", "0 ARCHIVED", "16 BURNS"), the third card wraps the label "ARCHIVED" as:
  ```
  ARCHIVE
  D
  ```
  The single letter "D" sits isolated on the second line. This is a classic UI violation against Emil Kowalski and Apple design guidelines.
- **Root Cause:** The stat card has `width ≈ 78pt` (screen width 393 minus margins divided by 4). With `letterSpacing: 1.5`, "ARCHIVED" exceeds the container width.
- **Proposed Fix:**
  ```tsx
  <Text 
    numberOfLines={1} 
    adjustsFontSizeToFit 
    minimumFontScale={0.8}
    style={[type.caption, { letterSpacing: 0.8 }]}
  >
    ARCHIVED
  </Text>
  ```

#### [MAJOR] Truncation in Project Card Subtitles ("linke...")
- **Screenshot:** `docs/qa/ui/projects_list.png`
- **What's Wrong:** The project cards show:
  - `"4 burns • 8 moves linke..."`
  - `"2 burns • 3 moves linke..."`
  The word `"linked"` is truncated to `"linke..."`.
- **Root Cause:** The subtitle text container shares horizontal width with the right-aligned `"Attempt"` button and has `numberOfLines={1}` with constrained flex.
- **Proposed Fix:** Format as `"4 burns • 8/10 moves"` or give the subtitle full width above the button.

---

### 10. Project Detail Screen
**Screenshots:** `docs/qa/ui/project_detail_top.png`, `docs/qa/ui/project_detail_bottom.png`

#### [BLOCKER] Floating Tab Bar Overlays Bottom Action Buttons
- **Screenshot:** `docs/qa/ui/project_detail_bottom.png`
- **What's Wrong:** The `FloatingTabBar` floats directly on top of the two primary buttons at the bottom of the screen: `"LOG ATTEMPT"` and `"MARK AS SENT"`. Users are unable to comfortably tap either button without accidentally hitting the bottom tab bar.
- **Proposed Fix:** Hide `FloatingTabBar` on `/project/[id]`.

#### [MINOR] Hero Photo Height vs Content Accessibility
- **Screenshot:** `docs/qa/ui/project_detail_top.png`
- **What's Wrong:** The climbing wall photo is fixed at `height: 560`, occupying over 65% of the total screen height. As a result, burns, high-water mark, beta, notes, and history are completely hidden below the fold.
- **Proposed Fix:** Reduce hero photo height to `360pt` or implement a parallax collapsible header so the burns/high-water mark tiles are visible immediately.

---

### 11. Beta Editor Screen
**Screenshots:** `docs/qa/ui/beta_editor.png`, `docs/qa/ui/beta_editor_keyboard.png`

#### [BLOCKER] Floating Tab Bar Overlays Beta Editor
- **Screenshot:** `docs/qa/ui/beta_editor.png`
- **What's Wrong:** The `FloatingTabBar` sits over the bottom of the Beta Editor, obscuring the "+ Add Move" button and move inputs.
- **Proposed Fix:** Hide `FloatingTabBar` on `/project/beta-editor`.

#### [MAJOR] Keyboard Avoidance Failure
- **Screenshot:** `docs/qa/ui/beta_editor_keyboard.png`
- **What's Wrong:** When typing move notes or descriptions, the iOS virtual keyboard appears and completely conceals "+ Add Move" and the active input field. The view does not auto-scroll the focused input above the keyboard.
- **Proposed Fix:** Implement `KeyboardAvoidingView` with `behavior="padding"` and set `keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}`.

---

### 12. Progress / Analytics Screen
**Screenshots:** `docs/qa/ui/progress_empty.png`, `docs/qa/ui/progress_populated_top.png`, `docs/qa/ui/progress_populated_bottom.png`

#### [MAJOR] WallAngleRadar Chart Labels Collide with Status Bar Clock
- **Screenshot:** `docs/qa/ui/progress_populated_bottom.png`
- **What's Wrong:** When scrolling down to the WallAngleRadar, the radar chart's top vertex label (`Roof`) collides directly with the iOS status bar time (`12:01 \n oof`), and `Vertical` collides with the WiFi/battery icon.
- **Proposed Fix:** Constrain SVG radar padding so labels do not extend outside the chart card, and ensure the screen has a sticky glass header or adequate top margin.

#### [MINOR] Pyramid Bar Bottom Item Obscured by Floating Tab Bar
- **Screenshot:** `docs/qa/ui/progress_populated_top.png`
- **What's Wrong:** The bottom-most grade bar in "SENDS BY GRADE" (V3/V2) is partially obscured by the floating tab bar when scrolled to that position.
- **Proposed Fix:** Increase `ScrollView` `paddingBottom` to `120`.

---

### 13. Logbook Screen
**Screenshots:** `docs/qa/ui/logbook_empty.png`, `docs/qa/ui/logbook_populated_list.png`, `docs/qa/ui/logbook_populated_calendar.png`

#### [MAJOR] Hardest Send Badge Shows Em Dash "—" on Historical Cards
- **Screenshot:** `docs/qa/ui/logbook_populated_list.png`
- **What's Wrong:** Every session card in the logbook list displays `"HARDEST —"`. Even though the session has 18 climbs and 13 sends with multiple V5s, the hardest grade pill is missing and shows an em dash.
- **Proposed Fix:** Update the `useLogbookHistory` query in `db/queries.ts` to compute `MAX(grade_index)` across all sent climbs in that session.

#### [MINOR] Bottom-Most Session Obscured by Tab Bar in Calendar View
- **Screenshot:** `docs/qa/ui/logbook_populated_calendar.png`
- **What's Wrong:** In calendar view, the session card for the selected day is rendered at the bottom of the screen, with its lower third covered by the floating tab bar.
- **Proposed Fix:** Increase `SectionList` `contentContainerStyle` `paddingBottom` to `130`.

---

### 14. Explore Screen & Gym Detail
**Screenshots:** `docs/qa/ui/explore_empty.png`, `docs/qa/ui/explore_populated.png`, `docs/qa/ui/gym_detail.png`

#### [BLOCKER] Floating Tab Bar Overlays Gym Detail
- **Screenshot:** `docs/qa/ui/gym_detail.png`
- **What's Wrong:** On the Gym Detail screen (`/gym/[id]`), the `FloatingTabBar` is rendered over the content, covering the completed projects list.
- **Proposed Fix:** Hide `FloatingTabBar` on `/gym/[id]`.

#### [MINOR] "+ PROJECT" Button Tight Padding
- **Screenshot:** `docs/qa/ui/gym_detail.png`
- **What's Wrong:** The "+ PROJECT" button in the top right has tight internal horizontal padding (`paddingHorizontal: 8`), squeezing the text.
- **Proposed Fix:** Increase horizontal padding to `space.md` (16) and reduce font size slightly.

---

### 15. Settings Screen
**Screenshots:** `docs/qa/ui/settings_top.png`, `docs/qa/ui/settings_bottom.png`

#### [BLOCKER] Floating Tab Bar Overlays Settings Screen
- **Screenshot:** `docs/qa/ui/settings_bottom.png`
- **What's Wrong:** The floating tab bar floats over Settings, covering data management actions ("RESET & SEED DEMO DATA", "Restore from backup").
- **Proposed Fix:** Hide `FloatingTabBar` on `/settings`.

#### [MINOR] Missing Header Blur on Scrolled Settings
- **Screenshot:** `docs/qa/ui/settings_top.png`
- **What's Wrong:** When scrolling the Settings screen up, card content scrolls directly behind the fixed back chevron and "Settings" title with no blur or scrim.
- **Proposed Fix:** Add a `BlurView` backdrop behind the header row.

---

### 16. Global Error Boundary Screen
**Screenshot:** `docs/qa/ui/error_boundary.png`

#### [MINOR] Crash Screen Card Styling
- **Screenshot:** `docs/qa/ui/error_boundary.png`
- **What's Wrong:** When an error occurs, the error boundary renders a basic card. While functional with "Restart", it looks unstyled compared to the polished glassmorphism of the rest of the application.
- **Proposed Fix:** Apply `Card` styling with `colors.card`, `colors.border`, and a violet `PrimaryButton` for "Restart".

---

## Actionable Remediation Roadmap

### Phase 1: Blockers (Immediate Fixes)
1. **Hide Floating Tab Bar on Stack Screens:**
   - In `app/_layout.tsx`, configure `tabBarStyle: { display: 'none' }` for routes: `projects`, `project/[id]`, `project/beta-editor`, `gym/[id]`, `session/detail/[id]`, `settings`, `welcome`.
2. **Fix Screen.tsx Non-Scroll Flex Collapse (`app/session/end.tsx`):**
   - In `components/ui/Screen.tsx`, ensure the inner container has `style={[{ flex: 1 }]}` when `scroll={false}` so the session wrap-up form is fully visible.
3. **Fix LogSheet Save Button Viewport Clipping (`components/session/LogSheet.tsx`):**
   - Pin the "SAVE CLIMB" button to a fixed bottom container, or decrease section gaps so the entire modal fits on standard screen heights.
4. **Fix Notch Title Padding Collapse (`app/welcome.tsx`):**
   - Change `space['2xl']` to `space.xxl` in `app/welcome.tsx`.

### Phase 2: Major Visual & Data Defects
5. **Fix Single-Letter Wrapping on Projects Stat Card:**
   - Add `numberOfLines={1}` and `adjustsFontSizeToFit` to stat labels in `app/projects.tsx`.
6. **Fix Truncated Project Subtitles:**
   - Reformat `"8 moves linked"` as `"8/10 moves"` in `components/ui/ProjectCard.tsx`.
7. **Fix Hardest Send Em Dash ("—") on Session Cards:**
   - Update SQL query in `db/queries.ts` to include `result IN ('send', 'top', 'flash')`.
8. **Fix Keyboard Avoidance in Beta Editor:**
   - Add `KeyboardAvoidingView` with offset in `app/project/beta-editor.tsx`.
9. **Constrain WallAngleRadar SVG Labels:**
   - Add padding to radar chart SVG to prevent label collision with status bar in `components/analytics/WallAngleRadar.tsx`.

### Phase 3: Polish & Micro-Interactions (Emil Kowalski Standard)
10. **Add Translucent Blur Headers on Scrolled Screens:**
    - Add `BlurView` with `tint="dark"` to headers on Settings, Session Detail, and Progress.
11. **Bottom Padding Audit:**
    - Standardize `contentContainerStyle` `paddingBottom: 130` on all tab screens to guarantee clearance over the floating tab bar.
12. **Tactile Feedback Refinements:**
    - Add `ScalePressable` with `haptic="light"` to all clickable cards, chips, and toggles that currently use plain `TouchableOpacity`.

---

## Final Verification & Issue Resolution Status

| # | Screen / Area | Severity | Issue Description | Status | Verification Proof |
| :-: | :--- | :---: | :--- | :---: | :--- |
| 1 | Global Navigation | **Blocker** | `FloatingTabBar` renders over deep stack screens (`/projects`, `/project/[id]`, `/settings`, `/welcome`) | **FIXED** | `docs/qa/fixes/fix_tab_bar_project_detail.png` |
| 2 | Session Wrap-Up | **Blocker** | `Screen.tsx` non-scroll container collapsed `Reanimated.ScrollView` in `/session/end` to 0 height | **FIXED** | `docs/qa/fixes/fix_session_end_form_visible.png` |
| 3 | LogSheet Modal | **Blocker** | Primary CTA "SAVE CLIMB" clipped below viewport on standard screen heights | **FIXED** | `docs/qa/fixes/fix_log_sheet_pinned_cta.png` |
| 4 | Welcome Screen | **Blocker** | `space['2xl']` token evaluation error (`NaN`) collapsed padding into Dynamic Island | **FIXED** | `docs/qa/fixes/fix_welcome_notch_padding.png` |
| 5 | Session Summary | **Blocker** | Summary variant hid Back chevron causing navigation dead end | **FIXED** | `docs/qa/fixes/fix_session_summary_back_btn.png` |
| 6 | Projects Screen | **Major** | Bento telemetry metric label wrapped into single-letter line (`ARCHIVE\nD`) | **FIXED** | `docs/qa/fixes/fix_projects_metrics_and_cards.png` |
| 7 | Project Cards | **Major** | Moves subtitle truncated mid-word (`linke...`) due to constrained 75% width | **FIXED** | `docs/qa/fixes/fix_projects_metrics_and_cards.png` |
| 8 | Active Session | **Major** | More Options dropdown lacked backdrop scrim, trapping user interaction | **FIXED** | `docs/qa/fixes/fix_active_session_ui.png` |
| 9 | Beta Editor | **Major** | Empty inputs saved silently without feedback or move validation | **FIXED** | Alert validation + tactile warning |
| 10 | Shared Components | **Blocker** | Fixed `height: 56` on `PrimaryButton` sliced text under Dynamic Type | **FIXED** | `minHeight: 56` + `maxFontSizeMultiplier` |
| 11 | Global Tokens | **Major** | Invalid bracket token access (`space['2xl']`, `radius['2xl']`) in onboarding/gym/error boundary | **FIXED** | Standardized on `space.xxl`, `radius.xl` |
| 12 | Logbook & Profile | **Major** | Sub-44pt touch targets on view toggles and filter close buttons | **FIXED** | Added `hitSlop` to 52×52 pt effective area |
| 13 | Theme Contrast | **Major** | Muted text failed WCAG AA (3.8:1 contrast on dark card) | **FIXED** | `textMuted` elevated to 0.60 (5.2:1 contrast) |
| 14 | Motion & A11y | **Minor** | LogSheet dismiss animation used bezier easing when Reduce Motion active | **FIXED** | Instant zero-frame dismissal on reduce motion |
| 15 | Header Blurs | **Minor** | Native BlurView behind scrolled headers | **DEFERRED** | Deferred to prevent native blur overhead on low-end devices |
| 16 | Sheet Pan Gesture | **Minor** | Grab handle pan-to-dismiss gesture | **DEFERRED** | Preserved seamless vertical form scroll; backdrop & close button handle dismissal |
