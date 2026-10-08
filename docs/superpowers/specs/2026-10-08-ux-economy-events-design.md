# Android UX, pricing, sourcing and decision events — Design (2026-10-08)
Status: user-directed extension of the approved Android-first design. Implement against `feat/android-first-game-20261008`; do not merge its ancestor PRs or reset saves.
## Intent
Landscape Android touch game, with accessible 50–150% persistent UI scale, compact symbol-led time controls, scrollable research, contextual technical help, product-quality-derived price bounds, vertically integrated AI GPU procurement and servers, rival-component sourcing, launch notices, and explicit consequence-bearing decision events.
## UX
- Scale 50–150 in 10-point increments; default 100; saved in local device preferences independent of game saves. Transform the entire UI, restore focusable controls and preserve bounded internal scroll. Scaling must not rewrite game data.
- All six timeline control buttons remain accessible by spoken labels; render symbols for pause, play, accelerate, +1 day, +30 days and save.
- Research results are independently touch-scrollable beneath sticky filters and pagination even for small landscape viewports.
- Hardware sliders and specification selects have touch-accessible help explaining in-game units versus physical technology; do not suggest exact real-world IPC/technology.
- Pricing bounds are calculated by the shared simulation helper from cost, performance, reliability, appearance, and product category. Enforce new price edits and design commands at the simulation boundary; do not reject historical saved products solely for their old prices.
## Procurement and simulation
- AI cluster purchases must use a released, actively manufacturing player-owned GPU and its actual physical stock. Do not allow static third-party AI accelerators. The existing vendor-server fallback may remain; player-made server PC must be built from selectable own/vendor/rival parts and physically manufactured, with one server consumed when assigned.
- Rival parts appear in CPU/GPU/board/RAM/storage slots only after the competitor's product becomes available. Respect socket/memory matching. On production, available rival inventory is consumed and rival cash/revenue/profit credited; player pays procurement cost. No free duplicate supply. Stock may run out, pausing build.
- Generic vendor inputs remain purchasable per built device as an early-game fallback.
- Competitor launch events log exactly once when development finishes, not at design kickoff. Non-choice events use non-blocking notices; market choices use blocking full-scene modal only until answered. Choices are serialized; accept/decline modifies money and temporary demand or production. No modal for observational events.
## Compatibility, verification, and risk
- Keep `version:1` saves and optional schema field defaults; deterministic seeds and replay. Ensure validation resolves historically referenced competitor components even if the rival is later acquired, avoiding invalid saves.
- TDD for sim pricing, sourcing, AI restrictions, decisions, launch. UI automated checks for zoom, scrolling and modal/narration. Run typecheck, Vitest, browser UI, APK CI. Android device acceptance remains separate.
- Forecast cost of older PCs is a snapshot; changes in supplier quotation affect actual manufacturing payments. A future accounting refinement could store weighted-average input cost per output inventory.
