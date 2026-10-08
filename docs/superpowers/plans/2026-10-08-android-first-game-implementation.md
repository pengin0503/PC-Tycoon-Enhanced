# Android-first APK implementation plan — Native executing-plans

Source: docs/superpowers/specs/2026-10-08-android-first-game-design.md
Use Superpowers; no subagents. TDD / systematic-debugging / verification-before-completion. Commit incremental changes to branch feat/android-first-game-20261008, do not merge main.

1. Add focused UI navigation tests proving Android landscape 844x390 chrome is fixed, hardware Design/Products tabs are exclusive, research page size is bounded, management and AI sections are independently navigable, and save screen remains accessible. Run CI and observe RED.
2. Add shared typed PanelPages and dual-view Design/Products shell. Change HardwarePanel, DevicesPanel, ManagementPanel, AIPanel, OSPanel, FinancePanel to use explicit sub-tabs while preserving local React state and commands. Update existing browser tests to select the relevant tab before hidden operations; test RED→GREEN.
3. Shrink and fix game chrome, make main content a viewport-constrained pane with local scrolling only. Research results 12/page. Add independent status/activity panes and top back/scroll reset behavior. Test 844x390, 960x540, 390x844 clipping and navigation.
4. Android-only APK finalization: keep existing Java/Capacitor, add full-screen treatment with safe insets, back dispatch to JS and app-level handler using hash history, avoid breaking native save export/import. Add back-event Playwright test. Regenerate debug APK using GitHub CI; inspect build, signature, file assets; write instructions and physical-device checklist.
5. Full verification: npm typecheck, tests, build, e2e, PWA tests (regression only), Android debug assemble/inspect. Record actual results, CI artifact ID and known hardware/production signing gates. Push and PR against visual branch only, no automatic merge or force push.
