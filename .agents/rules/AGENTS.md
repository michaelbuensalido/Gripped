# Project rules

This is an offline-first React Native (Expo) bouldering app.

- Product spec: docs/MVP_SPEC.md. Follow it for screens, data model and
  offline-first architecture (Section 5A). Local SQLite is the source of
  truth; screens never call the network directly.
- UI: docs/DESIGN_SYSTEM.md. Light theme only for now.
  - Never hard-code colours, font sizes, radii or spacing. Use theme/tokens.ts.
  - Build screens from the shared components in components/ui/.
  - Before creating any new UI component, check whether one already exists.
- If a request conflicts with these docs, say so before proceeding.
