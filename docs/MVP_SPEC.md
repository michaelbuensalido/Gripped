# Bouldering App — MVP Product Spec

Working name: **Crux** (placeholder)

---

## 1. Overview

**One-line pitch:** A mobile app that lets boulderers log sessions, track every problem they attempt, and see their progression over time.

**MVP goal:** A climber can walk into a gym, start a session, log each climb in under 10 seconds, and later see clear progress charts. Everything else (social, training plans, video) is deferred.

**Primary users**

- Gym boulderers (beginner to V8) who currently track progress in notes apps or not at all.
- Climbers working a project who want to record attempts and beta.

**Core loop:** Start session → Log climbs → End session → See progress → Come back next session.

---

## 2. MVP Scope

### In scope

| Area               | Included                                                                                                   |
| ------------------ | ---------------------------------------------------------------------------------------------------------- |
| Auth               | Email + password, Google/Apple sign-in, guest-to-account upgrade                                           |
| Onboarding         | Grade system, experience level, home gym                                                                   |
| Gyms               | Browse, search, favourite a home gym, add a gym manually                                                   |
| Problems           | Browse a gym's problems, add a problem (user-created), save as project                                     |
| Sessions           | Start/stop session, live log, session summary, history                                                     |
| Logging            | Result (flash / send / attempt), attempts count, rating, notes, photo                                      |
| Progress           | Grade pyramid, sends over time, hardest send, streak, volume                                               |
| Profile & Settings | Grade system (V-scale / Font), units, account, data export                                                 |
| Offline-first      | Whole app runs from a local database; background sync, photo upload queue, sync status UI (see Section 5A) |

### Out of scope (post-MVP)

Social feed and following, comments, leaderboards, video upload, training plans, route-setting tools, gym-owner dashboard, push-notification campaigns, payments/subscriptions, wearables.

---

## 3. Navigation Structure

**Pattern:** Bottom tab bar (4 tabs) with a persistent centre action button for "Start Session". Each tab owns its own stack, so back navigation stays within the tab.

```
App Launch
 ├── Splash
 ├── [Not signed in] Auth Stack
 │     ├── Welcome
 │     ├── Sign Up
 │     ├── Log In
 │     └── Onboarding (3 steps)
 │
 └── [Signed in] Main Tabs
       ├── 🏠 Home
       ├── 🧗 Explore  (Gyms → Gym Detail → Problem List → Problem Detail)
       ├── ➕ Session (centre button — opens Session flow as a full-screen modal)
       ├── 📈 Progress (Stats → History → Session Detail)
       └── 👤 Profile  (Profile → Settings → …)
```

### Screen connection map

```
Home ──────────────► Active Session (resume / start)
Home ──────────────► Session Detail (tap recent session)
Home ──────────────► Problem Detail (tap a project)

Explore (Gym List) ─► Gym Detail ─► Problem List ─► Problem Detail
                            │                              │
                            └─► Add Problem ◄──────────────┤
                                                           └─► Log Climb (sheet)
Gym List ──────────► Add Gym

Session (modal):
  Select Gym ─► Active Session ─► Log Climb (sheet) ─► back to Active Session
                      │
                      └─► End Session ─► Session Summary ─► Home / Progress

Progress ─► Session History ─► Session Detail ─► Problem Detail
Progress ─► Stat Detail (e.g. pyramid drill-down) ─► Problem List (filtered)

Profile ─► Edit Profile
Profile ─► Projects (saved problems) ─► Problem Detail
Profile ─► Settings ─► Grade System / Units / Account / Export Data / Delete Account
```

---

## 4. Screens in Detail

### 4.1 Auth & Onboarding

**Splash** — Logo, checks auth token, routes to Welcome or Home.

**Welcome** — Tagline, "Continue with Apple/Google", "Sign up with email", "Log in", and "Try without an account" (guest mode, data stored locally until upgrade).

- → Sign Up, Log In, or Onboarding (guest).

**Sign Up / Log In** — Email, password, validation, forgot-password link, social buttons.

- → Onboarding (new user) or Home (returning).

**Onboarding (3 steps)**

