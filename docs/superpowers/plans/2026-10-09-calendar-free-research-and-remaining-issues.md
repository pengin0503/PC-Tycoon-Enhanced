# Calendar-free research and open-issue follow-through (2026-10-09)

Source: main at 56c024aac7ef5f1f45cb5283f487b865b93144ce.
Workflow: Native / executing-plans, TDD, systematic debugging, verification before merge; no subagents.

## Priority 1: Remove hard release-year locks
- [ ] Add red tests: CPU multicore and AI research available in 2000 when prerequisites, staff and RP exist; GPU/CPU spec choices depend on researched technology, **not** current year; older saves intact.
- [ ] Remove back-end research-year gates and ResearchPanel lock messaging; remove calendar caps from the player's design and option choices. No free/instant technologies: RP and prerequisites remain.
- [ ] Keep 2000-2025 reference tables for comparison and simulating **world market**, but not player invention prohibition; amend misleading tests/docs.

## Issue #32: Allocation and production
- [ ] Test deterministic demand aggregation over active PC/laptop lines, product-level reservations, shortage priority and retail remainder.
- [ ] Calculate dynamic ahead-of-retail assembly protection without eliminating all part retail; show next-day assembly forecast and priority in product detail; retain existing explicit retail/AI allocations.
- [ ] Test internal consumption, AI cluster, daily sales, inventory accounting and save behavior.

## Issues #25 and #33: Balance and research performance
- [ ] Add multi-year deterministic research policies with actual staff/office limits, compare RP supply to rising research cost, and log market-tech gap and key performance trends.
- [ ] Revise source/evidence docs: real product benchmarks as reference envelopes, abstract scores as game metrics, avoid calendar invention restrictions. Calibrate only findings backed by tests.
- [ ] Update/close the remaining issues only when acceptance is genuinely verified.

## Issue #4: Android
- [ ] Repeat signed-configuration validation, CI Android APK build, save/PWA tests. Review feasible lifecycle tests.
- [ ] Keep physical-device checks pending without access to a real device or durable release key.

## Finish
- [ ] Full CI at exact commit (typecheck, unit, E2E, PWA, Android).
- [ ] Merge confirmed green PR; accurately record any pending issue scope.
