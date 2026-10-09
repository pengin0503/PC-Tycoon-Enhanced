# Android APK distribution and acceptance

PC Tycoon Enhanced is distributed as a self-contained **Android game APK**, not a public website. It continues to use TypeScript/React rendered locally by Capacitor's Android WebView: **no programming-language migration** is necessary. Vite/Chromium smoke tests remain internal development tools; the app requires no live server while playing.

## Local build during GitHub Actions billing restrictions

If GitHub-hosted workflows cannot start because of an account payment failure or an Actions spending limit, an Actions re-run cannot fix the issue. See [billing diagnosis and complete Windows local verification](../dev/ACTIONS_BILLING_AND_LOCAL_VERIFICATION.md). On a Windows 11 development PC with Node.js 24, Python 3, JDK 21 and Android SDK 36:

```powershell
pwsh -NoProfile -File tools/verify-local.ps1
```

After the selected checks pass, the locally signed **debug** APK is at `apps/android/android/app/build/outputs/apk/debug/app-debug.apk`. GitHub Release publishing still requires a separately approved and verified publication process; a local success does **not** turn GitHub Actions check statuses green, establish Android emulator success, or guarantee compatibility with an APK signed using another keystore. Export and verify the game's JSON save before any install that may require removing the previous app.

## Development APK
1. Open the current Android-first branch's successful GitHub Actions `verify` run and download `pc-tycoon-debug-apk`.
2. Unzip the artifact. Sideload `app-debug.apk` with Android's install-unknown-apps permission for the chosen file manager.
3. Keep in mind: an Actions runner's **debug keystore is ephemeral**. Rebuilding in a different run may change the signing certificate. Android will reject installing a differently signed APK over the existing package. Back up your game JSON before switching builds. Avoid uninstalling unless the backup has been verified.

## GitHub Releases: automatic Debug APK prereleases (no signing secrets)

**Default distribution:** After each successful `main` push, `.github/workflows/android-release.yml` builds a Debug APK signed automatically by Android's temporary CI debug keystore, verifies the APK contents, Android version metadata and signature, and creates a GitHub prerelease. `workflow_dispatch` can also run the same release workflow from `main`. Neither JDK signing-key generation on the owner's PC nor any `PCT_ANDROID_*` GitHub Actions secret is required.

Release tags are generated automatically as `v<package.json version>-beta.<release workflow run number>`, for example `v0.1.0-beta.1`. Each successful run gets a distinct tag, so normal pushes to `main` do not require manual tagging. The Release includes:

- `PC-Tycoon-Enhanced-v0.1.0-beta.1.apk` — **direct APK download** (no Actions ZIP extraction).
- `PC-Tycoon-Enhanced-v0.1.0-beta.1.apk.sha256` — checksum for verifying file integrity.

The tag, Android `versionName`, and release APK filename agree; Android `versionCode` equals that workflow's run number. The workflow publishes a draft only after tests and APK/signature validation succeed, checks the two uploaded assets, then makes the prerelease visible. If the build or tests fail, the publish step does not run. The repository is **private** and requires authorized GitHub sign-in to view and download Releases: <https://github.com/pengin0503/PC-Tycoon-Enhanced/releases>.

### Installation and update limitations

Even for free private apps, Android **requires an APK signing certificate**; the temporary debug keystore provides it automatically. APK signing is **not encryption or anti-extraction**. Because each GitHub runner may produce a different debug signing certificate, **in-place upgrades are not guaranteed**; Android may report an incompatible package/signature. Before installing a newer prerelease, **export the game save to a JSON file and verify that backup**. If Android requires the existing app to be uninstalled, that operation can erase its data. After reinstalling, re-import the JSON save. Merely increasing `versionCode` cannot bypass Android's same-signature requirement.

The experimental persistent-signing setup script `tools/setup-android-signing.ps1` remains available but is **not needed** for Debug prereleases. Switching in future to a permanent release-signing certificate will also require a JSON save export/import migration from existing Debug installations.

### Versioning

The prerelease tag derives from `package.json` plus the workflow run number. To start a new version series, bump the package version on `main` (for example `0.1.0` to `0.2.0`). Each successful subsequent `main` push produces a unique prerelease and direct APK asset without any manual GitHub tag or external signing secrets.

## On-device acceptance before declaring production complete
- Device/Android version/WebView version, orientation on phone and tablet; device back, home and multi-window handling.
- First launch, all nine main screens and nested subpages, research search/pagination, product sliders, GPU visual tier, CPU design → manufacture → sale, PC building, OS virtual desktop, AI training, finances and market.
- Tap targets, keyboard showing/hiding, immersive system bars, file pickers, dark theme, text readability and 844×390 / 960×540 / portrait fallback.
- Save, terminate process and restart, imported malformed JSON leaves current state unmodified, export/import backup, activity pause/resume prevents unearned simulation days.
- Offline airplane-mode start/restart, no external network dependencies, low-memory/WebView lifecycle.
- Debug APK signing certificate and version inspection, JSON save export/import after reinstall, and versioned direct GitHub Releases assets.

Debug artifact success and browser tests do **not** equal physical-device certification. No credentials are required to produce the debug APK but a persistent signing key is needed for reliably updateable release APKs, but **not** for the automatic Debug prereleases.