1. _Grade system:_ V-scale or Font (changeable later).
2. _Experience level:_ Beginner / Intermediate / Advanced (used only to pre-set the grade picker range).
3. _Home gym:_ search nearby gyms, or skip.

- → Home.

### 4.2 Home

**Purpose:** Quick glance and fastest route into a session.

**Components**

- Greeting + streak chip (e.g. "3 sessions this week").
- Primary card: **Start Session** (or **Resume Session** if one is active).
- "This week" summary: sessions, climbs, sends, hardest send.
- Recent sessions list (last 3) with gym, date, send count.
- Projects strip (horizontal scroll of saved problems with attempt counts).

**Navigates to:** Session flow, Session Detail, Problem Detail, Progress (via "See all").

### 4.3 Explore

**Gym List**

- Search bar, "Home gym" pinned at top, "Favourites", "Nearby" (uses location permission, optional).
- Toggle: List / Map view.
- Components: `GymCard` (name, city, number of logged problems, favourite toggle).
- → Gym Detail, Add Gym.

**Gym Detail**

- Header (name, address, hours if available), favourite and "Set as home gym" buttons.
- Section filters: Walls / Zones.
- Primary CTA: **Start session here**.
- → Problem List (per wall), Add Problem, Session flow (pre-selected gym).

**Problem List**

- Filters: grade range, colour, wall, status (Not tried / Attempted / Sent / Project), sort (newest, grade, most climbed).
- Components: `ProblemCard` (photo thumbnail, colour dot, grade, wall name, your status badge).
- → Problem Detail, Add Problem.

**Problem Detail**

- Photo, grade (setter grade + community average), colour, wall, tags (slab, overhang, crimp, dyno, etc.), notes/beta.
- Your history on this problem: attempts, first send date, rating.
- Actions: **Log climb**, **Save as project**, Edit (if you created it), Report.
- → Log Climb sheet.

**Add Gym** — Name, city/address (optional map pin), grade system used by the gym. → Gym Detail.

**Add Problem** — Gym (pre-filled), wall/zone, colour, grade, tags, photo (camera or library), notes. → Problem Detail.

> **Key MVP decision:** There is no public gym/problem API, so problems are **user-generated**. Seed the top 5–10 local gyms manually to avoid an empty first launch. Duplicate problems are handled by "suggest existing match" when colour + wall + grade are similar.

### 4.4 Session Flow (full-screen modal)

**Select Gym** — Defaults to home gym or last gym; allows "Outdoor / Other". → Active Session.

**Active Session**

- Top bar: gym name, live timer, **End** button.
- Running tally: climbs, sends, hardest.
- Chronological list of logged climbs (swipe to edit/delete).
- Floating **+ Log climb** button.
- Quick-add chips for common grades (one tap logs a climb with default result = Send).
- Session persists if the app is closed (stored locally; resume banner on Home).

**Log Climb (bottom sheet)** — two modes:

1. _Pick a problem:_ search/scan the gym's problem list.
2. _Quick log:_ grade + colour only (no problem record).

- Fields: result (Flash / Send / Attempt), attempts count (stepper), rating (1–3 stars), notes, optional photo.
- Save → returns to Active Session; autosaves locally.

**End Session** — Confirm dialog, optional session notes, perceived effort (1–5). → Session Summary.

**Session Summary** — Duration, climbs, sends, flash count, hardest send, mini grade-pyramid, new personal bests highlighted. → Home or Session Detail.

### 4.5 Progress

**Progress (main)**

- Period selector: 7d / 30d / 90d / 1y / All.
- Cards:
  - **Grade pyramid** (sends per grade).
  - **Sends over time** (bar chart per week).
  - **Hardest send** trend (line).
  - **Volume:** sessions, climbs, total time.
  - **Flash rate** and **send rate**.
  - **Streak** (weeks with at least one session).
- → Stat Detail (tap any card) and Session History.

**Stat Detail** — Expanded chart with tappable bars that open a filtered Problem List or Session list.

**Session History** — Chronological list grouped by month; filter by gym. → Session Detail.

**Session Detail** — Same layout as Summary plus the full climb list. Edit session, delete session. → Problem Detail.

### 4.6 Profile

