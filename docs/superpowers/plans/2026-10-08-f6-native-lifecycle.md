# F6 Native Lifecycle Regression Plan
> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans; Native, no subagents, author review.
**Goal:** Native background/picker suspension never advances simulation time; resume adds only future ticks.
**Architecture:** Capacitor8.5.3 emits document pause/resume events. UI combines these with visibilityState. Cordova KeepRunning=false pauses WebView timers; verify the preference reaches the APK, including generated native config XML.
**Tech Stack:** Existing React refs, Capacitor preferences, Playwright clock, APK aapt inspection.
**Spec:** foundation design common time rules and UI background suspension.
## Global Constraints
- バックグラウンド実時間を勝手に換算しない。
- 非表示の間は進行を停止する。
## Review Focus
- Default SDK KeepRunning=true does not satisfy suspension; selected-document callbacks must also pause UI ticks.
- No elapsed real-time catch-up and no new simulation/browser coupling.
### Task1: Lifecycle pause
**Files:** apps/web/src/App.tsx; apps/android/capacitor.config.ts; tests/{browser.spec,android-config.test}.ts; tools/verify_apk.py; STATUS.
**Interfaces:** Ref tracks native pause/resume; timer requires visible and unpaused. Native KeepRunning string false is serialized into the shared config and Android XML.
- [ ] Add clock regression dispatching pause/resume while document is visible; CI browser test → RED for unwanted tick.
- [ ] Add finite visibility ref/listeners with cleanup, set native timer preference and test config/APK serialization.
- [ ] Full unit/typecheck/build/browser/PWA and signed APK asset/manifest/preference gates → GREEN.
- [ ] Author review, feature commit/nonforced push, STATUS with remaining physical-device validation.
## Self-review
Official Bridge defaults KeepRunning=true; MockCordovaWebViewImpl emits pause/resume and pauses timers only when false. This is a confirmed source-level native lifecycle gap, distinct from still-unverified physical devices.
