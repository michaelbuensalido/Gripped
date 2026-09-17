# CruxLog UI/UX Design System & Architectural Skill

## 1. System Philosophy: Industrial Neo-Tactile Ledger

CruxLog rejects generic SaaS tropes, "AI slop" (floating multi-color neon glows, soft drop shadows, nested bubble cards, decorative emojis), and bodybuilding fitness metaphors (sets, reps, RPE).

The app operates as a mat-ready, tactile climbing ledger inspired by industrial timing hardware, Dieter Rams, and mechanical utility tools. The gold-standard implementations are the **Home Page (`app/index.tsx`)** and **Analytics/Progress Page (`app/analytics.tsx`)**. All other screens must strictly follow their structural, typographical, and aesthetic patterns.

---

## 2. Global Design Tokens

### Color Palette

- **Canvas / Background:** Deep Matte Obsidian `#111113` (No gradients, optional 18% speckled mat texture).
- **Primary Surfaces:** Dark Basalt `#19191D` with crisp `1px` solid border `#27272F` (or `#2C2C35`).
- **Recessed / Inset Tracks:** Pitch Black `#141417` with `1px` border `#22222A` (used for inputs, steppers, sub-rows, and unselected states).
- **Text Hierarchy:**
  - High Contrast / Values: Pure White `#FFFFFF`
  - Secondary / Units / Labels: Crisp Muted Gray `#9090A0` (or `#8A8A98`)
  - Structural / Captions / Dividers: Slate Dim `#555562`
- **Functional State Accents ONLY (Never used decoratively):**
  - **Flash / Peak Efficiency:** Lime Green `#6EE756`
  - **Send / Primary Action:** Lavender `#8E7CFF`
  - **Record / Fall / Critical Alert:** Crimson Red `#FF453A`
  - **Attempt / Inactive State:** Dark Slate `#3E3E48`

### Geometry & Layout Bounds

- **Radii:**
  - Cards & Containers: `rounded-xl` (12pt) to `rounded-2xl` (20pt) maximum.
  - Controls, Pills, and Badges: `rounded-lg` (8pt) to `rounded-xl` (12pt).
  - Strictly avoid circular bubble cards or radii $> 20\text{pt}$ unless rendering a circular action ring.
- **Borders:** Universal `1px` solid borders on all distinct surface planes.
- **Touch Targets:** Minimum `44x44pt` (preferably `48x48pt`) hit boxes for chalked hands on gym mats.
- **Safe Scroll Clearance:** All root `<ScrollView>` and `<FlatList>` components **must** define:
  ```tsx
  contentContainerStyle={{
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 170, // Mandatory clearance for floating bottom dock
  }}
  ```