**Profile** — Avatar, display name, home gym, lifetime stats (sessions, sends, hardest send), links to Projects and Settings. → Edit Profile, Projects, Settings.

**Projects** — Saved problems with attempt counts and "last tried". → Problem Detail.

**Edit Profile** — Name, avatar, home gym, bio (optional).

**Settings**

- Grade system (V-scale / Font) — re-renders all grades via conversion table.
- Units (metric / imperial) — for height/reach later.
- Account (email, password, linked providers, upgrade guest).
- Notifications (session reminder toggle only in MVP).
- Data: export as CSV, delete account.
- About, privacy policy, terms, send feedback.

---

## 5. Features

### 5.1 Grading

- Store grades **internally as a numeric difficulty index**, with V-scale and Font as display layers. This avoids lossy conversion when users switch systems.
- Show setter grade and community grade separately once ≥ 3 users have voted.

### 5.2 Logging results

| Result  | Meaning                             | Counts as send? |
| ------- | ----------------------------------- | --------------- |
| Flash   | Sent first try (with no prior beta) | Yes             |
| Send    | Topped after more than one attempt  | Yes             |
| Attempt | Did not top                         | No              |

### 5.3 Projects

Marking a problem as a project pins it to Home and Profile. After the first send it auto-archives with a celebration state.

### 5.4 Stats rules

- A problem sent multiple times counts as one send for pyramid purposes (first send) but all repeats count toward volume.
- Streak = consecutive weeks (Mon–Sun) with ≥ 1 session.
- Personal best = new hardest send overall or at that gym.

### 5.5 Offline-first

The app is **offline-first by design**, not offline-tolerant: the local database is the source of truth and the network is only used to sync. Full architecture is in **Section 5A**.

### 5.6 Permissions

Camera (problem photos), photo library, location (optional, nearby gyms only). Always request in context with a one-line reason, never on launch.

---

## 5A. Offline-First Architecture

### Principles

1. **Local DB is the source of truth.** Every screen reads from and writes to the on-device database only. No screen ever waits on a network call.
2. **Writes are instant.** A write commits locally, the UI updates immediately, and the change is queued for sync.
3. **Sync is a background concern.** It runs on app open, on reconnect, after writes, and periodically; failures are silent and retried.
4. **No feature is blocked offline** except those that fundamentally need a server (sign-up/first login, password reset, account deletion, social sign-in).
5. **The user can always tell the state** through a small, calm sync indicator, never a blocking error.

### Data flow

```
 UI screens
    │  read (reactive queries)        ▲
    ▼  write                          │ updates
 Local SQLite DB  ◄─────────────────────────┐
    │  every write also appends to          │ apply remote changes
    ▼                                       │
 Outbox (pending changes queue)        Sync Engine ◄── triggers: app open,
    │                                       ▲              reconnect, after write,
    └──────────► Sync Engine ──── push ───► Supabase       timer, pull-to-refresh
                       ▲──────── pull ────  (Postgres)
 Photo queue ─► Upload worker (Wi-Fi preferred) ─► Storage
```

### What lives on the device

| Data                                        | Stored locally                                      | Notes                                                 |
| ------------------------------------------- | --------------------------------------------------- | ----------------------------------------------------- |
| Own sessions, climbs, projects, grade votes | All, forever                                        | Never evicted                                         |
| Gyms                                        | Home gym + favourites + any visited, fully cached   | Others fetched when online                            |
| Problems                                    | Full list for home gym, favourites and visited gyms | Refreshed on sync                                     |
| Own photos                                  | Original, compressed copy kept until uploaded       | Then thumbnail only (full image re-fetched on demand) |
| Others' photos                              | Thumbnails cached, LRU eviction (~200 MB cap)       | Placeholder when not cached                           |
| Settings, grade-conversion table            | All                                                 | Bundled in the app, no network needed                 |

**Gym pre-download:** when a user sets a home gym or favourites a gym, the app downloads that gym's full problem set and thumbnails in the background (with a "Ready offline ✓" badge on the gym). This matters because climbing gyms often have poor signal.

### Identity and IDs

