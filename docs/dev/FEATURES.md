# Feature acceptance map

2026-10-08 author review against the approved foundation design. IDs and public provenance follow that document's Steam/Google Play/Insignis links; no additional claims about unpublished original mechanics. Artwork, companies, catalog and formulas are original. All file paths below are relative to the repository.

| ID | Implemented behavior / primary source | Verification |
|---|---|---|
| PC-01 | CPU cores/clock/IPC/process/socket; `sim/src/hardware.ts` | `hardware.test.ts`, `hardware-market.test.ts`, mobile `hardware.spec.ts` |
| PC-02 | GPU units/clock/VRAM/bandwidth, AI cluster use and commercial AI demand | hardware tests; `ai-clusters.test.ts`, `ai-business.test.ts` |
| PC-03 | Board socket/RAM generation/slots/features and pricing | hardware and devices tests |
| PC-04 | RAM capacity/speed/generation with costs | hardware and devices tests |
| PC-05 | Storage capacity/speed with costs | hardware and devices tests |
| PC-06 | Laptop parts, cooling, appearance, price; `sim/src/devices.ts` | `devices.test.ts`; shared mobile builder |
| PC-07 | Monitor resolution/refresh/gamut/appearance | hardware and devices tests |
| PC-08 | Gaming/office/server weighted compatible assembly, own/vendor inventory | `devices.test.ts` (including no double payment) |
| PC-09 | OS version/features/quality/compatibility/support/license, bundled PC revenue allocation | `os.test.ts` |
| PC-10 | Fictional files/settings/browser/calculator desktop | `devices.spec.ts` interactive calculator |
| PC-11 | 3000 reachable nodes: ten domains, six branches, ten generations × five stages | `content.test.ts`: graph and effects; `content.spec.ts`: late-node navigation |
| PC-12 | All ten office levels, staff/research capacities and costs | `management.test.ts` |
| PC-13 | Factory shared finite production/capacity/cost changes | market and management tests |
| PC-14 | Recruiting/training skill, salary, finite shared work | management and AI business tests |
| PC-15 | Advertising costs/awareness/decay/reputation and demand | management tests |
| PC-16 | Three independent seeded rivals research/design/produce/sell/reprice | `rivals.test.ts` |
| PC-17 | Valuation, affordability, one-time cash/debt/stock/technology transfer | rivals tests |
| PC-18 | Monthly cash/flows/share, product gross profit, rival comparison and events | `content.spec.ts`, `FinancePanel.tsx`; engine accounting tests |
| PC-19 | Normal/hard capital, demand, research cost, rival efficiency and credit | foundation/management/rivals tests |
| PC-20 | Engine and saves have no server dependency | `save.test.ts`; production offline acceptance is tested in offline.pwa.ts |
| AI-01 | Dense/MoE, total/active, layers/hidden, attention/context | `ai-math.test.ts` numeric and geometry boundaries |
| AI-02 | Tokens/quality/diversity/budget/time, preparation and seeded failure | AI math/business tests |
| AI-03 | Own/vendor GPU/server stock, VRAM, network/cooling, capex/power/depreciation | AI cluster/math tests |
| AI-04 | Five saturated, explicitly fictional scores | AI math/business tests; `ai.spec.ts` |
| AI-05 | Weight/KV/reserved memory, bits/context/batch/speed/quality | AI math/business tests |
| AI-06 | API/subscription capacity, price competition, fees/refunds, public weights | AI business tests and mobile API workflow |
| AI-07 | Own compute, shared workers/research, commercial AI hardware demand/brand | AI cluster/business tests |

`packages/` prefixes apply to `sim/src/…`; tests are under `tests/`. UI is under `apps/web/src/`. F5 gates: 87 unit tests, 10 browser tests, strict typecheck and production build. Desktop1440px/mobile390px screenshots reviewed; Japanese font is bundled. 320px horizontal overflow, keyboard and hidden-page timing are browser-tested. Browser emulation is not Android hardware verification.

F6 software gates accepted: production offline/update browser tests and signed debug APK with133 byte-exact web assets, manifest and native pause preference verification. Latest suite:94 Vitest/6 inspector/11 browser/2 PWA tests, typecheck/build. Physical Android launch, touch/WebView/storage/background/picker and APK↔browser JSON transfer remain unverified. CI evidence is in STATUS.md.

## PC Tycoon 2 parity extension (2026-10-08)

Design: `docs/superpowers/specs/2026-10-08-pct2-parity-design.md`. Original mechanics beyond the public store text/update notes are not claimed to match.

| ID | Implemented behavior / primary source | Verification |
|---|---|---|
| P2-01 | PSU component, optional PSU slot with wattage headroom; CPU cache; factory 13 levels — `sim/src/hardware.ts`, `devices.ts` | `pct2-components.test.ts`, `pct2-ui.spec.ts` |
| P2-02 | Launch reviews (5 axes, 4 fictional outlets, stars), fans, presentations/hype, benchmarks — `sim/src/reception.ts`, `benchmark.ts` | `pct2-reception.test.ts`, `hardware.spec.ts` |
| P2-03 | Research points (instant unlock), distribution network, bulk offers + counter, acquisition bids, candidates/search/traits/firing — `sim/src/business.ts` | `pct2-business.test.ts`, `pct2-ui.spec.ts`, `management.spec.ts` |
| P2-04 | OS features (security/media/games/store), requirements, lock screen/theme, hacker attacks, installer/lock/desktop preview — `sim/src/os.ts` | `pct2-os.test.ts`, `devices.spec.ts`, `pct2-ui.spec.ts` |
| P2-05 | Modes (standard/tycoon/long/sandbox), hard-mode game over, achievements, rename/logo — `sim/src/progress.ts` | `pct2-progress.test.ts`, `pct2-ui.spec.ts` |
| P2-06 | PC Tycoon 2-style flow UI: office home, develop tiles → designer, products + launch presentation → review, upgrades, HR, companies, stats/achievements | all `*.spec.ts` |
| P2-07 | One research branch per specification, split specs (motherboard USB/storage ports/LAN, storage read/write, monitor size/panel/response/brightness, CPU L1–L3), node-priced production cost and power, uncapped reviews, discontinue, rival fans transferred on acquisition, value-based loan cap, full-screen offer pause, per-type product stats — economy version 4 (`docs/dev/BALANCE.md`) | `balance-features.test.ts`, `balance-features.spec.ts`, `content.test.ts`, `research-hints.test.ts` |
| P2-08 | Year-2200 research tier (100-stage sliders, final bounds about 2–4× the year-2100 ones), calendar industry sockets and company-developed CPU sockets, rival line-up retirement, multi-stage research with recommendations and slider research links, per-kind monthly sales with margins and discontinuation hints — economy version 5 (`docs/dev/BALANCE.md`) | `advanced-tier.test.ts`, `sockets.test.ts`, `rival-retirement.test.ts`, `research-shortcuts.test.ts`, `sales-stats.test.ts`, `advanced-tier.spec.ts`; opt-in `long-horizon-2200.test.ts` |

Excluded by decision: gems, login rewards, daily quests, slot/lottery, season pass, seasonal events, online leaderboards, cloud sync. Art remains original SVG; no original-game assets are used.
