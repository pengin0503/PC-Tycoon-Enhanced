# Landscape visual upgrade — Native executing-plans
> Date 2026-10-08; user authorized implementation without repeated checkpoints. Native/executing-plans; no subagents. Source: `docs/superpowers/specs/2026-10-08-landscape-visual-design.md`. Preserve unrelated F0–F6.

## Files and seams
- `packages/content/src/research.ts`: 40 reachable cosmetic technologies with stable ids.
- `packages/sim/src/schema.ts`, `packages/sim/src/hardware.ts`, `packages/sim/src/devices.ts`: optional saved appearance, command validation, cost/attraction.
- `apps/web/src/HardwarePanel.tsx`, `apps/web/src/DevicesPanel.tsx`, `apps/web/src/RangeField.tsx`: range input with researched maximum and preview.
- `apps/web/src/ProductVisual.tsx`, `apps/web/src/ProductIllustration.tsx`, `apps/web/src/OfficeScene.tsx`: authored original pseudo-3D SVG compositions with per-tier appearance.
- `apps/web/src/App.tsx`, `apps/web/src/navigation.ts`, `apps/web/src/styles.css`, `apps/android/android/app/src/main/AndroidManifest.xml`: full-screen navigation, HUD, viewport and APK orientation.
- `tests/visual-research.test.ts`, `tests/landscape.spec.ts` and existing tests.

## Task 1 — failing evidence: cosmetic research contract
Write `tests/visual-research.test.ts`: 40 additional nodes, 3040 unique/reachable; default visual is legacy-compatible, unresearched tier fails in authoritative engine, researched tier persists, color/tier has visible distinct data and bounded cost; old snapshots without visual validate. Update only legacy count assumptions. Commit the tests and observe CI RED before implementation.

## Task 2 — cosmetic research and simulation
Implement 40 visual research nodes and effect linkage with research prerequisite validation; optional product visual Zod schema and optional design/assemble payload. Validate researched tier for each product category. Keep old saves parseable; attach new product appearance only when chosen. Document cosmetic cost and demand coefficient. Run unit test and full CI; commit.

## Task 3 — screen navigation and controls
Write browser RED tests for switching screens removing the dashboard, hash back, slider values, no horizontal overflow, save route. Implement hash-based navigation; move shared HUD and time control to compact app chrome; dashboard exclusively company screen. Add precise controls and live visual before submit, leave alternative keyboard usage. Add Android landscape request and fallback responsive design. Verify green and commit.

## Task 4 — illustrated art and polish
Write browser test that product preview differs across cosmetic tier and has accessible label, then implement SVG pseudo-3D illustrations; rich original product detail per category and tier, graphic card backgrounds, iconography; optional office pseudo-3D improvement. Run production offline/Android pipeline and app package check in CI, document remaining physical tests, commit. Review browser screenshot manually if available. Do not claim actual raster image generation when only procedural SVG is included.

## Resume
Check remote branch and last CI before each task, non-force push. Commit one task at a time. If blocked by missing local tools, leave honest task ledger, tests and incomplete items in STATUS.md rather than claiming verified.
