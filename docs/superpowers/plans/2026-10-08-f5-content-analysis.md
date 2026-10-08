# F5 Content and Analysis Implementation Plan
> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans; Native, no subagents, author phase review.
**Goal:** 3000 effect-bearing research nodes, content-driven balance/events, navigable research, financial analysis and original visuals; verify the complete feature mapping.
**Architecture:** Ten domains × six distinct applied research branches × fifty technology stages. Each node has prerequisites, work/cost, a generation and a gameplay effect. Parsed-state semantic validation protects migration/reference integrity; UI uses bounded pages and localized keys.
**Tech Stack:** Existing strict TypeScript, Zod, React, Vitest, Playwright, inline SVG.
**Spec:** docs/superpowers/specs/2026-10-08-pc-tycoon-enhanced-foundation-design.md
## Global Constraints
- 少なくとも3000の意味ある研究項目をデータとして扱い、前提条件・効果を持つ。
- 3000個の無意味な数字の水増しをしない。体系化した技術カテゴリ／世代／分岐と独自効果。
- ゲームバランス係数は全て設定データ化。
- 原作のUIや画像、ゲームデータを流用しない。
- 初期言語は日本語、内部文字列はローカライズ可能なキー管理。
## Review Focus
- Catalog has unique ids, reachable prerequisites, no cycles and every branch has a real effect (Task 1).
- Loaded legacy metrics remain historical; new designs use new research without breaking saves (Task 1).
- Unknown/duplicate ids, impossible launches, missing resources and overbooked saved clusters reject (Task 2).
- Corrupt newest slot recovers an intact slot and displays a warning (Task 2).
- All3000 research nodes are navigable; tables/charts/visuals fit mobile and labels remain localized (Task 3).
### Task 1: Applied research catalog
**Files:** packages/content/src/{research,hardware,ai,devices,events}.ts; packages/sim/src/{hardware,devices,ai,ai-math,events,schema,index}.ts; tests/content.test.ts.
**Interfaces:** Tech adds generation; techEffect completed/category/axis continues. Hardware/device/OS branches compute/power/cost/reliability/capacity/compatibility; AI branches compute/architecture/quantization/data/context/economics. Optional AIEffects arguments keep existing literal math tests intact. Monthly original market events create expiring demand/production modifiers.
- [x] Tests count3000, unique ids, DFS reachable acyclic dependencies, each category has6 effect-bearing axes, every hardware/device/OS branch changes a consumer metric or development work; AI branches improve their stated estimate/score/cost. Coefficients finite and event expiry works. 365-day economic replay remains bounded/deterministic.
- [x] `npm test -- tests/content.test.ts` → RED.
- [x] Implement staged catalog and branch consumers, defaulted reliability/modifiers, events and document coefficient meaning.
- [x] `npm test && npm run typecheck` → PASS.
- [x] Commit `feat: add 3000 applied research technologies and market events`.
### Task 2: Save integrity audit
**Files:** packages/sim/src/validation.ts; index.ts; packages/save/src/{index,repository}.ts; tests/integrity.test.ts; App.tsx.
**Interfaces:** validateGame(unknown): GameState validates shape and references, unique ids, office capacity, product state, exclusive hosting/training; SaveRepository.warnings reports latest-slot fallback.
- [x] Tests malformed saved references/duplicate ids/overbooked clusters and future histories reject, old snapshots migrate with defaults and equal continuation, corrupt newest IndexedDB row recovers prior row with warning; failed imports preserve previous UI game.
- [x] `npm test -- tests/integrity.test.ts` → RED.
- [x] Implement semantic parsing on engine/save boundaries and recovery notice.
- [x] Full unit/typecheck gates → PASS.
- [x] Commit `fix: validate saved references and report recovery`.
### Task 3: Analysis navigation and visual acceptance
**Files:** apps/web/src/{ResearchPanel,FinancePanel,OfficeScene,ProductVisual,App,i18n,strings.generated}.tsx/ts; tools/localize-ui.mjs; tests/content.spec.ts; docs/dev/{FEATURES,BALANCE,STATUS}.md.
**Interfaces:** Research category/axis/search and60-node pages; monthly cash/flow charts and product/rival comparison; SVG original office/product shapes; t(key) resolves Japanese UI text centrally.
- [x] Browser tests expose count3000, filter/search/paginate to late research, show actual financial chart/history, mobile320px fits and keyboard works.
- [x] `npm run test:e2e -- tests/content.spec.ts` → RED.
- [x] Implement bounded research rendering, analysis, SVG visuals and key-based Japanese UI; feature map ties PC-01–20/AI-01–07 to source/test evidence.
- [x] Full unit/typecheck/build/browser gates → PASS; visual screenshots and phase self-review.
- [x] Commit `feat: add research navigation and business analysis`; STATUS and nonforced phase push.
## Self-review
Every technology branch has an assigned consumer (not only descriptive metadata). Existing root IDs/labels and first-tier costs/work preserved. Existing cached products remain stable across content growth. New reference validation does not compare old performance to today's formulas. F6 distribution/device gates remain explicit.
