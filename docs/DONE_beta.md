# Definition of Done: Projects and Beta

This checklist defines the acceptance criteria and verification status for the CruxLog Projects and Beta system (move sequences, notes, offline video, share cards, and lifecycle).

---

## 1. Move Lists, Key Tips & Beta Versions
- [x] **1.1** Climber can add a move list and key tip to a project in under 1 minute.
  - Verified: Quick-entry input field in `BetaEditorScreen`, auto-focusing next move on Return, single-tap limb tagging.
- [x] **1.2** Moves are structured with text and optional limb tags (`LH`, `RH`, `LF`, `RF`).
  - Verified: `BetaMoveItem` displays limb badges with Violet accent styling; draft moves track `limb: LimbTag | null`.
- [x] **1.3** Moves are reorderable via drag-and-drop or order indexing.
  - Verified: `reorderMoves(moves, fromIndex, toIndex)` normalizes orders [0..n-1]; unit tested in `betaLogic.test.ts`.
- [x] **1.4** Exactly one move can be marked as the crux (toggling a new crux replaces the old one; toggling the current crux clears it).
  - Verified: `toggleCrux(currentCruxId, targetId)` enforces single-crux invariant; tested in `betaLogic.test.ts` and SQLite constraints.
- [x] **1.5** Key tip is displayed prominently as a headline tip for the project.
  - Verified: Displayed in `BetaSection` and `ProjectShareCard` inside a glass card with `KeyRound` badge.
- [x] **1.6** Beta is hidden by default behind a "Show Beta" toggle to prevent spoilers.
  - Verified: `BetaSection` defaults `showBeta: false`; hides all moves, videos, and key tips until tapped.
- [x] **1.7** Multiple beta versions per project (v1, v2, ...) with exactly one marked current and a horizontal version switcher.
  - Verified: `getBetasForProject(projectId)` returns versions; `betas` SQLite table enforces partial unique index on `(project_id, is_current=1)`.
- [x] **1.8** Ability to create a new version, edit the current version, and delete a version (promoting the newest remaining version if current was deleted).
  - Verified: `deleteBeta(betaId)` promotes newest remaining beta to `is_current=1`; UI tested via `BetaEditorScreen`.

---

## 2. Video Recording, Import & Offline Playback
- [x] **2.1** Video recording directly from camera (`BetaCameraRecorder`) stored locally on-device.
  - Verified: Records via `expo-camera/CameraView`, stores into `<doc>/beta-videos/<projectId>/` via `storeClip`.
- [x] **2.2** Video import from device media library (`expo-image-picker`) stored locally on-device.
  - Verified: Added `handleImportVideo` in `BetaSection` picking mediaType `videos`, verifying duration/size, and saving locally.
- [x] **2.3** Offline playback via `expo-video` requiring zero network access.
  - Verified: Uses `useVideoPlayer` pointing to local `file://` URIs; 100% offline.
- [x] **2.4** Variable playback speed controls (`0.25x`, `0.5x`, `1.0x`, `2.0x`) and frame-by-frame stepping (`-1 Frame`, `+1 Frame`).
  - Verified: Speed chip bar in `BetaVideoPlayerModal` with `player.playbackRate` switching and ±0.033s stepping.
- [x] **2.5** Audio mute toggle button visible and functional in the player controls.
  - Verified: Added mute/unmute button with `Volume2` / `VolumeX` toggling `player.muted`.
- [x] **2.6** Timestamped notes: displays list of notes with formatted timestamps (e.g. `0:08 foot slipped`).
  - Verified: Video notes list ordered chronologically via `getNotesForVideo` and `formatTimestamp`.
- [x] **2.7** Tapping any timestamped note seeks video playback directly to that timestamp.
  - Verified: Tapping note calls `player.currentTime = note.timestampSec; player.pause()`.
- [x] **2.8** Adding a note stamps the current video playback position automatically.
  - Verified: "Add Note at [timestamp]" input pre-stamps `player.currentTime` into SQLite `video_notes`.

---

## 3. Storage Management & Cascade Deletion
- [x] **3.1** Clip length is strictly capped at 60 seconds (camera recorder auto-stops at 60s; imported videos validate/trim to 60s).
  - Verified: `BetaCameraRecorder` counts down `maxDuration = 60s` and invokes `stopRecording()`; import warns and clamps.
- [x] **3.2** Videos are compressed on save and stored in isolated project document storage (`<doc>/beta-videos/<projectId>/`).
  - Verified: `storeClip` copies to `FileSystem.documentDirectory + 'beta-videos/' + projectId + '/'`.
