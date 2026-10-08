# Android APK distribution and acceptance

PC Tycoon Enhanced is distributed as a self-contained **Android game APK**, not a public website. It continues to use TypeScript/React rendered locally by Capacitor's Android WebView: **no programming-language migration** is necessary. Vite/Chromium smoke tests remain internal development tools; the app requires no live server while playing.

## Development APK
1. Open the current Android-first branch's successful GitHub Actions `verify` run and download `pc-tycoon-debug-apk`.
2. Unzip the artifact. Sideload `app-debug.apk` with Android's install-unknown-apps permission for the chosen file manager.
3. Keep in mind: an Actions runner's **debug keystore is ephemeral**. Rebuilding in a different run may change the signing certificate. Android will reject installing a differently signed APK over the existing package. Back up your game JSON before switching builds. Avoid uninstalling unless the backup has been verified.

## Persistent release signing (required for future upgrades)
Create an Android signing keystore **on a trusted local machine** and back it up securely. Do not commit it to Git or attach the private key to a public issue. Maintain the same keystore and alias across updates; losing it or changing it can prevent in-place upgrades.

Configure repository Actions secrets before manually running `Android release APK` workflow from a branch where the workflow is available:
- `PCT_ANDROID_KEYSTORE_BASE64`: base64 of the entire private keystore file, no newlines
- `PCT_ANDROID_KEYSTORE_PASSWORD`: the keystore's password
- `PCT_ANDROID_KEY_ALIAS`: alias of the Android signing key
- `PCT_ANDROID_KEY_PASSWORD`: key password

The workflow runs strict tests and signs `app-release.apk`. Its `PCT_VERSION_CODE` uses the workflow run number, so each new signed release has a higher version code *within that workflow*. Never decrease the version code when changing workflows or importing existing installs. The workflow does not trigger on normal pushes and will not produce a signed release without configured secrets.

**Debug versus release:** Android treats the debug certificate and your release certificate as different signing identities. Export JSON before switching from an existing debug installation to release; a simple overwrite may be rejected. A stable release certificate is necessary for seamless upgrades. Never commit a signing keystore into the repo.

## On-device acceptance before declaring production complete
- Device/Android version/WebView version, orientation on phone and tablet; device back, home and multi-window handling.
- First launch, all nine main screens and nested subpages, research search/pagination, product sliders, GPU visual tier, CPU design → manufacture → sale, PC building, OS virtual desktop, AI training, finances and market.
- Tap targets, keyboard showing/hiding, immersive system bars, file pickers, dark theme, text readability and 844×390 / 960×540 / portrait fallback.
- Save, terminate process and restart, imported malformed JSON leaves current state unmodified, export/import backup, activity pause/resume prevents unearned simulation days.
- Offline airplane-mode start/restart, no external network dependencies, low-memory/WebView lifecycle.
- Release signing reproducibility, version increments, signing-key backup, in-place upgrade from a prior **release signed with the same key**.

Debug artifact success and browser tests do **not** equal physical-device certification. No credentials are required to produce the debug APK but a persistent signing key is mandatory for updateable release APKs.