- All records use **client-generated UUIDs (v7)**, so anything can be created offline without waiting for a server ID.
- Every synced table carries: `id`, `created_at`, `updated_at`, `deleted_at` (soft delete), `sync_status` (`pending | synced | conflict`), `server_version`.
- Deletes are **soft deletes** (tombstones) so they can propagate to other devices.

### Sync protocol

**Push (device → server)**

1. Outbox holds ordered operations: `{op_id, table, record_id, type: insert|update|delete, payload, created_at}`.
2. The engine sends batches (e.g. 50 ops) to a single `sync_push` function; operations are **idempotent** keyed by `op_id`, so retries after a dropped connection never duplicate data.
3. On success, ops are removed and rows marked `synced`. On failure, exponential backoff (5s → 30s → 5min → 30min).

**Pull (server → device)**

1. The device stores a `last_pulled_at` cursor per table.
2. It requests everything changed since the cursor (`updated_at > cursor`, including tombstones), paginated.
3. Changes are applied in a single local transaction so the UI never sees a half-applied state.

**Order:** push first, then pull, so local edits are not overwritten by stale server data.

### Conflict rules (per table)

| Table            | Strategy                                                                                         | Reasoning                             |
| ---------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------- |
| Session          | Field-level last-write-wins; `ended_at` once set can't be cleared                                | Edited from one device in practice    |
| Climb            | Append-only; edits are last-write-wins by `updated_at`                                           | Rarely edited, never contested        |
| Project          | Last-write-wins; `sent` status always beats `active`                                             | Avoids "un-sending" a project         |
| Problem (shared) | Field-level LWW for edits by creator only; others submit a _suggested edit_, not a direct change | Prevents users overwriting each other |
| GradeVote        | One vote per user per problem; latest wins                                                       | Natural key                           |
| Gym / Wall       | Creator edits only; duplicates merged server-side                                                | Shared data                           |

Server clocks decide ordering where possible: the server stamps `server_updated_at` on receipt, and the client's clock is never trusted for cross-device ordering (only for within-device sequencing).

**Duplicate shared records:** if two offline users each create "Blue, Wall 3, V4", both sync fine. The server flags probable duplicates and a lightweight merge step (post-MVP: community merge) reconciles them. In the MVP, the app simply shows both and prefers the older one in search.

### Photos (the hard part)

- Capture → compress on device (max ~1600px, ~300 KB) → save to local file storage → reference by local path in the row.
- A separate **upload queue** handles photos: Wi-Fi preferred (setting: "Upload on mobile data" off by default), resumable, retried with backoff.
- Until uploaded, the row shows the local image; after upload, `photo_url` is filled in and the local original is replaced by a thumbnail.
- The record syncs _before_ its photo; other users see a placeholder until the photo arrives.

### Authentication offline

- **First sign-up/login needs a connection** (once).
- After that the session token is stored securely (Keychain/Keystore); the app **opens and works fully offline indefinitely**. Token refresh happens quietly on the next connection.
- If a token has expired while offline, the app still works locally; sync resumes once the user re-authenticates (prompt appears only when online).
- **Guest mode becomes trivial and recommended**: guests use the same local DB with a local `user_id`; on sign-up, local records are re-owned by the new account and pushed. No separate code path.

### Offline behaviour by screen

| Screen                             | Offline behaviour                                                                                                   |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Onboarding                         | Works fully for guests; account creation deferred until online                                                      |
| Home                               | Fully functional from local data                                                                                    |
| Gym List                           | Shows cached gyms; "Nearby" shows cached only, with a "Connect to discover more gyms" hint                          |
| Gym Detail / Problem List / Detail | Fully functional for cached gyms; uncached gym shows "Not available offline" with a download button for when online |
| Add Gym / Add Problem              | Works; shows a "Waiting to sync" badge                                                                              |
| Active Session / Log Climb         | **Fully functional, the priority path**                                                                             |
| Session Summary                    | Computed locally                                                                                                    |
| Progress / Stats                   | **Computed locally from SQLite**, never from the server (so stats SQL lives on-device too)                          |
| Profile / Projects                 | Fully functional                                                                                                    |
| Settings                           | Works; account actions (change password, delete account, export via server) show "Requires internet"                |
| Community grade                    | Shows last-synced value with "as of [date]"                                                                         |

### Sync status UI

