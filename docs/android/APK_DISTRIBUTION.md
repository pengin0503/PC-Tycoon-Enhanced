# Android APK distribution and acceptance

PC Tycoon Enhanced is distributed as a self-contained **Android game APK**, not a public website. It continues to use TypeScript/React rendered locally by Capacitor's Android WebView: **no programming-language migration** is necessary. Vite/Chromium smoke tests remain internal development tools; the app requires no live server while playing.

## Development APK
1. Open the current Android-first branch's successful GitHub Actions `verify` run and download `pc-tycoon-debug-apk`.
2. Unzip the artifact. Sideload `app-debug.apk` with Android's install-unknown-apps permission for the chosen file manager.
3. Keep in mind: an Actions runner's **debug keystore is ephemeral**. Rebuilding in a different run may change the signing certificate. Android will reject installing a differently signed APK over the existing package. Back up your game JSON before switching builds. Avoid uninstalling unless the backup has been verified.

## Signed versioned GitHub Releases (direct APK assets)

Pushing a trusted, stable Git tag matching root `package.json` (e.g. `v0.1.0` for `"version": "0.1.0"`) automatically runs `.github/workflows/android-release.yml`. It tests the game, builds a **signed release APK**, verifies the signature, packaged assets, Android `versionName`/`versionCode`, and publishes a GitHub Release. The Release contains **PC-Tycoon-Enhanced-v0.1.0.apk**, downloadable directly without unzipping, and **PC-Tycoon-Enhanced-v0.1.0.apk.sha256**. The release page contains generated change notes. The repository is private: users must have repository access to download.

### One-time owner setup — persistent Android signing identity

1. On a trusted local machine with JDK installed, create a unique dedicated release keystore. Example:
   ```sh
   keytool -genkeypair -v -keystore pc-tycoon-release.jks -storetype PKCS12 -alias pc-tycoon -keyalg RSA -keysize 3072 -validity 10000
   ```
   Keep this keystore and its passwords in an encrypted backup **outside the repository and GitHub**. Losing them prevents seamless upgrades from APKs signed by this key. Do not upload them to issues, chats or source control.
2. Go to repository **Settings → Secrets and variables → Actions → New repository secret**. Set these exact four secrets:
   - `PCT_ANDROID_KEYSTORE_BASE64`: base64 representation of the entire .jks file, without newlines.
   - `PCT_ANDROID_KEYSTORE_PASSWORD`: keystore password.
   - `PCT_ANDROID_KEY_ALIAS`: `pc-tycoon` (or the alias actually used).
   - `PCT_ANDROID_KEY_PASSWORD`: key password (for PKCS12 commonly the store password).
3. On Windows, create the base64 value locally in PowerShell:
   ```powershell
   [Convert]::ToBase64String([IO.File]::ReadAllBytes('C:\secure\pc-tycoon-release.jks')) | Set-Clipboard
   ```
   Paste only into the corresponding **GitHub Secret** field. Never paste it into a chat or a workflow run input. No secret is required to be stored in plaintext in the repository.
4. Restrict who may create `v*` tags using repository rulesets where available. Only the owner/trusted maintainers should issue releases.

The signing workflow checks for all four secrets **before** decoding/building. Missing secrets fail the job and produce **no** GitHub Release. The keystore exists only under the isolated GitHub runner's temporary directory and is deleted in an always-run cleanup step. A GitHub-managed release token with `contents:write` is used only in the release job.

### Publish a new version

1. Update `package.json` to the intended new stable version, commit the change and wait for main CI to pass.
2. On the trusted maintainer machine, tag that main commit (example for the current package version):
   ```sh
   git checkout main
   git pull --ff-only origin main
   git tag v0.1.0
   git push origin v0.1.0
   ```
3. GitHub Actions starts **Android signed GitHub Release** on the tag push. Release tags must match exactly `vMAJOR.MINOR.PATCH`, without suffixes or leading zeros, and must match `package.json`. Version mismatch or malformed tag fails before signing or publishing.
4. Wait for successful completion, then open **Releases** from the repository sidebar or visit the releases page. Download `PC-Tycoon-Enhanced-vX.Y.Z.apk` directly from **Assets** (not the Actions ZIP).
5. Verify the APK's SHA-256 against the accompanying `.apk.sha256` file if transferring the artifact outside GitHub.

Android `versionName` is exactly the tag version without `v`; the integer `versionCode` increases with the run number **of this release workflow**. Do not reset this workflow or publish releases with a versionCode less than that of any already-installed APK. Publishing an already-existing tag is intentionally not an asset-overwrite operation: the publishing step will fail instead of silently replacing a previous Release.

### Upgrade safety and device acceptance

The debug APK produced by the ordinary `verify` workflow is signed with a temporary debug key. **It cannot be updated in place by the permanent release-signed APK**. Export the in-game save to JSON and independently verify the backup *before* uninstalling or switching signing identities. Do not assume the save survives uninstall. Once installed using the permanent release key, subsequent versions signed with exactly the same keystore/alias and an increasing `versionCode` can be installed as in-place upgrades.

Successful CI and a valid signature do **not** replace Android physical-device tests. Test an actual in-place upgrade, save persistence and touch controls before calling the version production-certified.

## On-device acceptance before declaring production complete
- Device/Android version/WebView version, orientation on phone and tablet; device back, home and multi-window handling.
- First launch, all nine main screens and nested subpages, research search/pagination, product sliders, GPU visual tier, CPU design → manufacture → sale, PC building, OS virtual desktop, AI training, finances and market.
- Tap targets, keyboard showing/hiding, immersive system bars, file pickers, dark theme, text readability and 844×390 / 960×540 / portrait fallback.
- Save, terminate process and restart, imported malformed JSON leaves current state unmodified, export/import backup, activity pause/resume prevents unearned simulation days.
- Offline airplane-mode start/restart, no external network dependencies, low-memory/WebView lifecycle.
- Release signing reproducibility, version increments, signing-key backup, in-place upgrade from a prior **release signed with the same key**.

Debug artifact success and browser tests do **not** equal physical-device certification. No credentials are required to produce the debug APK but a persistent signing key is mandatory for updateable release APKs.
