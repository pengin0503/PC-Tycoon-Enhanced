# Review Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking. Native execution is selected; no implementer subagents.

**Goal:** Resolve #48–#55 without losing save compatibility or historical accounting.

**Architecture:** Keep the existing sim/save/web boundaries. Introduce bounded AI history and monotonic IDs; share pricing and inference derivations; aggregate market records and validate interactive advancement at transaction boundaries. Publish the APK produced by verified CI instead of independently rebuilding it.

**Tech Stack:** TypeScript, Zod 4, React 19, Vitest, Playwright, Capacitor, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-10-11-review-remediation-design.md` (approved 2026-10-11).

## Global Constraints

- 現役の `clusters` は20基、`models` は100件という現行上限を維持する。
- 個別履歴は直近200件、累計値は全期間保持する。
- 5MiB保存制限、旧セーブ、コマンドの原子性、seed決定論、決定待ち停止を維持する。
- 自動CI、mainからのAPK公開、独立したエミュレーター検証を維持する。
- 研究バランス、物理較正、署名方式は対象外。

## Review Focus

1. Malformed old ledger entries must not become valid through aggregation (Task 1).
2. Missing hardware of stopped models must not prevent migration/redeployment (Task 4).
3. A disposed cluster must never refund cash or inventory (Task 4).
4. Zero-day or already-paused advancement must retain safe behavior (Task 5).
5. Fork/failed PR artifacts must never reach a write-permission release job (Task 6).

---

### Task 1: Market ledger (#48)

**Files:** `packages/sim/src/market-share.ts`, `schema.ts`, `validation.ts`, `tests/review-market.test.ts`.
**Interfaces:** Produce `normalizeMarketSales(records, day)` and `marketLedgerLimit`; preserve `recordMarketSale` signature.

- [x] RED: interleaved PC/OS sales aggregate to two entries; old unaggregated save normalizes without changing shares; 360-day window; malformed entries rejected; theoretical full-grid exports within 5MiB.
- [x] Run `npm test -- tests/review-market.test.ts`; expect aggregation assertions to fail.
- [x] GREEN: daily/company/kind coalescing, bounded 360-day pruning, safe-integer aggregate counts, derived 39,600-cell limit; validate raw records before normalizing.
- [x] Run focused tests then `npm test`; expect zero failures; commit `fix: bound and aggregate observed market sales`.

### Task 2: Shared pricing (#49)

**Files:** `packages/sim/src/pricing.ts`, `hardware.ts`, `devices.ts`, `apps/web/src/DevelopScreen.tsx`, `ProductEditors.tsx`, `ProductsScreen.tsx`, `tests/review-pricing.test.ts`.
**Interfaces:** Produce `productPriceRange(p, day)`; consume `marketReference(kind, day)`.

- [x] RED: preview endpoints accepted by design/price at years 2000/2030/2100/2200; assert UI uses current day.
- [x] Run focused tests; expect missing shared-preview assertions to fail.
- [x] GREEN: use shared preview in UI and engine; keep OS fixed reference behavior.
- [x] Run focused tests, typecheck and full suite; commit `fix: share current-market pricing across UI and engine`.

### Task 3: AI effects and OS lifecycle (#50/#51/#55)

**Files:** `packages/sim/src/ai.ts`, `os.ts`, `apps/web/src/HardwareTerms.tsx`, `tests/review-effects.test.ts`.
**Interfaces:** Produce `refreshInference(s)`; preserve daily/service settlement contracts.

- [x] RED: research changes live speed/penalty while preserving accrued fees and scores; ended OS cannot trigger new attacks; pending attack survives retirement; help describes linear clock power.
- [x] Run focused tests; expect stale inference/ended-OS/help assertions to fail.
- [x] GREEN: common inference refresh, active OS filter, text-only help correction.
- [x] Run focused and full tests; commit `fix: apply live inference research and OS support lifecycle`.

### Task 4: AI reusable slots (#53)

**Files:** Create `packages/sim/src/ai-lifecycle.ts`; modify `ai-schema.ts`, `schema.ts`, `validation.ts`, `ai.ts`, `apps/web/src/AIPanel.tsx`; create `tests/review-ai-lifecycle.test.ts`.
**Interfaces:** `archiveModel` and `disposeCluster` command variants; `clusterSeq`, `modelSeq`, `aiHistory`; model `trainingCluster` snapshot. Produce `clusterBookValue`, `aiLifecycleCommand`, `normalizeAILifecycle`.

- [x] RED: archive frees model slot, refuses live/training model; disposal frees cluster slot, refuses busy cluster, preserves ready/open model; noncash writeoff; old-save sequence repair; stale disabled service redeploys; 201 histories retain 200 details/all totals; invalid references still rejected.
- [x] Run focused tests; expect unsupported command assertions to fail.
- [x] GREEN: implement strict lifecycle schema, atomic commands, single settlement, monotonic IDs, bounded history totals and migration; no cash/inventory refunds.
- [x] GREEN UI: confirmation-backed archive/dispose buttons, disabled reasons, history tab and cumulative totals; existing stopped models remain restartable until archived.
- [x] Run focused tests, typecheck, save/integrity tests and full suite; commit `feat: reuse AI slots with bounded history and safe disposal`.

### Task 5: Transaction-boundary performance (#52)

**Files:** `packages/sim/src/index.ts`, `validation.ts`, `tests/review-performance.test.ts`; benchmark `tools/review-benchmark.ts`.
**Interfaces:** Preserve public `command`, `advanceInteractive`; internal `applyCommand` operates only on copied validated state.

- [x] RED: interactive seven days equals seven one-day commands; spy checks two rather than fourteen validations; decision/offer/attack/gameover stop preserved; invalid input rejected even for zero days; input remains unchanged on failure.
- [x] Run focused tests; expect excessive validation assertion to fail.
- [x] GREEN: Set research prerequisite lookup, extract internal command application, validate once at entry/exit; preserve each day's stop check.
- [x] Run focused and full tests; benchmark initial/1,000/all research ×100/500 products; commit `perf: validate interactive advances at transaction boundaries`.

### Task 6: Verified APK publication (#54)

**Files:** `.github/workflows/ci.yml`, `android-release.yml`, `tests/android-release.test.ts`, `ci-spending-efficiency.test.ts`, `tests/review-ci.test.ts`.
**Interfaces:** CI game/android jobs produce test results/APK; release job `needs: [game, android]`, consumes same-run `pc-tycoon-debug-apk` artifact; manual wrapper calls reusable CI.

- [x] RED: single main-push verifier/publisher, write permission only on main release job, dependencies on both successful jobs, artifact reuse/no release rebuild, fixed version before build, manual entry calls same workflow.
- [x] Run workflow contract tests; expect duplicate-trigger and artifact assertions to fail.
- [x] GREEN: reusable CI and main-only release job; migrate existing version/checksum/draft/publish steps; manual wrapper; maintain emulator tests; update stale private-access wording.
- [x] Run contract tests and full suite; commit `ci: publish the APK built by the verified workflow`.

### Task 7: Integration and handoff

**Files:** verification report in `docs/superpowers/`; all changed code/tests.

- [ ] Run `npm test`, `npm run build`, Python tests; browser/PWA locally when available, otherwise Actions on the PR.
- [x] Fresh whole-branch review, re-grade findings, one RED→GREEN fix pass for important findings; record deferred minors/rulings.
- [ ] Commit report and create PR with `Closes #48` through `Closes #55`; do not merge without request.
- [ ] Observe actual CI results, report remaining infrastructure or real-device limitations.

## Plan self-review

Every spec section maps to Tasks 1–6; Task 7 verifies the whole contract.
Task 4's new schema is consumed by Task 5's strict validation; refreshInference must run before exit validation.
Task 6 cannot be marked verified from YAML inspection alone; actual PR Actions status is required for runtime coverage.

Execution: user requested continuation through implementation after approving the spec; preserve Native continuous execution.
