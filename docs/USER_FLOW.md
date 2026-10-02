# Bouldering App — User Workflow

Purpose: one clear picture of how the app is used, so every screen has a job and nothing feels chaotic. If a screen or feature doesn't fit this flow, it gets merged, moved or cut.

Companion to `MVP_SPEC.md` (what exists) and `DESIGN_SYSTEM.md` (how it looks).

---

## 1. The mental model

> **Go climbing → log your session → see your progress → pick what to try next.**

The whole app is that loop. Everything is built from four nouns, and the UI uses only these words:

| Noun        | Meaning                                                  |
| ----------- | -------------------------------------------------------- |
| **Session** | One visit to climb, from start to end                    |
| **Climb**   | One log entry inside a session (grade, result, attempts) |
| **Project** | A problem you're working toward and haven't topped yet   |
| **Gym**     | Where you climbed (optional)                             |

Anything else (routines, groups, recommendations, training plans) is not part of the MVP.

**Assumption to confirm:** a Project is a personal problem card you create yourself (name or nickname, colour, grade, optional photo and note). That keeps the MVP working without a shared gym database. If you've decided differently, this section changes.

---

## 2. The core loop

```
        ┌───────────────────────────────────────────────┐
        ▼                                               │
   BEFORE            DURING                AFTER        │
   Home ──► Start ──► Active Session ──► End ──► Summary ──┐
   (what now?)        (log climbs)       (wrap up)          │
                          ▲   │                             ▼
                          │   └─ mark a climb as Project   Progress
                          │                                 (how am I doing?)
                     Projects ◄─────────────────────────────┘
                     (what's next?)
```

### Before: Home answers "what now?"

- Shows: streak, last session, this week's totals, and your active Projects.
- One primary button: **Start session** (or **Resume session** if one is running).
- Tapping a Project opens its card, where you can see your history on it.

### During: the Active Session is the only screen that matters

1. Tap **Start session**. The gym is pre-selected to your last gym. One tap to change it, or skip it.
2. Tap **+ Log climb**. A bottom sheet opens with smart defaults: last grade, result = Top.
3. Pick the **grade** (or tap a **Project** from the list at the top of the sheet to log against it).
4. Pick the **result**: Flash / Top / Attempt.
5. Tap **Save**. The sheet closes and the list updates. That's 3 taps for the common case.
6. After an **Attempt**, a small prompt appears: "Make this a project?" (one tap, skippable).
7. Repeat. Notes, photo, rating and attempts count are optional extras inside the same sheet, collapsed by default.

### After: End, Summary, then back out

1. Tap **End**. Confirm, then an optional effort rating (1–5) and notes.
2. **Summary** shows duration, climbs, sends, hardest send, and highlights: personal bests and any **Projects you topped** (celebration moment).
3. Two exits: **Done** (back to Home) or **See progress**.

### Between sessions: review and plan

- **Progress** answers "how am I doing?": donut of results, trends, grade pyramid, history.
- **Projects** answers "what's next?": your list, sorted by closest-to-sending or last tried.
- **Profile** is for you and your settings.

---

## 3. The Project lifecycle

```
Created ──► Worked ──► Sent
```

| Stage       | How it happens                                                                                   |
| ----------- | ------------------------------------------------------------------------------------------------ |
| **Created** | From the "Make this a project?" prompt after an attempt, or manually from the Projects tab       |
| **Worked**  | Every attempt you log against it adds to its history across sessions (attempt count, last tried) |
| **Sent**    | Logging a Top or Flash on it archives it automatically and shows a celebration on the Summary    |

There is no separate "project mode". A project is just a problem you chose to keep track of, so it appears in the same Log Climb sheet as everything else.

---

## 4. What each tab is for

| Tab                            | Question it answers | Primary action                               |
| ------------------------------ | ------------------- | -------------------------------------------- |
| **Home**                       | What now?           | Start / Resume session                       |
| **Projects**                   | What's next?        | Add a project; open one to log an attempt    |
| **＋ Session** (centre button) | Let's climb         | Start / Resume session (same action as Home) |
| **Progress**                   | How am I doing?     | Open a stat; browse history                  |
| **Profile**                    | Me and settings     | Edit profile; sync and settings              |

Gym browsing and the shared problem database are **not** a tab in this version. Choosing a gym happens when you start a session, and managing gyms lives under Profile. (If you later add the shared problem database, Projects becomes "Explore", as in `MVP_SPEC.md`.)

---

## 5. Screen list with one job each

