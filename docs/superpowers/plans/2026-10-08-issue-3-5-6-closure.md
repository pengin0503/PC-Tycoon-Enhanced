# Outstanding Issues #3, #5, #6 — TDD implementation (2026-10-08)
> REQUIRED SUB-SKILL: superpowers:executing-plans, test-driven-development and verification-before-completion. No subagent-driven development.
**Goal:** Preserve version-1 saves while accounting for actual production inventory cost, retaining acquired components in existing BOMs and keeping a reliable notification inbox.
**Authority:** GitHub issues #3, #5, #6 and previously approved Android-first gameplay design.
**Architecture:** In simulation, only actual inventory units may be consumed and assigned cost, which becomes cost-of-goods-sold on sale. Re-key acquired components atomically into player stock and relink owned PC designs. Use notification sequence IDs with capped save-persisted inbox, mark-read command and lightweight React drawer; choice-required modal stays separate.
**Global constraints:** No force push. Keep deterministic state replay and legacy v1 saves. Never claim actual Android device acceptance, release production signing or physical upgrade verification without a real device and stable credentials.
### Task 1 Inventory accounting (#3)
- [ ] RED: tests for changing rival quotes; legacy cost fallback; weighted average sale
- [ ] GREEN: add optional product inventory value with lazy legacy valuation, and transfer inventory cost for own components.
- [ ] CI: typecheck and Vitest.
### Task 2 Acquired BOM relinking (#5)
- [ ] RED: test acquisition of supplier and continuing assembly from acquired stock, with cash conservation
- [ ] GREEN: compute assembly overhead before remapping, transfer inventory and preserve acquired ID mapping.
- [ ] CI: simulation tests and save round trip.
### Task 3 Persistent notification inbox (#6)
- [ ] RED: notices persist and are acknowledged without duplicate IDs.
- [ ] GREEN: capped sequence inbox + read cursor, non-blocking filters, HUD badge and notification center drawer.
- [ ] CI: browser tests and full suite.
### Task 4 QA boundaries (#4)
- [ ] Inspect release workflow and check available Android CI validations; add evidence-backed, actionable real-device and signing verification checklist.
- [ ] Keep issue #4 open until physical acceptance and stable keystore checks are completed.
### Task 5 Closure
- [ ] Full CI including APK; review diff; only close issues proven by tests. Merge fix PR into main upon success.
