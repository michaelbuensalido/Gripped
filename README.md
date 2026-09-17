# CruxLog 

CruxLog is a mat-ready, tactile climbing and bouldering ledger. It is designed to track sessions, hangboard routines, grade pyramids, and volume stats with precision and focus.

## Key Features

- **Chronological Logbook:** Track your gym sessions, boulder groups, and send pyramids in a flat, hardware-style ledger.
- **Active Session Tracking:** Start a session and keep it running globally across the app via a floating active-session dock.
- **Routines & Hangboard:** Industrial-style hangboard timer and specialized climbing routine tracking.
- **Analytics & Progress:** Granular breakdowns of your angle mastery, failure reasons, and grade pyramids.
- **Tactile UI:** Heavy reliance on haptic feedback and tabular monospace typography for numerical data.

## Tech Stack

- **Framework:** React Native / Expo (Expo Router)
- **Styling:** NativeWind (Tailwind CSS v4)
- **State Management:** Zustand (`sessionStore`)
- **Local Database:** SQLite
- **Icons:** Lucide React Native
- **Camera:** React Native Vision Camera

## Development Setup

Because CruxLog relies on native vision camera plugins and custom native modules, it **cannot** be run in Expo Go. You must build the native app.

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Run on iOS Simulator / Device:**

   ```bash
   npm run ios
   ```

   _Note: This will trigger a prebuild and compile the native iOS app._

3. **Run on Android (if configured):**
   ```bash
   npm run android
   ```
