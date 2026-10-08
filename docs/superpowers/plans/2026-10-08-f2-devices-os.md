# F2 Devices and OS Implementation Plan
> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans, Native; no subagents.
**Goal:** Compatible purpose-specific PCs/laptops, monitors and commercial OS with an interactive fictional desktop.
**Architecture:** Resolve own or catalog parts through the same compatibility evaluator; device and OS designs join existing product development/market. OS licensing affects bundled device capability and service costs.
**Tech Stack:** Existing strict TypeScript/Zod/React/Vitest/Playwright.
**Spec:** docs/superpowers/specs/2026-10-08-pc-tycoon-enhanced-foundation-design.md
## Global Constraints
- ノートPC・デスクトップ・サーバー: パーツ互換性を守り用途別スコアを付与。
- 操作テストはゲーム内で描画する架空デスクトップ。
- 初期言語は日本語、内部文字列はローカライズ可能なキー管理。
- UI非依存の決定論的TypeScriptエンジン。
## Review Focus
- Wrong part kind/socket/memory generation must reject (Task 1).
- Unavailable own component or unreleased OS must reject (Task 1).
- Invalid OS version/features/quality and monitor fields reject (Task 2).
- OS digital sales must pay per-license/support costs, no inventory fabrication (Task 2).
- Desktop apps obey OS feature/compatibility rules and work on touch widths (Task 2).
### Task 1: Devices and monitors
**Files:** packages/content/src/{devices,research}.ts, packages/sim/src/{devices,hardware,schema,index}.ts, tests/devices.test.ts.
**Interfaces:** assemble{kind:pc|laptop,name,parts:{cpu,gpu,motherboard,ram,storage},purpose:gaming|office|server,appearance:graphite|silver|teal,price,osId?}; design monitor with resolution/refresh/gamut/appearance. evaluateDevice(state,parts,purpose,kind,osId?) returns performance/power/unitCost. Vendor Atlas/DDR4 baseline parts permit early assembly.
- [x] Write tests: valid gaming/office/server scores differ, bad socket/generation/wrong kind/missing component reject, laptop cooling limits performance and raises cost, display resolution/refresh/gamut affect cost/performance; save/replay equal.
- [x] `npm test -- tests/devices.test.ts` → RED.
- [x] Implement root pc/laptop/monitor research gates and immutable validated products.
- [x] `npm test && npm run typecheck` → PASS.
- [x] Commit `feat: add compatible devices and monitors`.
### Task 2: OS and playable panels
**Files:** packages/sim/src/{devices,schema,hardware,index}.ts, apps/web/src/{DevicesPanel,OSPanel,ProductCards}.tsx, App.tsx, tests/os.test.ts, tests/devices.spec.ts.
**Interfaces:** developOS{name,version,features:[files|calculator|browser],quality,compatibility,support,price}; osApps(product): string[]; OS quality/compatibility scales bundled PC score and license demand. Desktop files/settings/calculator/browser are game windows, never host execution.
- [x] Tests: research gate, positive licensing cashflow with cost, higher quality affects PC performance, version increase and invalid/duplicate features reject; browser develops OS, launches and calculates 2+3=5, mobile layout fits.
- [x] `npm test -- tests/os.test.ts` and `npm run test:e2e -- tests/devices.spec.ts` → RED.
- [x] Implement OS development/version/support, manufacturing/digital-sales integration, part/appearance forms and fictional desktop.
- [x] Full suite/typecheck/build/e2e → PASS; self-review.
- [x] Commit `feat: add OS business and virtual desktop`; STATUS and nonforced push.
## Self-review
Interfaces agree with existing Product lifecycle; stored specs include part IDs and purpose/appearance. Public baseline parts are original data. Both physical and digital sales are tested. F3 operating-company depth remains a separate plan.