- **Header chip** (small, unobtrusive): `Synced ✓` · `Syncing…` · `3 changes waiting` · `Offline`.
- **Per-item badge** only where useful (e.g. a problem or photo "waiting to sync").
- **Settings → Sync:** last sync time, pending count, "Sync now", "Upload on mobile data" toggle, and "Storage used / Clear photo cache".
- Errors never block the user. A persistent failure (e.g. 5 days unsynced) gets one gentle banner, not a modal.

### Edge cases to design for

- App killed mid-session → session and climbs are already committed locally; Home shows "Resume session".
- Phone clock wrong → use monotonic sequencing locally; server timestamps on receipt.
- User logs in on a second device → initial pull downloads own history in pages with a progress screen; the app is usable once sessions load, with older data and photos filling in behind.
- Account deleted on another device → next pull returns a "user deleted" signal; local data is wiped after confirmation.
- Schema migrations → local DB migrations run on app update; the sync protocol carries a `schema_version` and the server rejects pushes from versions it can't handle with a "Please update" notice (data stays safe in the outbox).
- Storage full → warn before photo capture; never lose a climb log (text rows are tiny, photos are the only large cost).
- Clearing app data → warn that unsynced changes will be lost; show pending count first.
- Unsynced data on logout → block with "You have N unsynced changes — sync now or discard".

### Testing checklist (non-negotiable for offline-first)

1. Airplane-mode full session, then reconnect and verify the server matches.
2. Kill network mid-push; confirm no duplicates after retry (idempotency).
3. Two devices edit the same climb offline; confirm the conflict rules.
4. Force-quit during a write; confirm no corruption.
5. Install an old version, create data, upgrade, verify migration and sync.
6. Throttle to a slow 2G profile; confirm the UI stays instant.
7. Fresh install + login on a heavy account; confirm progressive initial sync.

---

## 6. Core User Flows

**Flow A — First-time user**
Welcome → Sign up → Onboarding (grade, level, home gym) → Home → Start Session → Log first climb → End → Summary.

**Flow B — Typical gym visit**
Home → Start Session (home gym pre-selected) → Log climb × N → End → Summary → Progress.

**Flow C — Working a project**
Explore → Gym → Problem List → Problem Detail → Save as project → (next visit) Home projects strip → Problem Detail → Log attempts → Send → project archived.

**Flow D — New problem at the gym**
Active Session → Log climb → "Can't find it? Add problem" → Add Problem (photo, colour, grade) → returns to Log Climb with problem selected.

**Flow E — Review progress**
Progress → tap pyramid bar (e.g. V4) → filtered Problem List → Problem Detail.

---

## 7. Data Model

**Sync columns on every synced table below:** `id` (client-generated UUIDv7), `created_at`, `updated_at`, `deleted_at` (tombstone), `server_updated_at`, `sync_status`. Extra local-only tables: `outbox` (pending operations), `sync_state` (per-table pull cursors), `photo_queue` (pending uploads).

```
User
  id, email, display_name, avatar_url, grade_system, experience_level,
  home_gym_id, created_at

Gym
  id, name, city, address, lat, lng, grade_system, created_by, created_at

Wall
  id, gym_id, name

Problem
  id, gym_id, wall_id, colour, grade_index, setter_grade_label,
  tags[], photo_url, notes, status (active | stripped),
  created_by, created_at

Session
  id, user_id, gym_id (nullable for outdoor), started_at, ended_at,
  effort (1-5), notes

Climb  (a log entry)
  id, session_id, user_id, problem_id (nullable for quick log),
  grade_index, colour, result (flash | send | attempt),
  attempts, rating (1-3), notes, photo_url, logged_at

Project
  id, user_id, problem_id, status (active | sent), created_at

GradeVote  (community grade)
  id, problem_id, user_id, grade_index
```

**Relationships**

- User 1—N Session, Session 1—N Climb.
- Gym 1—N Wall, Gym 1—N Problem, Wall 1—N Problem.
- Problem 1—N Climb (optional link), Problem 1—N GradeVote.
- User N—N Problem through Project.

---

## 8. Component Library (shared UI)