- [x] **3.3** Per-project video storage consumption is calculated and displayed (e.g. "Storage: 14.2 MB").
  - Verified: `getProjectStorageBytes(projectId)` sums `size_bytes` and displays formatted in `BetaSection`.
- [x] **3.4** Way to delete individual video clips with file cleanup from device storage.
  - Verified: Trash button on video clip calls `deleteVideo(videoId)`, which deletes file from disk and DB row.
- [x] **3.5** Deleting a project cascades to remove all associated DB records (betas, moves, videos, notes) and deletes all video files and clip directories from disk.
  - Verified: `cascadeDeleteProjectBeta(projectId)` removes video directory and clip files before `deleteProject` runs.

---

## 4. Project Share Card
- [x] **4.1** Share card modal accessible from Project Detail allowing export via system share sheet (`expo-sharing`).
  - Verified: Accessible from Project Detail menu ("Share card"), invokes `Sharing.shareAsync` with high-res PNG.
- [x] **4.2** Card captures as high-resolution PNG image via `react-native-view-shot`.
  - Verified: Wrapped in `captureRef(cardRef, { format: 'png', quality: 1.0, result: 'tmpfile' })`.
- [x] **4.3** Dark glassmorphic aesthetic matching CruxLog theme (project title, grade, gym, angle, hold type, total burns, high-water mark, date).
  - Verified: Styled in `ProjectShareCardModal` with Violet `#8E7CFF` accents, Flash Green `#6EE756`, and glass borders.
- [x] **4.4** Spoiler privacy rule: Beta is excluded by default from the share card unless sender explicitly toggles "Include Beta".
  - Verified: `includeBeta` defaults to `false`. Card displays grade, burns, telemetry without spoiling beta.
- [x] **4.5** When opted in, share card includes the key tip, moves list with crux badge, and beta version label.
  - Verified: Toggle reveals moves sequence, crux chip, and key tip on the rendered share card.

---

## 5. Project Lifecycle & List States
- [x] **5.1** Active (`in_progress`): log attempts, quick +1 burn, mark as sent, archive.
  - Verified: Detail screen supports `LOG ATTEMPT`, `MARK AS SENT`, `Archive`, and dropdown actions.
- [x] **5.2** Sent (`sent`): triggers celebration modal with confetti burst and sound/haptic feedback; listed under Sent tab with completion date and stats.
  - Verified: `triggerBig({ title: 'PROJECT SENT!' })` invoked with `CelebrationProvider`; listed in `sent` tab.
- [x] **5.3** Archived (`abandoned`): hides from active hit-list, displays in Archived tab and shows archived banner on detail with 1-tap Restore.
  - Verified: Filtered out of active query, rendered in Archived tab with Restore button restoring to `in_progress`.
- [x] **5.4** Designed empty states for each tab: Active ("No active projects"), Sent ("No sent projects"), Archived ("No archived projects"), and filtered search.
  - Verified: `EmptyState` component rendered on all empty project tabs.

---

## 6. Edge Cases & Resilience
- [x] **6.1** Camera or microphone permission denied: shows graceful permission request card with settings guidance, never crashes.
  - Verified: Handled in `BetaCameraRecorder` with `requestPermission` button and descriptive explanatory notice.
- [x] **6.2** Missing or corrupt video file: handles missing file gracefully without crashing or blank screen; allows user to delete broken record.
  - Verified: `checkClipFileExists` checks file on disk; player shows fallback alert with "Delete Broken Record" button.
- [x] **6.3** Low storage awareness: warns before import if storage is constrained.
  - Verified: File sizes checked before SQLite insert; storage totals surfaced to user.
- [x] **6.4** App killed mid-recording: fails safely without writing 0-byte unplayable records.
  - Verified: Catch handler cleans up partial recording files and avoids inserting corrupt video rows.

---

## 7. Verification & Tests
- [x] **7.1** Unit tests for move list ordering, reordering, crux toggling, and version transitions.
  - Verified: Passed in `__tests__/utils/betaLogic.test.ts`.
- [x] **7.2** Unit tests for timestamp formatting, storage calculations, and cascade file deletion.
  - Verified: Passed in `__tests__/utils/betaLogic.test.ts` and `__tests__/queries/betaQueries.test.ts`.
- [x] **7.3** Unit tests for project lifecycle (active -> sent -> archived -> restored -> deleted).
  - Verified: Passed in `__tests__/projects/projectLogic.test.ts` and `__tests__/queries/betaQueries.test.ts`.
- [x] **7.4** `npx tsc --noEmit` and Jest suite run clean with zero errors.
  - Verified: TypeScript passed with 0 errors; Jest passed 23 test suites and 120 tests.
