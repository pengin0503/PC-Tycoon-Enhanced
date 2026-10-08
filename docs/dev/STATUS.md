# Development status — 2026-10-08

Branch: `feat/f0-f6-implementation-20261008`. Approved source: `docs/superpowers/specs/2026-10-08-pc-tycoon-enhanced-foundation-design.md`; user approval overrides its older review-waiting label. Native Superpowers execution, author reviews, no subagents. Main read at start and final verification: `af9461a`; no merge or force push. SHAs below are historical evidence, not a main pin.

| Phase | Implemented / acceptance | Remote phase evidence |
|---|---|---|
| F0 | Deterministic immutable seeded engine, integer economy/debt, validated/migrated JSON and atomic IndexedDB, responsive shell/CI | `71dcc3e`; initial22 unit/3 browser |
| F1 | Five components, prerequisite research, design/launch/shared finite manufacture/stock/pricing/seeded sales; profitable180-day CPU fixture | `af2ee78`;41 unit/4 browser |
| F2 | Compatible gaming/office/server PC and laptops, own/vendor inventory, appearances, monitor specs, OS versions/support/licensing and interactive virtual desktop | `68425dd`;49 unit/5 browser |
| F3 | Ten offices, factory/hiring/training/advertising/credit/history; independent seeded rivals and one-time acquisitions | `b8f8c12`;57 unit/6 browser |
| F4 | Dense/MoE/geometry, compute/memory/time/cost/quality, stock-backed clusters, deterministic training, API/subscription/public models and hardware integration | `d42847c`;75 unit/7 browser |
| F5 | 3000 reachable applied technologies, expiring events, content coefficients, save reference audit/recovery notice, research navigation/financial analysis/original visuals/keyed Japanese/bundled fonts | `01344a5`;87 unit/10 browser |
| F6 | Production offline PWA plus signed debug APK implemented and software-verified; physical Android acceptance remains open | Code `7ebd31b`; latest gates below |

## Latest verified evidence
- Code: `7ebd31b812edaa078d300e569813e05b9aa7ead5`. [CI37714208589](https://github.com/pengin0503/PC-Tycoon-Enhanced/actions/runs/37714208589) completed successfully.
- Strict TypeScript and production Vite build passed;94 Vitest tests,6 Python APK-inspector tests,11 development browser tests,2 production offline/update tests passed.
- Engine/save tests cover deterministic continuation, economic/stock boundaries, migration/invalid imports, meaningful research graph/effects and LLM Dense/MoE/memory/cost/capacity/quality.
- Chromium desktop/mobile320–390px, keyboard, hidden/native pause/resume, research pagination, OS applications, AI commercialization, save/JSON and disconnected new-game/reload/update workflows verified. Japanese-font390px/1440px screenshots reviewed in F5.
- Android Java21/SDK36/Gradle8.14.3 assembleDebug passed. APK has133 byte-exact current web assets, no remote server, appId `com.pengin0503.pctycoon`, minimum SDK24/target36, KeepRunning=false in JSON and compiled XML, and valid v2 debug signature.
- Artifact `pc-tycoon-debug-apk`, ID11523092081, 9008169 bytes (ZIP); APK SHA256 `582466a11d5982def58877ee6ac38ebf096d46b1198bfc48873cd1091f52ec6a`. Runtime/font notices are included.

## Resolved review findings / failures
- RED→GREEN: bundled OS revenue allocated once; private AI models no hardware boost; own compute asset value included in depreciation; empty price drafts require explicit apply; corrupt newest save recovers with notice.
- Native lifecycle RED reproduced unwanted day5 after pause. UI pause/resume guard and native timer suspension corrected it; no wall-time catch-up.
- Recovery CI initially failed on obsolete SDK tools package and template appId mismatch. Explicit SDK packages and application identity regression fixed both.
- APK inspector failed on typed Boolean/default XML namespace. Actual APK dump replay and negative cases now cover bare/default/qualified names and true/false encodings; final verification passed without bypassing checks.
- Local execution server disconnected during Gradle resource processing. Recovered source via GitHub APIs/pinned Capacitor8.5.3 template; one-time lock-sync job removed. Current CI is read-only. Earlier local history may differ; remote feature history is authoritative.
- Coefficients/feature mapping and fixture limitations: BALANCE.md / FEATURES.md. Human long-term balance and unpublished original-game equivalence are not claimed. CI action Node20 deprecation warnings are recorded; no unrelated upgrade work.

## Remaining / resume
F0–F5 accepted. F6 PWA/debug APK software gates accepted; Android physical-device gate is **unverified**, as allowed by the design.
1. Fetch latest main and existing remote feature branch/history; use this status, not old local commits. Do not duplicate completed features or merge into main.
2. On a real Android device, install the CI debug APK; with networking disabled test first launch/new game, touch/keyboard/insets, every screen, background/picker suspension, save/close/reopen.
3. Browser→APK and APK→browser JSON transfer must preserve equal continuation; malformed import and storage failure must preserve the prior game.
4. Record device/OS/WebView and results. Add reproduction tests for any failure; commit fixes by feature and push normally. Release signing/store publication have not been performed.

## PC Tycoon 2 parity extension — 2026-10-08
Branch `claude/gallant-curie-k0htkq` from `main` `f80a509`. Spec: `docs/superpowers/specs/2026-10-08-pct2-parity-design.md` (user approved scope G1–G5 and a closer-to-original UI flow; private use only).
- Engine: G2 components, G1 reception, G3 business, G4 OS security, G5 progression. Save stays `version:1`; every new field is optional/defaulted and legacy JSON loads.
- Intentional behavior changes: research spends research points and completes instantly (no cash, no slots); tech count 3040 → 3345 (PSU domain); one AI test now checks seeded failure across seeds.
- UI rebuilt around the original game's flow with original SVG art; browser tests updated to the new navigation.
- Local verification: typecheck, 142 Vitest, 29 Playwright, 2 production PWA, 6 Python, production build. Android physical-device acceptance remains unverified.
