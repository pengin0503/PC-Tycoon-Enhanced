# F0 Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking. Native execution is authorized; no subagents.

**Goal:** A Japanese desktop/mobile browser game with deterministic time, visible operating costs and persistent saves.
**Architecture:** Pure immutable simulation commands and seeded PRNG; content coefficients remain separate. Versioned validated snapshots sit between React and IndexedDB. Money is integer yen, and unaffordable spending is rejected atomically.
**Tech Stack:** TypeScript strict, React, Vite, Vitest, Zod, IndexedDB, Playwright.
**Spec:** docs/superpowers/specs/2026-10-08-pc-tycoon-enhanced-foundation-design.md

## Global Constraints
- TypeScript（厳格な型チェック）、Vite、ReactでUIを構築。
- UI非依存の決定論的TypeScriptエンジンでゲームを進行。
- バックグラウンド実時間を勝手に換算しない。
- 初期言語は日本語、内部文字列はローカライズ可能なキー管理。
- バックエンドなしで主要機能を完結させ、ユーザーデータを外部送信しない。
- LLM is a numerical game simulation; no real training/inference.

## Review Focus
- Invalid/overflowing numbers must never corrupt money or the PRNG (Task 1).
- Monthly insolvency must be explicit, never silently forgive expenses (Task 1).
- Future/corrupt/oversized saves must leave existing state intact (Task 2).
- IndexedDB transaction failure must reach the user (Task 2).
- Mobile width and hidden tabs must not cause overflow or advance time (Task 3).

### Task 1: Deterministic engine
**Files:** package.json, tsconfig.json, vitest.config.ts, packages/content/src/balance.ts, packages/sim/src/{types,schema,random,index}.ts, tests/foundation.test.ts.
**Interfaces:** createGame({id,name,year,difficulty,seed}): GameState; command(state, GameCommand): GameState; nextRandom(seed): [number,number]. State includes version/id/seed/day/company/finance/events; commands advance/spend; events daily/weekly/monthly.
- [x] Step 1: Tests assert 30 days advances day=30, normal monthly cost=12000, identical command replay is equal, input state unchanged, insufficient spending throws, invalid name/seed/year/days/price and overflow throw, funds insufficient for monthly cost create debt and insolvency event.
- [x] Step 2: `npm test -- tests/foundation.test.ts` → RED for missing behavior.
- [x] Step 3: Implement schema v1, uint32 xorshift, immutable validated commands; daily→weekly→monthly ordering, cash/debt ledger.
- [x] Step 4: `npm test && npm run typecheck` → PASS.
- [x] Step 5: Commit `feat: add deterministic simulation foundation`.

### Task 2: Save snapshots
**Files:** packages/save/src/{index,repository}.ts, tests/save.test.ts.
**Interfaces:** exportSave(GameState): string; importSave(string): GameState; migrateSave(unknown): GameState; SaveRepository.save/load/list/delete using IndexedDB transaction completion. Export max 5 MiB. Legacy v0 uses cash instead of company.cash; migration is explicit and tested.
- [x] Step 1: Test round trip and equal continuation, v0 migration, rejection of bad JSON/version/size/nonfinite values, real fake-indexeddb round trip/multiple slots/deletion; closed/unavailable database failure must reject.
- [x] Step 2: `npm test -- tests/save.test.ts` → RED.
- [x] Step 3: Implement validation before transaction and atomic put, preserve last saved id in metadata; recover latest valid snapshot, report corrupt slots.
- [x] Step 4: `npm test && npm run typecheck` → PASS.
- [x] Step 5: Commit `feat: add versioned offline save repository`.

### Task 3: Playable browser shell and CI
**Files:** apps/web/{index.html,vite.config.ts,src/{main,App,i18n}.tsx,src/styles.css}, tests/browser.spec.ts, playwright.config.ts, .github/workflows/ci.yml, README.md, docs/dev/STATUS.md.
**Interfaces:** React calls command and SaveRepository; use visible-page timer only, pause/1x/fast, new game controls (company/year/difficulty/seed), save/load/export/import, displayed errors, events and finances. Later phases add navigable panels to App.
- [x] Step 1: Browser tests start game, advance 30 days and check cash=488000, save/reload/equal day, export/import, reject malformed JSON with unchanged cash; 390px has no horizontal overflow, controls keyboard accessible.
- [x] Step 2: `npm run test:e2e` → RED for absent shell.
- [x] Step 3: Implement responsive independent Japanese UI, automatic saves on important changes with serialized writer, build and CI (npm ci/typecheck/test/build/e2e).
- [x] Step 4: `npm test && npm run typecheck && npm run build && npm run test:e2e` → PASS; self-review full phase against above focus.
- [x] Step 5: Commit `feat: add responsive company shell and CI`; update STATUS and push phase via non-forced GitHub ref update.

## Self-review
F0 exit covered; F1–F6 deliberately remain separate future plans. All numeric boundaries, month/week ordering, persistence and mobile inputs have assigned tests. Interfaces checked: only validated GameState crosses simulation/save/UI. User has authorized immediate execution and branch pushes.
