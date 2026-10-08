# UX / Economy / Events Implementation Plan (2026-10-08)
> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans; work task-by-task (no subagent-driven-development). Confirm RED tests, implement, rerun and commit.
**Goal:** Ship the approved Android usability + sourcing + pricing + decision features while keeping version-1 save compatibility.
**Architecture:** Simulation commands and Zod schemas are authoritative; React panels are projections of state. CSS local scroll and device-local UI preferences do not change game saves.
**Tech Stack:** TypeScript, React 19, Zod, Vitest, Playwright, Capacitor/Android.
**Spec:** docs/superpowers/specs/2026-10-08-ux-economy-events-design.md
## Global constraints
Keep Android first landscape, no native rewrite; base on Android-first feature branch (main is docs only); preserve version:1 and determinism; no force push.
## Review focus
Stale vendor/competitor stock, acquisition of source rival, save import of old models, repeated same-day launch notices, UI scale extremes/short landscape, research nested touch scroll.
## Tasks
### Task 1: Deterministic pricing, quotes and rival sourcing
- [ ] Write failing simulation tests for dynamic price band quality/performance, price command out-of-range, rival parts compatibility and actual inventory/cash transfer, nonbreaking old save.
- [ ] RED verify, implement pricing helper and source/production accounting in sim, GREEN verify.
### Task 2: AI Lab vertical GPU production restriction
- [ ] Write failing tests for rejected external GPU/inactive production, owned GPU and server inventory consumption.
- [ ] RED, modify cluster purchase and AI UI, GREEN.
### Task 3: Choice events and launch notices
- [ ] Write failing tests for once-only competitor release events, decision outcomes and save replay.
- [ ] RED; update event logic/schema and modal/notices; GREEN.
### Task 4: Landscape scale, research scroll, terms and pricing UI
- [ ] Write browser tests for touch-scroll viewport, icon accessible names, 50–150 scale preference and glossary disclosure.
- [ ] RED; update controls, stylesheet and price editor; GREEN.
### Task 5: Whole branch verification and audit
- [ ] Run typecheck, Vitest and Playwright; inspect CI APK; create narrowly scoped GitHub issues for issues outside requested features (avoid duplicates).
- [ ] Record residual risk and update PR; do not silently merge or publish release.
