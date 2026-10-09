# Android physical acceptance — issue #4

Status: **BLOCKED ON PHYSICAL TEST DEVICE AND OWNER-CONTROLLED RELEASE SIGNING**. CI-generated debug APK and browser tests are *not* substitutes for device acceptance. Do not mark #4 completed without attached physical device evidence.

## Prerequisites
- Android phone/tablet and USB debugging (ADB), device Android version and WebView version recorded.
- Previously installed production-signed APK, if testing upgrade; **never uninstall before exporting and independently checking the game save JSON**.
- Production keystore **owned and backed up outside GitHub**. The same alias/certificate is required across release upgrades. Do not commit private keystore/password into repository.

## Evidence record
Record device manufacturer/model, Android build, WebView version, orientation and effective resolution, APK SHA-256, signing certificate digest, versionCode, game revision and tester date. Attach redacted results to #4. Do not upload keys or sensitive user saves.

## Installation and signing
1. Export an existing game from the app, verify its JSON file opens independently and keep a backup off the device.
2. Run `adb devices -l` and `adb shell getprop ro.build.version.release`.
3. Inspect candidate signature: `apksigner verify --verbose --print-certs app-release.apk`; record the *public certificate* digest and compare it with the previous **release**, not debug, APK.
4. Check versionCode: `aapt dump badging app-release.apk` and ensure the new value increases versus the currently installed release.
5. Run `adb install -r app-release.apk` to verify an upgrade **without uninstalling**. If installation fails with signature or version downgrade errors, preserve the device and collect the exact installer message. Never bypass by uninstalling an app containing unexported saves.
6. Run `adb shell dumpsys package com.pengin0503.pctycoon` and check package version; launch and import the verified backup if needed.

## Manual UI / simulation acceptance
Test at minimum 844×390 and 960×540 equivalent landscape layouts, plus narrow portrait recovery:
- Nine game destinations, nested tabs, Research vertical swipe, pagination and search; UI 50%, 100%, 150% with controls accessible at each level.
- Core/IPC help text and sliders; custom CPU/GPU and server assembly; competitor component availability, prices, supplier stock depletion and acquisition continuity.
- Hardware manufacture/sale, old-save import and persistence after force-stop/restart.
- AI Lab only with own produced GPU and optional self-assembled server, GPU stock decrement.
- Rival release notifications, notification filters/unread marking/restart persistence; choice event occupies screen and pauses timeline until decision.
- System Back and text field keyboard behavior, home/resume without simulation catch-up, screen cutout/safe-area, offline airplane-mode reboot, JSON document picker/export.
- Poor/no network, low-memory app process restoration, repeated landscape rotation and accessibility focus/readable labels.

## Completion gate
- CI game tests and Android APK assembly, APK structure and signature verification green on a specified commit;
- Successful real-device in-place update and data persistence with one stable owner-managed signing key;
- Device captures and test observations recorded in Issue #4.

Until all these are met, the release should remain debug/QA status and #4 must remain open.

## Android emulator regression QA (PR #36, 2026-10-09)

`.github/workflows/android-emulator-qa.yml` runs an API 35 emulator for Android app, web, or simulation changes. It builds a **debug** APK with versionCode 1001, installs and launches it, writes a sentinel inside the app-private files directory, then builds 1002 with the same runner's temporary debug signing key and installs it **with `adb install -r` (no uninstall)**. It verifies sentinel retention, force-stops/relaunches, dispatches Android Back, disables Wi-Fi/data, and checks offline relaunch. Screenshots, package metadata and logcat tails are uploaded as CI artifacts.

This verifies platform install/lifecycle behaviour within that one CI runner; it does **not** guarantee UI accessibility, game-save JSON correctness, document picker operation, WebView IME handling, background task timing, or actual phone/tablet touch performance. The temporary runner debug signing key will **not** match the key from other CI runs; permanent key ownership and release upgrades remain an outstanding separate requirement. Treat emulator failure as a blocker for affected PRs, and do not close Issue #4 until the real-device evidence checklist above is fulfilled.
