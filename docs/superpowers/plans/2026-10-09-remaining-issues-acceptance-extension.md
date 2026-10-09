# Remaining Issue Acceptance Extension — 2026-10-09

> **Execution:** Native / superpowers:executing-plans; red-green TDD, systematic-debugging on failures, verification-before-completion; no subagents.
> **Source of truth:** main 25292f3c37a3f6fdb03c02e9e8aafc422f960bf5, not a permanent pinned SHA.

**Goal:** Progress #25 (multi-decade sustainable policy evidence), #33 (source-anchored relative hardware performance), #4 (real Android emulator QA). Keep physical-device owner-signed acceptance open.

**Architecture:** Keep simulation free of hard invention dates. Add deterministic management-policy tests, add a vetted separate source/field calibration table rather than invent absolute equipment caps, run Android emulator installs on a separate GitHub workflow and preserve independent human device checklist.

**Tech Stack:** TypeScript/Vitest/Playwright, Java/Capacitor, Android Gradle, GitHub Actions.

**Spec:** Existing issue #25/#33/#4 descriptions and docs/dev/HISTORICAL_HARDWARE_CALIBRATION.md; docs/android/DEVICE_ACCEPTANCE.md.

## Global constraints
- Player research and player new design depend on RP, prerequisites, employees, and research field ranges only—not calendar date.
- Avoid breaking old saves, inventory/revenue accounting, or compatibility.
- Release-signing secrets never committed. Emulator smoke != real device acceptance.
- Preserve all existing validations/CI; never conceal failing checks.

## Tasks
### Task 1: Long-horizon economic policy (#25)
- [ ] Add deterministic 30/50-year policy with periodic office upgrades, additional R&D staff, optional hardware development/retail income, consistent survival and year-by-year RP/tech/cash/rival snapshots.
- [ ] Verify red case (new helper/API not implemented) in CI.
- [ ] Implement smallest supporting helper/policy; run all tests; record observations, including limitations and any genuine balance regressions.

### Task 2: Referenced performance curves (#33)
- [ ] Source manufacturers' launch/spec pages for 2000/2002/2005/2025 CPU/GPU, SSD, PSU, monitor; quantify physical vs fictional game fields and uncertainty in a source table.
- [ ] Add red performance/cost/energy/calibration tests across 7 categories and boundary years; keep unvalidated high-end/typical caps tagged as estimates.
- [ ] Implement only precise, supportable bug fixes to reference models; avoid artificial player research locks.
- [ ] Run tests and record evidence.

### Task 3: Android emulator functional QA (#4)
- [ ] Add test for emulator workflow/QA script behavior (including no uninstall, stable signing within build, persistent files, launch and back).
- [ ] Build dedicated PR-triggered emulator workflow with Android 36 image, debug APK, API <=35 emulator, ADB installation/update/restart/airplane, emulator-generated artifacts and fail-fast signals.
- [ ] Verify red/green CI and APK/signing; document what can only be checked on real device and persistent user key.

### Task 4: Review, integrate and report
- [ ] Typecheck, Vitest, Playwright E2E, PWA, Python, Android and emulator workflow verification.
- [ ] Review changed files and boundaries, fix critical flaws; merge only if full required checks green.
- [ ] Update issues with precise completed/remaining criteria; close only when whole issue acceptance satisfied.
