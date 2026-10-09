# Verification when GitHub Actions cannot start due to billing

Last checked: 2026-10-09. Repository: `pengin0503/PC-Tycoon-Enhanced`, PR #36.

## Confirmed blocker

GitHub check annotations (supplied by repository owner, both `game` and `android` jobs) say:

> The job was not started because recent account payments have failed or your spending limit needs to be increased. Please check the 'Billing & plans' section in your settings.

The failure occurs **before checkout or any CI step**. This is an account-level GitHub-hosted runner/billing restriction, not a TypeScript, Android, dependency, or app-signing failure. Rerunning the workflow or changing an unrelated YAML line cannot repair a failed payment or insufficient Actions spending allowance. Do not bypass mandatory checks and then present the PR as CI-verified.

**Owner action:** In GitHub, open profile menu → Settings → Billing & plans. Inspect pending/failed payments and payment method, current Actions usage and applicable budget/spending limit. Settle a failed charge or adjust the applicable Actions budget if desired. The organization/account that owns the private repository may have separate billing controls. After GitHub allows new jobs to start, re-run both `verify` and `Android emulator acceptance` against the **latest** PR commit, and require actual job steps + passing results. The GitHub connector cannot alter account billing or payment details.

## Windows 11: run the repository's verification locally (no GitHub Actions)

Prerequisites:
- Clone the private repository with GitHub credentials and check out the head branch of PR #36: `fix/remaining-issues-balance-calibration-android-qa-20261009`.
- PowerShell 7 (`pwsh`), Git, Node.js **24**, Python **3**, network access to download package dependencies and Chromium if they are not already installed.
- For Android: **JDK 21** and Android Studio/SDK with platform **android-36**, build-tools **36.0.0** and the Gradle wrapper's Android dependencies. Set `ANDROID_HOME` if SDK is not at `%LOCALAPPDATA%\Android\Sdk`. A physical phone is not required for APK assembly.
- Disk space for Android SDK/Gradle and Playwright. Internet is required for initial dependency installation; “local” means the build and tests execute on the owner's PC, not necessarily network-free.

From **the repository root** in PowerShell 7:

```powershell
git fetch origin
git switch fix/remaining-issues-balance-calibration-android-qa-20261009
git pull --ff-only
pwsh -NoProfile -File tools/verify-local.ps1
```

This runs `npm ci`, TypeScript typecheck, **all Vitest unit tests**, signing helper validation (without creating/uploading secrets), Python unittest discovery, web build, Playwright Chromium install, E2E and PWA tests; then synchronizes Android assets, builds the **debug APK**, compares packaged web files, validates native APK structure and verifies the Android signing certificate.

To pin the result to the **exact reviewed commit**, use the SHA from `git rev-parse HEAD` with `-ExpectedCommit`. The script stops if the checkout moved. It also stops on the first failing native command, so a failed test is not hidden behind a later successful step:

```powershell
$sha = (git rev-parse HEAD).Trim()
pwsh -NoProfile -File tools/verify-local.ps1 -ExpectedCommit $sha
```

When Android SDK/JDK are not available, use **partial** checks only:

```powershell
pwsh -NoProfile -File tools/verify-local.ps1 -SkipAndroid
```

For a quick repeat after `npm ci` and Playwright setup, `-SkipInstall` avoids reinstalling Node dependencies. `-SkipBrowser` omits E2E/PWA, but **must not be described as a full verification**. All optional skips are reported.

A successful Android run prints the debug APK's exact path and SHA-256:

`apps/android/android/app/build/outputs/apk/debug/app-debug.apk`

**Never uninstall a user's existing installed app without a verified game-save JSON export.** A local Android debug key, GitHub runner debug key and production release key can be different. Android may reject upgrading an APK signed by a different certificate; a matching versionCode does not fix that.

## What this does not substitute for

Local unit/E2E/APK success proves the tested checkout, but does not make blocked GitHub Actions green and does not establish Android emulator acceptance. The Linux `tools/android-emulator-smoke.sh` scenario currently needs a functioning emulator runner. Its reported app-private `files` directory failure has a code fix in PR #36, but a **post-fix emulator execution remains unverified**. The real-device swipe/IME/Back/screens, save upgrade, and persistent owner-controlled signing checklist in `docs/android/DEVICE_ACCEPTANCE.md` also remains mandatory for closing Issue #4.

## Before merging PR #36

1. Confirm exact PR head SHA and absence of unexpected changes.
2. If GitHub Actions remains blocked, preserve local results separately and explicitly mark hosted CI as unavailable; do not remove requirements or pretend a payment error equals a passing check.
3. Restore billing/runner access, run `verify` + `Android emulator acceptance` on that exact head and check each job result (the previous last normal-CI green SHA is not the current script-fix SHA).
4. Only then merge the PR and confirm the merged `main` ref. Keep Issue #4 open until real-device and stable release-key requirements are independently met.
