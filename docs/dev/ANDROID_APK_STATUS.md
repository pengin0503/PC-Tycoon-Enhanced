# Android-first APK implementation — verification ledger (2026-10-08)

## Source
- Work branch: `feat/android-first-game-20261008`, based on `feat/landscape-visual-design-20261008` at `7420776`.
- Specification: `docs/superpowers/specs/2026-10-08-android-first-game-design.md`.
- Implementation plan: `docs/superpowers/plans/2026-10-08-android-first-game-implementation.md`.
- Final verified commit: `eeac160ecb25863d0f492aa2f67c5a0b00109889`; source of truth is current branch head at assessment.
- Main has not been modified. No overwrite or force-push performed.

## Completed changes
- Landscape-first Android game without top-level page scrolling: fixed HUD and menu, nested tab navigation and independently scrollable workspaces.
- Product design/list split (hardware and assembled PC), research results limited to 12/page, Management/AI/OS/Finance split into functional local subpages, retained save/export and all simulation features.
- Android full-screen system-bar handling in existing Java/Capacitor host, Back dispatch into UI, orientation request and responsive fallback.
- Original offline bundled product images preserved; bundled assets can be played without remote server.
- Stable release signing mechanism with externally supplied keystore credentials and manual workflow, no private keys checked into repository. Version code derived from workflow run number; release signing cannot be validated without a real external key. Developer debug-signing certificate may differ between runners. Updated readme and distribution/acceptance guide.
- Existing tests adjusted for intentionally hidden inactive sections; new tests cover Android screen switching, research pagination, screen containment and native Back handling.

## Confirmed tests, exact source
GitHub Actions run **37721315126**, SHA `eeac160e` (2026-10-08):
- `game`: success; `npm run typecheck`, `npm test`: **97 passed, 17 Vitest files**, Python tests **6 passed**, `npm run build`, `npm run test:e2e`: **17 passed**, `npm run test:pwa`: **2 passed**.
- `android`: success; `npm run android:build`, `npm run android:verify`: **133 bundled assets** matched production output and no remote server; `apksigner verify`: **APK signature v2 verified**.
- Debug APK artifact ID **11525348322**, name `pc-tycoon-debug-apk`, ZIP payload 9,018,204 bytes.
- File integrity SHA256 reported for debug APK: `64ffca4370e980a64ae2a5ca43fd8bf8d8c9dda56120a1e1ffd1432dd3d38964`.
- Workflow URL: https://github.com/pengin0503/PC-Tycoon-Enhanced/actions/runs/37721315126

## Gates not certified
- Android real-device testing, touch, keyboard/IME resize, actual system Back, rotations, restarts/offline operation, file provider/save import/export.
- Real stable signed `assembleRelease` run (requires owner's persistent signing secrets; no secrets were accessed/configured).
- In-place upgrade from previous stable release on device. Debug and release signing are different identities.
- Public release, store publication, and merges; this branch is a PR candidate only.

## TDD/history
Prior partial commits intentionally showed RED for changed UI and release signing expectations. Actions runs preceding 37721315126 showed failures from old browser tests, restricted research interactions, release-test marker, and transient Gradle dependency errors. Latest complete run above is green for current head. Future changes require a new complete CI verification before claiming completion.
