# Gripped 

Gripped is a mat-ready, tactile climbing and bouldering ledger. It is designed to track sessions, hangboard routines, grade pyramids, and volume stats with precision and focus.

---

## Architecture Summary

CruxLog is architected around the offline-first principles detailed in `docs/MVP_SPEC.md` and `docs/DESIGN_SYSTEM.md`:

1. **Local SQLite as the Single Source of Truth**:
   - All screens read and write directly to the local SQLite database (`expo-sqlite` on native / `better-sqlite3` in test).
   - Screens never make network requests directly.
   - Operations persist synchronously, surviving force-quits and process terminations.
2. **Outbox Pattern for Background Sync**:
   - Every mutating transaction writes both the local change and an entry into the `outbox` table.
   - A background sync engine replays pending outbox mutations idempotently when network connectivity is established.
3. **Resilience & Global Error Boundary**:
   - A root `GlobalErrorBoundary` catches unhandled exceptions across both React component trees and Expo Router routes.
   - Prevents blank screen crashes, protects local SQLite state, and provides an immediate one-tap **Restart CruxLog** action.
4. **Design System & Dark Glassmorphism**:
   - Styled with tokens from `theme/tokens.ts` (Neon Violet `#8E7CFF` primary accent, Flash Green `#6EE756` secondary feedback).
   - Translucent frosted surfaces (`rgba(22, 22, 30, 0.92)`) against a subtle speckled mat background.
   - Strict 44pt+ touch targets, WCAG AA contrast, and universal reduced-motion compliance.
5. **Fluid Native Motion**:
   - Hardware-accelerated transitions via `react-native-reanimated` and `react-native-gesture-handler`.
   - Tactile feedback integrated via `expo-haptics`.

---

## Prerequisites

- **Node.js**: >= 18.x (Node 20+ recommended)
- **Package Manager**: `npm` (or `yarn`)
- **macOS** (for iOS simulator / device builds) with Xcode and CocoaPods installed
- **Android Studio** (for Android builds) with Android SDK and emulator configured

---

## Getting Started

1. **Clone the repository**:
   ```bash
   git clone <repo-url>
   cd CRUXLOG
   ```

2. **Install dependencies**:
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Start Expo development server**:
   ```bash
   npm start
   ```

4. **Run on iOS**:
   ```bash
   npm run ios
   ```

5. **Run on Android**:
   ```bash
   npm run android
   ```

6. **Run on Web**:
   ```bash
   npm run web
   ```

---

## Available Scripts

| Script | Command | Description |
|---|---|---|
| `npm test` | `jest --runInBand` | Runs the full Jest test suite across queries, analytics, session lifecycle, and utilities. |
| `npm run lint` | `eslint .` | Runs ESLint 9 using the Expo flat config with zero warnings/errors enforced. |
| `npm run start` | `expo start` | Starts the Expo development server. |
| `npm run ios` | `expo run:ios` | Prebuilds and launches the native iOS application in Xcode simulator / device. |
| `npm run android` | `expo run:android` | Prebuilds and launches the native Android application. |
| `npm run web` | `expo start --web` | Starts the web development bundle. |

---

## Testing & Quality Assurance

To verify code health, type-safety, and test coverage:

```bash
# Type-check TypeScript without emitting output
npx tsc --noEmit

# Run ESLint linter
npm run lint

# Run Jest unit test suite
npm test

# Run tests with code coverage report for db/ and utils/
npx jest --coverage --collectCoverageFrom="db/**/*.{ts,js}" --collectCoverageFrom="utils/**/*.{ts,js}" --collectCoverageFrom="!db/**/*.backup"
```

---

## Demo Data & Seeding

For previewing analytics charts, pyramid visualizations, and sample logbook entries in development (`__DEV__`):

1. Navigate to **Profile / Logbook** -> tap the **Settings** gear icon.
2. Scroll to the **Developer** section.
3. Tap **Reset and seed demo data**.
4. Confirm the prompt to populate 2,000+ realistic simulated climbs, projects, and sessions.
