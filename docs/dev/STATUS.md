# Development status

Branch: `feat/f0-f6-implementation-20261008`. Base main: `af9461a` (read at start, not pinned for future sessions).
Design: `docs/superpowers/specs/2026-10-08-pc-tycoon-enhanced-foundation-design.md`; approved by user 2026-10-08 despite older review-waiting label in the document. Native execution; no subagents; no merge/force push.

## F0
- Engine complete: seeded deterministic immutable commands, daily/weekly/monthly ticks, integer finances and insolvency debt.
- Saves complete: validated v1, v0 migration, atomic IndexedDB slots, JSON limits and errors.
- Browser shell complete: Japanese responsive forms, pause/1x/7x, immutable commands, autosave/manual save, slots and JSON transfer.
- RED→GREEN: foundation 16 tests, saves 6 tests. Typecheck passed after specifying IDBDatabase Promise type.
- Browser RED observed for absent setup form; Chromium full-browser process blocked by sandbox Unix sockets, headless-shell works. E2E uses explicit loopback host (sandbox denies network interface inventory).

## Remaining / resume
F0 verified: 22 unit tests, 3 browser tests, strict typecheck and production build. Self-review against F0 acceptance: passed; author review per user constraints. No major findings. Build regression: removed empty CSS data URL import rejected by PostCSS; build now passes.
## F1
- Complete: 15 prerequisite-bearing research nodes, five component design families, weekly development, finite shared production, stock, launch/pricing, seeded weekly demand, product revenue/gross profit.
- Verified: 41 unit tests and 4 browser tests; typecheck/build passed. CPU business reaches positive cash growth in the 180-day integration fixture. Save continuation produces identical sales.
- Phase self-review: no major findings; all invalid inputs and finite-money production cases covered.

## F2
- Complete: CPU socket/RAM-generation compatibility; gaming/office/server PCs and laptops, vendor or own parts (own inventories consumed once), independent appearances, monitor display specs.
- OS complete: versions, selected applications, quality/compatibility/support, licensing and monthly support costs, bundled-device performance effects, interactive virtual files/settings/browser/calculator.
- Verified: 49 unit tests, 5 browser tests, strict typecheck and production build.
- Ruling: balanced components can have equal rounded purpose scores; purpose-weight test now uses an intentionally CPU-heavy configuration. Distinctness for every balanced configuration was an invalid test assumption.
- Self-review: passed phase acceptance and numeric/compatibility boundaries; author review. Android remains unverified.

## F3
- Complete: ten distinct office levels, factory capacity/costs, skill-based hiring/training/payroll, finite research slots, weekly advertising, loans/interest/repayment and monthly financial history.
- Three competitors have independent cash/debt, PRNG, research, development, inventory, sales and pricing. Acquisitions transfer cash/stock/technology once. Difficulty affects capital, research cost, credit and competitor efficiency.
- Verified: 57 unit tests, 6 browser tests, typecheck and production build. Self-review passed.
- Ruling: overdue obligations remain `debt`; permitted borrowing is `loan`, so borrowed money can be spent and interest is visible.
- Balance regression: autonomous competition made the default CPU 180-day cash fixture fall to 494160. Increasing fictional CPU demand 60→70 restored this playable profitable path; same test RED→GREEN, whole suite passed.
- Fixed schema declaration order caught by suite (rival schema referenced money before initialization).

Next: F4 plan (LLM simulation, shared compute, training, inference and business). F4–F6 unimplemented.