3. Core Component Patterns (Derived from Home & Progress)
   A. Metric Hero Blocks (As seen in Analytics/Home)
   Never wrap stats in nested bubbles with decorative flame/trophy emojis. Use clean tabular data layouts.
   Container: Surface #19191D, border 1px #27272F, rounded-xl, padding 16pt.
   Label: Small uppercase tracking label: 11pt bold #9090A0, letterSpacing: 1.2.
   Value: Monospaced / Tabular numerals: 28pt to 32pt bold #FFFFFF, fontVariant: ['tabular-nums'].
   Subtext / Delta: Compact trailing indicator: 12pt mono #6EE756 (positive) or #8A8A98 (neutral).
   B. Hardware-Style Action Banners (As seen on Home)
   High-contrast block triggers (e.g., Active Session resume or Quick Start):
   Height 48pt to 54pt, surface #19191D, border 1px #27272F, rounded-xl, px-4.
   Left: Compact solid badge (36x36pt, background #141417, border 1px #2C2C35) with functional accent icon.
   Center: Title (14pt bold #FFFFFF) + subtitle (12pt #9090A0).
   Right: Minimalist ChevronRight in #555562.
   Feedback: Active tactile compression (active:scale-98).
   C. Grade Badges & Chips
   Compact, high-legibility pills:
   Background #141417, border 1px #2C2C35, px-2.5 py-1, rounded-lg.
   Text: 13pt bold #FFFFFF (e.g., V4, V7).
   Peak/Flash variant: Text #6EE756 with border 1px #6EE756.
   D. Steppers & Controls
   Industrial rectangular hit areas instead of tiny round buttons:
   Container: Recessed #141417, border 1px #27272F, rounded-lg, height 38pt.
   Decrement/Increment: [-] and [+] targets minimum 36x36pt, text #8A8A98.
   Center readout: "X att" or "X s" in 13pt semi-bold #FFFFFF.
   E. Discrete Toggle Checkboxes (Send / Flash Toggles)
   Single square / soft-rect block (40x40pt to 42x42pt, rounded-lg):
   Unsent: Recessed #141417, border 1px #2C2C35.
   Sent: Solid Lavender #8E7CFF, white check icon.
   Flash: Solid Lime Green #6EE756, white zap/bolt icon.
4. Anti-Patterns & Banned Code
   Banned Anti-Pattern Required Industrial Standard
   Decorative emojis in labels (🔥 Streak, 💪 Sends) Typography does the work: STREAK, TOTAL SENDS
   Floating blurred shadows (shadowOpacity: 0.6, glow layers) Crisp 1px solid #27272F borders
   Multi-color radial / mesh gradient cards Flat matte #19191D with high-contrast borders
   Unconditional failure chip spam under every row Inline conditional drawers (render only on failed attempts)
   Standard variable-width numerals for timers fontVariant: ['tabular-nums'] with explicit widths
   Nested cards 3 levels deep Flat rows with horizontal rules (borderBottomWidth: 1)
5. Screen Implementation Checklist
   Before committing any refactored or new page:
   Does it match the dark matte obsidian palette (#111113 / #19191D) of the Home and Progress screens?
   Are all numbers/timers using tabular formatting without digit wrapping?
   Are all touch targets ≥44pt?
   Are decorative emojis completely absent?
   Does the root container have paddingBottom: 170 to clear the dock?
   Does npx tsc --noEmit pass with zero errors?

# UI Implementation Brief: Modern Bouldering Tracker

## Overview

Implement a premium, mobile-first bouldering tracker interface. The aesthetic is "Atmospheric Dark Mode" (with a light mode equivalent) that balances raw physical textures (speckled climbing mat backgrounds) with sleek, modern digital elements (glassmorphism, soft neon glows, and smooth large-radius cards). The design must feel tactile but polished, avoiding cluttered data in favor of clear, scannable hierarchies.

## Token Rules & Design Language

### 1. Color Palette

- **Backgrounds:** Use a deep, almost black obsidian for the main canvas, optionally layered with a very subtle speckled noise texture.
- **Surfaces:** Use matte charcoal for standard cards. Use semi-transparent dark tones with backdrop blur (glassmorphism) for floating elements (tooltips, bottom nav, header bars).
- **Primary (Purple):** Use strictly for primary calls-to-action (large buttons), active navigation states, and top-tier metrics (Top/Send in charts). Allows for soft box-shadow glows.
- **Secondary (Green):** Use for success states, "Flashes" in data, positive trend lines, and grade badges.
- **Text:** Pure white for primary data and headings; muted slate-gray for subtitles and metadata.

### 2. Typography

- Use a clean, geometric sans-serif font.
- **Data vs. Labels:** Large numbers (stats, grades) must be prominent and bold. Accompanying labels must be micro-typography: very small (10-11px), uppercase, bold, with wide letter spacing (tracking).

### 3. Shapes & Surfaces

- **Radii:** Soften the UI heavily. Main cards should use large border radii (e.g., 24px). Buttons, badges, and the main navigation bar should be fully rounded (pill-shaped).
- **Glassmorphism:** The bottom navigation bar and any image-overlay tooltips must float above the content. Implement this using a semi-transparent dark background, background blur, and a subtle, hair-thin semi-transparent white border to catch the light.

## Component Usage Guidelines

- **Stat Grids:** Group minor statistics into uniform cards with a solid matte background. Stack the large number on top of the micro-label.
- **Floating Navigation:** The bottom tab bar does not touch the edges of the screen. It floats as a centered pill. Ensure all scrollable page content has a bottom padding clearance of at least 120px so content is not trapped beneath it.
- **Data Visualization:** Charts (like the progress donut) should use thick, confident strokes with rounded caps, matching the primary/secondary color system.
- **Image Cards:** When displaying climbing holds or routes, use edge-to-edge images within the card radii. Apply a bottom-to-top dark gradient overlay inside the card to ensure text legibility.
