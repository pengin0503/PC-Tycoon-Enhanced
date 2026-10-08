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

## F4
- Complete: Dense/MoE and geometry validation, FLOP/time/cost models, total-weight/KV/reserved memory, quantization quality/speed, stock-backed own GPU/server or vendor clusters.
- Training completes/fails deterministically with bounded fictional math/code/knowledge/reasoning/multilingual scores. Preparation shares founder work with research/products; roles remain finite.
- API tokens and subscribers are capacity bounded; power/operations/depreciation, fees/refunds, monthly subscriptions and open-weight brand effects are implemented. Hosted service and training exclusively reserve compute.
- Verified: 75 unit tests and 7 browser tests, strict typecheck/build. Self-review fixes RED→GREEN: private models no longer boost hardware demand; transferred own GPU/server value is included in cluster depreciation while only purchases debit cash.

## F5
- Complete: 3000 reachable technologies with six applied effects in ten domains, seeded expiring market events, bounded research search/filter/pages, financial cash/flow/product/rival analysis, original office/product SVGs and keyed Japanese UI.
- Semantic save audit rejects broken references, duplicate ids, impossible chronology and compute overbooking; corrupt newest slot falls back with an explicit notice.
- Verified: 87 unit tests, 10 browser tests, typecheck/build. Mobile320px behavior and1440px/390px visual screenshots reviewed. Japanese font bundled; empty price edits use an explicit apply action.
- Self-review regressions RED→GREEN: bundled OS sales now allocate license revenue without double counting; OS power research changes responsiveness as well as license cost. Tunable simulation coefficients extracted into content data; existing numeric/replay tests still pass.
- Feature acceptance and original coefficient rationale: FEATURES.md / BALANCE.md. No unpublished original-game equivalence claimed.


## F6 — distribution in verification
- Implemented: production manifest/original icons,6MiB complete shell/font precache, atomic failed-update rollback and deferred activation/readiness UI; Capacitor8.5.3 wrapper, native document export with5MiB limit/safe filename, own launcher/splash, cloud backup disabled.
- Last local gates passed:91 unit tests,10 development browser tests,2 production offline/update tests, strict typecheck/build; native sync copied dist successfully.
- Local Gradle resource processing ran before execution-server connection loss. APK outcome was not retrieved; no local APK success claimed.
- Recovery: retain remote F0–F5 (F5 CI37708621901 success); recover distribution sources via GitHub APIs and pinned official template. Recovered PNG icons are original SVG shapes and get browser decoding checks. CI must verify this recovered tree; temporary lock-sync job only pushes this branch normally, never main.
- Local history (ff6f6f5 PWA plus uncommitted Android) can differ from recovered remote history. Before resuming, fetch/checkout the latest remote feature branch and use its STATUS/history; do not replay old local commits blindly.

Next: observe recovery CI game and Android build/asset/signature gates, fix any reproduced failures, remove temporary lock-sync/write permission, update phase evidence and push. Physical Android launch/touch/picker/restart/browser↔APK JSON round trip remains unverified without a device.

Recovery CI37711303092: game job passed91 unit/10 browser/2 production tests/typecheck/build. Android preparation failed because setup-android defaults to obsolete SDK package tools; explicit platform-tools and pinned command-line tools replace that default. Added appId contract regression against template applicationId=com.getcapacitor.app vs native com.pengin0503.pctycoon; expect RED before correction. Lock36724b4 is synchronized. One-time CI writer/job removed; permanent workflow is read-only.

RED confirmed in CI37711711923: Android package contract received com.getcapacitor.app and expected com.pengin0503.pctycoon (92 passed,1 failed). Corrected Gradle applicationId; APK inspection now checks actual manifest package/min SDK/target SDK in addition to byte-exact assets. Full GREEN run pending.

Browser dependencies stalled in CI37711869252 after unit/typecheck/build GREEN. Permanent CI now downloads the headless Chromium actually used by tests on the Chrome-equipped Ubuntu runner; game and APK builds run independently with15-minute limits. Full browser/Android gates remain required before phase acceptance. Runtime/font upstream notices accompany both distributions.

CI37712399989 on a73fe39 passed93 unit/10 browser/2 PWA/typecheck/build and Android assembleDebug,133 byte-exact web assets, appId/SDK/signature validation; debug APK artifact11521324989. Final source review found native KeepRunning defaults true; lifecycle regression plan/tests added before correction. Do not declare native suspension verified until the new regression and rebuilt APK pass; physical hardware remains unverified.

Native lifecycle RED confirmed in CI37712995749: visible page received day5 after pause instead of day0;10 other browser tests passed. UI now handles document pause/resume with a finite ref and listener cleanup; native KeepRunning=false stops WebView timers. New config regression and APK JSON/XML preference inspection accompany full GREEN gates. No real-time catch-up is added.

CI37713240683:94 unit/11 browser/2 PWA/typecheck/build GREEN and APK compilation succeeded; preference inspection failed because the old inspector expected only textual false. AAPT emits typed Boolean values as (type0x12)0x0 (AOSP ResourceTypes/XMLNode primary sources). Inspector now parses text/typed false and rejects true, even misleading raw text;4 Python encoding regressions added. Native simulation pause fix remains verified by the browser clock test; final APK inspection rerun pending.