| Component                             | Used on                            |
| ------------------------------------- | ---------------------------------- |
| `GymCard`                             | Gym List, Home, Select Gym         |
| `ProblemCard`                         | Problem List, Projects, Home strip |
| `ClimbRow`                            | Active Session, Session Detail     |
| `GradePicker`                         | Log Climb, Add Problem, filters    |
| `ColourPicker`                        | Log Climb, Add Problem, filters    |
| `ResultSelector` (Flash/Send/Attempt) | Log Climb                          |
| `StatCard` / `ChartCard`              | Home, Progress                     |
| `GradePyramid`                        | Progress, Session Summary          |
| `SessionCard`                         | Home, History                      |
| `BottomSheet`                         | Log Climb, filters                 |
| `EmptyState`                          | Every list screen                  |
| `PrimaryButton`, `FAB`                | App-wide                           |

---

## 9. Suggested Tech Stack

Chosen to fit a React-first skill set while building real backend depth.

| Layer                            | Choice                                                                                                                                                             | Why                                                                                     |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| Mobile                           | **React Native + Expo** (TypeScript)                                                                                                                               | Reuses React knowledge, fast iteration, easy camera/location modules                    |
| Navigation                       | **Expo Router** or React Navigation                                                                                                                                | Matches the tab + stack + modal structure above                                         |
| Local database (source of truth) | **SQLite** via expo-sqlite + **Drizzle ORM** (or WatermelonDB)                                                                                                     | Reactive queries, migrations, and stats computed on-device                              |
| Sync engine                      | Own outbox + pull-cursor sync (recommended for learning and control), or a library: **PowerSync** (Supabase-compatible), **WatermelonDB sync**, or **ElectricSQL** | Libraries save weeks; hand-rolled teaches more and the data model here is simple enough |
| State                            | Zustand (UI state only)                                                                                                                                            | Data comes from reactive SQLite queries, not a server cache                             |
| Background work                  | expo-background-fetch + expo-task-manager, expo-network (connectivity)                                                                                             | Sync on reconnect and periodically                                                      |
| Secure storage                   | expo-secure-store                                                                                                                                                  | Auth token for offline-capable sessions                                                 |
| Backend                          | **Supabase** (Postgres, Auth, Storage, Row-Level Security)                                                                                                         | Auth, DB and photo storage out of the box; SQL practice                                 |
| Charts                           | Victory Native or react-native-svg + d3                                                                                                                            | Pyramid and trend charts                                                                |
| Images                           | expo-image-picker + Supabase Storage                                                                                                                               | Problem and climb photos                                                                |
| Maps (optional)                  | react-native-maps                                                                                                                                                  | Nearby gyms                                                                             |
| Analytics / errors               | PostHog + Sentry                                                                                                                                                   | Funnel tracking and crash reporting                                                     |
| Distribution                     | EAS Build → TestFlight / Play internal testing                                                                                                                     | Real-device testing with climbers                                                       |

---

## 10. Backend / API Outline

Using Supabase, most of this is table access governed by Row-Level Security. Custom logic goes in Postgres functions or edge functions.

| Endpoint / function                      | Purpose                                                                              |
| ---------------------------------------- | ------------------------------------------------------------------------------------ |
| `auth.*`                                 | Sign up, log in, social providers, session refresh                                   |
| `GET /gyms?near=&q=`                     | Search/nearby gyms                                                                   |
| `POST /gyms`                             | Create gym                                                                           |
| `GET /gyms/:id/problems?filters`         | Problem list                                                                         |
| `POST /problems`                         | Create problem (with duplicate-suggest check)                                        |
| `POST /sessions`, `PATCH /sessions/:id`  | Start / end session                                                                  |
| `sync_push` (RPC / edge function)        | Receive batched, idempotent outbox operations; apply with RLS; return per-op results |
| `sync_pull?since=&table=`                | Return rows changed since a cursor, including tombstones, paginated                  |
| `POST /photos/sign`                      | Signed upload URL for resumable photo upload                                         |
| ~~`GET /stats`~~                         | Not needed: stats are computed locally from SQLite                                   |
| `POST /projects`, `DELETE /projects/:id` | Manage projects                                                                      |
| `POST /grade-votes`                      | Community grade                                                                      |
| `GET /export`                            | CSV export                                                                           |

