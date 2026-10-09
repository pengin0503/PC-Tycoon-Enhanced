# Open Issue Remediation — execution plan (2026-10-09)

**Source of truth:** latest main when branched, `15434d4e2839ea3471112b220c07fa6e40cd9b24`.
**Execution:** Superpowers Native / executing-plans; TDD and systematic-debugging; no subagent-driven-development.
**Goal:** close verifiable software issues while clearly separating physical-device and long-term empirical acceptance.

## Task 1 — UX (#26, #27)
- [ ] Add failing UI/regression tests for price entry and non-overlapping portrait notice.
- [ ] Support exact numeric price input (without altering generic sliders); place notice below mobile HUD through computed CSS or bottom above dock.
- [ ] Run typecheck, Vitest, Playwright.

## Task 2 — Vendor parts (#24)
- [ ] Add tests for 2000 pinned vendor IDs and late-era generated vendor parts with compatible boards/RAM.
- [ ] Implement a deterministic time-indexed vendor catalog with immutable year-specific IDs, and preserve legacy part resolution.
- [ ] Integrate designer, assembly, production costing and stored-build evaluation.
- [ ] Run tests and save round-trip validation.

## Task 3 — Inventory (#32)
- [ ] Test typed retail/assembly/AI allocations, default old saves, in-house assembly and cluster accounting.
- [ ] Add allocation command, UI, and daily sale/production/AI rules; preserve old behavior unless configured.
- [ ] Test determinism and negative/oversize rejection.

## Task 4 — Market share (#31)
- [ ] Test bounded daily category- and owner-attributed sales ledger, date windows, acquisition snapshots, old saves, and no-sales state.
- [ ] Add 30-day / 360-day / cumulative and category filters; label as simulation-only, not global market.
- [ ] Run UI and save tests.

## Task 5 — Historical caps, long-horizon test (#33, #25)
- [ ] Preserve primary sources in historical note, annotate inferred versus factual values.
- [ ] Add calendar-constrained creation limits and technical precedent tests where verified; preserve stored products.
- [ ] Run 30-year/100-year deterministic tests and record outcomes, blockers, any balancing changes justified by data.

## Task 6 — Android QA (#4)
- [ ] Re-run existing Android build, signing-config, lifecycle, PWA/E2E jobs.
- [ ] Record physical-device-only checks as explicitly pending; do not claim completion without hardware evidence.

## Finish
- [ ] Inspect branch diff, run full GitHub Actions, fix failures.
- [ ] Merge verified PR to main, close only issues with fulfilled acceptance criteria; document remaining work on open issues.
