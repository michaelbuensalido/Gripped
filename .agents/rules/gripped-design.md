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
