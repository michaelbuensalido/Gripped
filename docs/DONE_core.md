# Definition of Done: Core Session Flow

This checklist defines the acceptance criteria and verification status for the CruxLog Core Session Flow.

---

## 1. Fast Logging (≤ 3 Taps, < 10 Seconds)
- [x] **1.1** Quick "+1 Attempt" button on Active Session screen logs attempt in 1 tap without opening sheet.
- [x] **1.2** Quick-add grade chips accessible directly on Active Session screen (pre-fills grade in sheet).
- [x] **1.3** LogSheet has horizontal scrollable quick grade chips (V0–V16) for 1-tap grade selection.
- [x] **1.4** Standard logging flow takes ≤ 3 taps:
  - Default grade & outcome: Tap "+ LOG CLIMB" → Tap "SAVE CLIMB" (2 taps).
  - New grade: Tap "+ LOG CLIMB" → Tap Grade chip → Tap "SAVE CLIMB" (3 taps).
- [x] **1.5** Entire logging action completes under 10 seconds with haptic feedback.

---

## 2. Session Persistence & Resume Banner
- [x] **2.1** Active session is persisted in SQLite (`ended_at IS NULL`) and survives app restart, force-quit, and backgrounding.
- [x] **2.2** Home screen displays active session banner ("TODAY'S SESSION") with live elapsed duration, climb count, and "RESUME SESSION" button.
- [x] **2.3** Tapping "RESUME SESSION" navigates directly to `/session/active` with all logged climbs intact.

---

## 3. Climb Edit, Delete & Undo
- [x] **3.1** Edit climb opens `LogSheet` with existing climb data (grade, result, attempts, notes) populated.
- [x] **3.2** Editing does NOT delete the climb prematurely; closing/cancelling leaves the climb intact.
- [x] **3.3** Saving an edit updates the existing record via `updateClimb` without creating duplicates or changing ID/timestamp.
- [x] **3.4** Delete climb soft-deletes the record (`deleted_at = timestamp`) and excludes it immediately from active session stats.
- [x] **3.5** Undo Toast behaves symmetrically:
  - When a climb is logged: Toast says "Climb logged", tapping Undo soft-deletes the climb.
  - When a climb is deleted: Toast says "Climb deleted", tapping Undo restores the climb.

---

## 4. Flash Rule & Grade Locking
- [x] **4.1** Flash rule: Flash is strictly allowed ONLY on attempt #1.
- [x] **4.2** If attempts > 1, result cannot be "flash" (disabled in selector, coerced to "top" if attempts incremented).
- [x] **4.3** In-project logging: If the project already has prior attempts/burns (`> 0`), flash is disabled and coerced to "top".
- [x] **4.4** In-project logging: Grade is locked to the project grade (cannot be changed in picker, visual lock badge displayed).
- [x] **4.5** Flash rule and grade locking hold across both general logging (`LogSheet`) and in-project logging (`app/project/[id].tsx`, `ProjectCard`).

---

## 5. Rest Timer & Background Notifications
- [x] **5.1** Rest timer stores absolute epoch end timestamp (`restTimerEndTime`), keeping accurate remaining time when app is backgrounded or screen locked.
- [x] **5.2** Rest timer automatically starts when a climb or attempt is logged.
- [x] **5.3** Rest timer schedules local notification via `expo-notifications` on start/resume.
- [x] **5.4** Scheduled notification is cleanly cancelled if timer is paused, reset, or session discarded/ended.
- [x] **5.5** Rest timer UI shows "REST DONE" and triggers success haptic when countdown finishes.

---

## 6. Session End & Wrap-Up
- [x] **6.1** Confirmation dialog appears when ending session or discarding session.
- [x] **6.2** Perceived effort / RPE selector (1–5 scale with descriptive labels).
- [x] **6.3** Skin state selector (Good, Thin, Split, Sweaty).
- [x] **6.4** Finger state / fatigue selector (Fresh, Tired, Sore, Tweaked).
- [x] **6.5** Session notes input with multi-line support.
- [x] **6.6** Photo attachments via `expo-image-picker` saved to session `media_uris`.
- [x] **6.7** Session summary screen highlights Personal Bests (new hardest grade send) and topped projects with celebration banners.

---

## 7. Edge Cases
- [x] **7.1** Ending an empty session: Prompts climber with options to Discard empty session or Save it cleanly without crashing.
- [x] **7.2** Very long sessions: Format duration handles multi-hour sessions (`Xh Ym`) without NaN, overflow, or negative numbers.
- [x] **7.3** Ending twice: Double-tap guard (`isSubmitting` ref) prevents duplicate writes or racing wrap-ups.
- [x] **7.4** Deleting a project with logged climbs: Climbs retain their history with `project_id = NULL` rather than corrupting session logs.
- [x] **7.5** Invalid / empty input: Attempts clamped to ≥ 1, empty grades fallback safely, empty notes handled.
- [x] **7.6** Device clock / timezone changes: Durations clamped to `Math.max(0, ...)`, timestamps use UTC epoch milliseconds.

---

## 8. Unit Tests
- [x] **8.1** Unit tests for flash rule (attempt 1 vs >1, project prior burns) — `__tests__/session/flashRule.test.ts`.
- [x] **8.2** Unit tests for send-rate mathematics (0 climbs edge case, sends vs flashes vs attempts, soft-deleted exclusion) — `__tests__/session/sendRate.test.ts`.
- [x] **8.3** Unit tests for session lifecycle (start, resume, log, edit, delete, undo, end, empty session, project cascade) — `__tests__/session/sessionLifecycle.test.ts`.