| Screen                   | Its one job                 | Primary action       | Leads to                               |
| ------------------------ | --------------------------- | -------------------- | -------------------------------------- |
| Home                     | Decide what to do now       | Start / Resume       | Active Session, Project card, Progress |
| Select Gym (small sheet) | Pick where                  | Confirm (pre-filled) | Active Session                         |
| Active Session           | Log climbs fast             | + Log climb          | Log sheet, End                         |
| Log Climb (sheet)        | Record one climb            | Save                 | Back to Active Session                 |
| End Session              | Wrap up                     | Finish               | Summary                                |
| Session Summary          | Show what you did           | Done                 | Home, Progress                         |
| Projects                 | See what you're working on  | Add project          | Project card                           |
| Project card             | See history, log an attempt | Log attempt          | Log sheet                              |
| Progress                 | See trends                  | (browse)             | Stat Detail, Session History           |
| Stat Detail              | Go deeper on one stat       | (browse)             | Session Detail                         |
| Session History          | Find a past session         | Open                 | Session Detail                         |
| Session Detail           | See or fix a past session   | Edit                 | Climb edit                             |
| Profile                  | Account and stats           | Edit                 | Settings                               |
| Settings                 | Preferences, sync, data     | (toggle)             | —                                      |

If a screen in the prototype isn't on this list, it's a candidate to merge into one of these or remove.

---

## 6. Rules that keep it from getting chaotic

1. **One loop.** Every feature must serve Log, Review or Plan. If it doesn't, cut it or defer it.
2. **Four nouns only.** Use Session, Climb, Project and Gym everywhere (screens, buttons, code, database). Don't introduce new ones.
3. **One primary button per screen.** Everything else is secondary or a text link.
4. **Defaults over questions.** Gym = last gym, grade = last grade, result = Top. The user changes them only when they differ.
5. **A running session follows you.** While a session is active, a slim banner ("Session · 42:10 · Resume") appears at the top of every screen, so you can never lose it or start a second one.
6. **No dead ends.** Every screen has a clear way back or forward. Every empty state has one button that leads into the loop.
7. **Extras are collapsed.** Notes, photos, ratings and edits are one tap away, never in the way.
8. **Mistakes are cheap.** Delete shows an Undo for 5 seconds. Any climb can be edited later from Session Detail.
9. **Settings stay out of the flow.** Nothing in a logging flow asks about preferences, sync or accounts.
10. **Offline is invisible.** The user never waits on the network. The only sign is the small sync chip.

---

## 7. Edge cases

| Situation                           | What happens                                                                                                                                                     |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Forgot to start a session           | Session History has **Add past session** (pick date, gym, then log climbs)                                                                                       |
| Forgot to end a session             | On the next launch, if a session has been open more than 6 hours: "Still climbing? End it at your last logged climb (5:42 pm)." with **End it** / **Keep going** |
| Started a second session by mistake | Not possible: Start becomes Resume while one is active                                                                                                           |
| Logged the wrong thing              | Swipe to delete (with Undo), or tap to edit                                                                                                                      |
| App killed mid-session              | Everything is already saved locally. Home shows Resume                                                                                                           |
| No gym, outdoors                    | Choose **Outdoor / Other** when starting; nothing else changes                                                                                                   |
| No signal                           | Everything works. The sync chip says "Offline". Data uploads when back online                                                                                    |
| First launch, no data               | Home shows one card: "Log your first session" with a Start button. Progress shows an empty state pointing to the same action                                     |

---

## 8. Onboarding (first run)

Keep it under a minute and let the user start climbing straight away.

1. **Welcome:** Get started / Log in. "Try without an account" is the default path.
2. **Grade system:** V-scale or Font (one tap).
3. **Optional:** pick a home gym, or skip.
4. **Land on Home** with the "Log your first session" card.

Account creation is offered later, after the first session ("Save your progress across devices"), not before the user has seen any value.

---

## 9. Prompt for your coding agent: flow audit

Use this before changing any more screens. It makes the agent compare the prototype with this document.

```
Read docs/USER_FLOW.md. Do not change any code yet.

Audit the existing app against it:

1. List every screen/route in the app: its file, its purpose in one
   sentence, its primary action, how a user gets there and where they can go
   next.
2. Flag every screen that:
   - isn't in the Section 5 screen list,
   - duplicates another screen's job,
   - has more than one primary action,
   - is unreachable, or is a dead end,
   - uses words other than Session / Climb / Project / Gym for these things.
3. Check the core loop from Section 2 step by step. Count the taps to log
   a climb, and tell me where the real flow differs from the document.
4. Check the rules in Section 6 (running-session banner, defaults, undo,
   collapsed extras) and say which are missing.
5. Propose a clean-up list: which screens to merge, move or remove, in
   order of impact, with the files affected.

Output the report only, then stop and wait for my approval.
```
