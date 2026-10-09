# Android APK distribution and acceptance

PC Tycoon Enhanced is distributed as a self-contained **Android game APK**, not a public website. It continues to use TypeScript/React rendered locally by Capacitor's Android WebView: **no programming-language migration** is necessary. Vite/Chromium smoke tests remain internal development tools; the app requires no live server while playing.

## Development APK
1. Open the current Android-first branch's successful GitHub Actions `verify` run and download `pc-tycoon-debug-apk`.
2. Unzip the artifact. Sideload `app-debug.apk` with Android's install-unknown-apps permission for the chosen file manager.
3. Keep in mind: an Actions runner's **debug keystore is ephemeral**. Rebuilding in a different run may change the signing certificate. Android will reject installing a differently signed APK over the existing package. Back up your game JSON before switching builds. Avoid uninstalling unless the backup has been verified.

## Signed versioned GitHub Releases (direct APK assets)

Pushing a trusted, stable Git tag matching root `package.json` (e.g. `v0.1.0` for `"version": "0.1.0"`) automatically runs `.github/workflows/android-release.yml`. It tests the game, builds a **signed release APK**, verifies the signature, packaged assets, Android `versionName`/`versionCode`, and publishes a GitHub Release. The Release contains **PC-Tycoon-Enhanced-v0.1.0.apk**, downloadable directly without unzipping, and **PC-Tycoon-Enhanced-v0.1.0.apk.sha256**. The release page contains generated change notes. The repository is private: users must have repository access to download.

### One-time owner setup — Windows and a permanently reusable signing key

For private, personal use, the simplest approach is to register the same release key **once**, then publish future APK updates with new version tags. Android still requires APK signing even for private distribution. Never post a keystore or password in a chat or commit it to Git.

**Prerequisites:** Install JDK 21 (`keytool` on PATH) and GitHub CLI (`gh`), and open PowerShell in a fresh local clone of this repository. Authenticate once with `gh auth login` (choose GitHub.com and a browser login with repository administration access). You do not need Play Store enrollment.

From the repository root, run this one-time command in Windows PowerShell:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\setup-android-signing.ps1
```

The script:

1. Checks GitHub CLI access, required permissions, and existing signing secrets. It refuses to overwrite any signing secrets by default.
2. Creates `pc-tycoon-release.jks` under your Windows **Documents/PC-Tycoon-Enhanced-Signing** folder if it doesn't exist, or reuses the same file on subsequent runs. It refuses to generate a different key if Releases already exist.
3. Prompts for the keystore password privately and verifies that the alias and password actually open the keystore.
4. Requires confirmation that **an independent backup of the .jks and password** has been made before configuring secrets. Losing this key prevents future in-place upgrades.
5. Registers the following four Actions Secrets using GitHub CLI's encrypted repository secret API and private process stdin; it never puts a secret value into the command line, terminal output, clipboard, repository, or a temp credentials file:

   - `PCT_ANDROID_KEYSTORE_BASE64`
   - `PCT_ANDROID_KEYSTORE_PASSWORD`
   - `PCT_ANDROID_KEY_ALIAS`
   - `PCT_ANDROID_KEY_PASSWORD`

The release workflow retains no private keystore after the isolated runner finishes. Do not rerun setup with a newly generated keystore once you have shipped a release. If the first setup partially fails, **reuse the original keystore** and rerun with `-AllowReplace`; do not regenerate it. You can instead configure the four repository secrets manually under [Settings → Secrets and variables → Actions](https://github.com/pengin0503/PC-Tycoon-Enhanced/settings/secrets/actions).

**Stop point:** The assistant's GitHub connector cannot administer Actions Secrets and cannot access your local signing keystore, so the one-time script must be executed on your trusted PC. No publish/tag operation should occur until the four secrets are confirmed.

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
