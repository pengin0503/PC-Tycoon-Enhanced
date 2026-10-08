# PC Tycoon Enhanced — Android-first gameplay UI (2026-10-08)

Status: user-directed implementation. Extends landscape visuals spec and already implemented F0–F6 systems. Base: feat/landscape-visual-design-20261008, exact starting commit 7420776, do not pin main.

## Decision
Android installable APK is the sole **delivery target**. Keep React, TypeScript, Capacitor and the deterministic game engine; a native rewrite is not justified by scrolling issues. The Vite-rendered files are packaged inside the APK and work offline. Browser rendering is retained as a development/test harness, not maintained or promoted as a public Web/PWA product. Do not delete CI browser tests or game save interoperability.

## User experience and acceptance
Landscape mobile, no page-size vertical scroll to find principal actions. Android system back uses in-app navigation before exiting; editing mode must not navigate unexpectedly when the keyboard is open. Core top HUD and footer navigation stay visible. Page sections must be **explicitly selected**, not vertically concatenated.
- Company: office and current activity on a compact dashboard.
- Hardware and PC builder: switch between Design and Products via prominent top-level sub-tabs. Design uses 3D-look preview, sliders, color choices; Products lists established designs with independent scrolling.
- Research: search/filter + at most 12 technologies per page and visible pagination; no one-page 60-card wall.
- Management: Facilities / Staff / Finance / Rivals sub-tabs, each one local page.
- AI: Cluster / Training / Deployment/Portfolio sub-tabs, preserve all AI commands.
- OS: Design / Products / Virtual Desktop sub-tabs; preserve functionality.
- Finance: Overview / Product Analytics / Market Events as sections.
- Save: dedicated export/import/slot screens, no scrolling required to find save controls.
The active sub-tab persists when state changes within a screen, and the user's current button state survives switching sub-tabs. Inactive panels do not render, preventing off-screen duplicate controls. Each screen may scroll *inside its own bounded content pane* for long records, never in a global vertically stacked dashboard.
- Android activity requests landscape and immersive visual treatment (preserve keyboard and insets). Do not demand intrusive storage permissions. Back navigation within app uses Android system back and browser hash history; avoid leaving the game by mistake.
- Accessibility: button labels, selected state, touch targets >= 36 CSS px, focus, range controls, inputs readable; 844x390 and 960x540 Android-like viewport acceptance plus portrait emergency fallback.
- Persist existing version-1 save format, no reset/migration of user data.
- Debug APK signed by Android tooling must pass CI APK inspection. Release keystore/production signing and physical device acceptance are separate explicit gates and must not be claimed finished without evidence.

## Constraints
No new game engine, no Kotlin full rewrite; small Java MainActivity change only where justified. Do not copy PC Tycoon 2 protected art. Preserve AI lab, OS simulator, models, simulation economics, and all existing completed test contracts, adapting UI navigation tests when needed.
