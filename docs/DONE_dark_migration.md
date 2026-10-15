# Dark UI Migration Report

## In Scope (To Be Migrated Now)
1. **app/projects.tsx** - Heavy usage of old hex colours (`#19191D`, `#8E7CFF`, `#FF453A`, etc.). Needs to be completely rewritten using `ProjectCard`, `Screen`, and `EmptyState`.
2. **app/profile.tsx** (The Logbook / Session History tab) - Imports old dark components (`SessionHistoryCard`, `LogbookFilterStrip`, `ConsistencyLedger`), uses Tailwind classes with hardcoded colors (`bg-surface`, `text-send`, etc.). Needs to be replaced with the `SessionRow` + grouped by month layout.
3. **app/session/detail/[id].tsx** - Currently uses `Alert.alert` for delete. Needs to be updated to use the 5-second `UndoToast` pattern with `softDeleteBoulderLog` built earlier, and ensure it strictly uses the new light tokens.
4. **components/ui/ProjectCard.tsx** - Needs to be created.
5. **components/ui/FilterChip.tsx** - Needs to be created.

*(Note: The inline Log Climb sheet in `app/session/index.tsx` was already migrated during Phase 1 & 2 and contains no hard-coded colours.)*

## Out of Scope (Remaining Dark UI)
The following files still contain hardcoded dark mode colors or old UI patterns, mostly related to specific analytics widgets and the active session video/camera components. They will be left untouched in this phase:
- `components/analytics/*.tsx` (Various analytics widgets like `MonthlyVolumeWidget`, `GradePyramidWidget`, `OutcomeRingGauge`, etc.)
- `components/session/*.tsx` (Camera overlays, `GradeEstimationSheet`, `PoseSkeletonOverlay`, `SessionPyramidChart`, etc.)
- `components/media/*.tsx` (Video players and camera recorders)
- `components/routines/*.tsx` (Old routines system components)

These colors will be extracted to `theme/tokensDark.ts` so they can be reintroduced as a dark mode option in the future.
