# F3 Management Implementation Plan
> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans; Native and author phase review; no subagents.
**Goal:** A constrained company competing against autonomous firms, with staffing, ten offices, factories, advertising, acquisitions and difficulty.
**Architecture:** Defaulted management/save fields extend the pure engine. All expenses, inventory and financing flow through validated commands; competitors have separate cash, PRNG, research and product states.
**Tech Stack:** Existing TypeScript/Zod/React/Vitest/Playwright.
**Spec:** docs/superpowers/specs/2026-10-08-pc-tycoon-enhanced-foundation-design.md
## Global Constraints
- オフィス10段階。
- 従業員、資金、研究、設備、製造枠は共有する有限資源。
- 複数競合が製品を開発し、独立した在庫・資金・研究・価格戦略を持つ。
- 難易度は需要変動・競合効率・開始資金・借入条件・研究費等に作用し、既存セーブの難易度と独立に保存する。
## Review Focus
- Staff/facility caps and insufficient funds reject without partial spending (Task 1).
- Training raises real work and payroll; idle campaigns cannot spend unavailable funds (Task 1).
- Loans are separate from overdue obligations; interest and repayment are explicit (Task 1).
- Rival transitions never borrow player cash/seed or create negative inventory (Task 2).
- Acquisition pays valuation once, transfers assets, and prevents duplicate acquisition (Task 2).
### Task 1: Facilities staff and financing
**Files:** packages/content/src/management.ts; packages/sim/src/{management,schema,hardware,index}.ts; tests/management.test.ts.
**Interfaces:** office{level}, factory{level}, hire{role,skill}, train{id}, marketing{budget}, borrow{amount}, repay{amount}. officeLevel/factoryLevel/staff/advertising and company.loan default into older saves. Monthly bill = office + factory + payroll + OS support + loan interest; monthly history snapshots.
- [ ] Tests all ten office capacities/costs are distinct, upgrade limit/affordability, worker slots, research speed and payroll effects, training cap, advertising budget consumption and demand recognition, loan cap/interest/repayment, saved difficulty.
- [ ] `npm test -- tests/management.test.ts` → RED.
- [ ] Implement content coefficients, commands and weekly/monthly work/expense hooks.
- [ ] `npm test && npm run typecheck` → PASS.
- [ ] Commit `feat: add staff facilities and company financing`.
### Task 2: Autonomous rivals acquisition and UI
**Files:** packages/content/src/management.ts; packages/sim/src/{rivals,management,hardware,index,schema}.ts; apps/web/src/ManagementPanel.tsx; App.tsx; tests/rivals.test.ts; tests/management.spec.ts; STATUS.
**Interfaces:** Rival cash/seed/researchLevel/researchRemaining/products/efficiency/acquired; daily produce, weekly research/develop/sell, monthly design/price; acquire{id}; valuation(state,id): number; companyValue(state): number; market share statistics.
- [ ] Tests 180-day rivals research/design/produce/sell without negative finances, deterministic save continuation, hard rivals faster, player price affects competitor strategy/share, acquisition transfers cash/stock/technology exactly once, insufficient funds unchanged. Browser upgrades and hires/trains/markets on mobile.
- [ ] Unit/browser test commands → RED.
- [ ] Implement finite competitor strategies and valuation; responsive operations/market/finance panels with meaningful commands.
- [ ] Full unit/typecheck/build/browser gates → PASS; self-review.
- [ ] Commit `feat: add autonomous competition and acquisitions`; STATUS and nonforced push.
## Self-review
Loans and overdue debt separated to keep authorized credit usable. New saves start three rivals; old saves default no rivals and remain deterministic. F4 shared AI roles prepared, without model functionality. Interface and all five failure classes covered.