**Security basics:** RLS so users only read/write their own sessions, climbs and projects; gyms and problems are readable by everyone, editable by creator; report/flag column on problems for moderation.

---

## 11. Non-Functional Requirements

- **Speed:** Logging a climb should take ≤ 3 taps and < 10 seconds.
- **Offline:** Every screen except account creation/recovery works with no signal; all writes complete in under 100 ms regardless of network.
- **Sync reliability:** Zero data loss and zero duplicates across retries, crashes and reconnects.
- **Storage:** Photo cache capped (default ~200 MB) with user-visible clear option.
- **Accessibility:** Don't rely on colour alone (label colours with names), minimum 44pt tap targets, dynamic text support.
- **Gym-friendly UI:** Large buttons, high contrast, usable one-handed with chalky hands.
- **Privacy:** Location is optional; account deletion removes all personal data; export available.
- **Performance:** Cold start under 2s on mid-range devices; lists virtualised.

---

## 12. Build Plan (suggested phases)

| Phase                                     | Deliverable                                                                                                                             | Rough time  |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| 0. Setup                                  | Repo, Expo project, Supabase project, design tokens, navigation shell, **local SQLite + migrations + Drizzle schema with sync columns** | 3–4 days    |
| 1. Local-first core loop (no backend yet) | Sessions, Log Climb sheet, Session Summary, Home, all running purely on SQLite as a guest                                               | 1–1.5 weeks |
| 2. Local stats                            | Progress screens computed from SQLite (pyramid, trends, streaks, history)                                                               | 1 week      |
| 3. Auth + Sync engine                     | Sign up/in, secure token storage, outbox, `sync_push`/`sync_pull`, idempotency, sync status UI, guest-to-account re-ownership           | 1.5–2 weeks |
| 4. Gyms + Problems                        | Gym/problem screens, pre-download for home gym, Add Gym/Problem, shared-data conflict rules                                             | 1–1.5 weeks |
| 5. Photos                                 | Compression, local storage, resumable upload queue, thumbnail cache + eviction                                                          | 4–6 days    |
| 6. Projects + Profile + Settings          | Projects flow, grade-system switch, export, delete account, Sync settings                                                               | 4–5 days    |
| 7. Hardening + Beta                       | Offline test checklist (Section 5A), migration tests, slow-network tests, TestFlight with 10–20 climbers                                | 1.5–2 weeks |

**Why this order:** building the app local-first _before_ adding a backend means the core product works end-to-end by the end of phase 2, and sync becomes an additive layer rather than something every screen has to be rewritten around. Realistically, offline-first adds roughly 3–4 weeks over a plain online app, mostly in sync, photos and testing.

Phases 1 and 2 together are the product; if time is short, ship them as a local-only app with sync added afterwards.

---

## 13. Success Metrics for the MVP

- **Activation:** % of new users who log ≥ 1 climb in their first session (target 60%+).
- **Retention:** % who log a second session within 14 days (target 35%+).
- **Core speed:** median time to log a climb.
- **Data quality:** share of climbs linked to a problem vs quick-logged.

---

## 14. Open Decisions

1. **Problem database vs quick-log only for v1?** Quick-log is far simpler and still delivers the progress charts; the problem database is the bigger differentiator but needs content seeding.
2. **Sync engine:** hand-roll the outbox/cursor sync (more learning, full control) or adopt PowerSync/WatermelonDB (faster, less to debug)?
3. **Outdoor bouldering:** include now (needs location and area/problem data) or gym-only for v1?
4. **Grade conversion:** which Font-to-V mapping table to adopt (several conventions exist)?
5. **Moderation:** how to handle wrong/duplicate user-created problems when there's no gym partnership.
6. **Monetisation (later):** free core with paid advanced stats, or gym partnerships.

---

## 15. Post-MVP Roadmap

1. Follow friends and a session feed
2. Video beta uploads
3. Training plans and fingerboard timers
4. Gym partnerships (official problem sync, set changes, strip dates)
5. Outdoor areas and topo data
6. Badges, challenges and gym leaderboards
7. Apple Watch / Wear OS session tracking
