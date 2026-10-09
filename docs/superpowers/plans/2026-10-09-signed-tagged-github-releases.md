# Signed tagged GitHub Releases — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. No subagents.

**Goal:** Push a trusted `vX.Y.Z` tag to build one consistently signed, versioned Android APK and attach it directly to a GitHub Release, not a ZIP artifact.

**Architecture:** Extend the existing fail-closed manual signed-APK workflow with tag triggering, package/tag version validation, Android manifest version propagation, signature and version inspection, and `gh release create` with a direct APK asset. Keep the keystore outside source control in GitHub Actions secrets. Do not create a release or a tag until the owner configures persistent signing secrets.

**Tech Stack:** GitHub Actions, Gradle, Capacitor 8, Node 24, Vitest, Python APK verification, GitHub CLI.

**Spec:** Approved in-chat option B (signed release, stable signing key, versioned APK and changelog; preserve user saves).

## Global constraints
- Repository source of truth: latest `main` on task start; implement in an isolated branch.
- Release tags strictly `vMAJOR.MINOR.PATCH`; match root package.json version.
- Android `versionName` equals tag without prefix; `versionCode` increases with the release-workflow run number.
- Require all four current `PCT_ANDROID_*` signing secrets; never log or commit the keystore.
- Verify exact offline assets, package metadata and signer BEFORE public release action.
- Private repository releases remain restricted by repository access.
- Do not publish a tag or signed APK without owner-provided permanent signing credentials.

## Review Focus
- Tag package mismatch / malformed tags must stop before signing.
- Missing/empty signing credentials must fail without unsigned fallback.
- Release APK must have consistent manifest versionName and monotonically increasing code.
- Re-running the same tag must not overwrite a previously published asset unexpectedly.
- Newly installed release key cannot update an existing debug APK; require JSON backup and explain signing continuity.

### Task 1: Validate release identity

**Files:**
- Create: `tools/release_version.mjs`
- Create: `tests/release-version.test.ts`
- Modify: `apps/android/android/app/build.gradle`

**Interfaces:** `validateReleaseTag(tag:string, packageVersion:string):string` returns the version number without `v`, or throws. CLI reads root `package.json`, prints validated version for the workflow.

- [ ] Add tests for exact match `v0.1.0`, mismatch, malformed, prerelease, and injection strings.
- [ ] Run tests RED (missing module), then implement and run GREEN.
- [ ] Gradle reads `PCT_VERSION_NAME` for `versionName` and retains existing debug fallback.
- [ ] Commit scoped changes.

### Task 2: Signed publish workflow

**Files:**
- Modify: `.github/workflows/android-release.yml`
- Modify: `tests/android-release.test.ts`

**Interfaces:** Existing four secrets and `PCT_VERSION_CODE`; new `PCT_VERSION_NAME`; tag-triggered signed `gh release create` with `PC-Tycoon-Enhanced-vX.Y.Z.apk` and checksum.

- [ ] Add static regression assertions for tag trigger, token permissions, validation, version checks, keystore fail-closed gate, and direct Release asset upload; run RED.
- [ ] Implement tag-only workflow, full game verification, signed release build, APK verification, checksum, and publish gate; run GREEN.
- [ ] Do not publish on release-test branches or without tag/credentials.

### Task 3: Documentation and remote verification

**Files:**
- Modify: `docs/android/APK_DISTRIBUTION.md`

- [ ] Document exact 4 Actions secrets, stable key backup, version bump, tag push, Releases direct asset, upgrade safety, and first-release manual requirements.
- [ ] Run full TypeScript/Vitest/Python/build/E2E/PWA and Android-debug build via CI, inspect logs and commit statuses.
- [ ] Integrate only passing changes without force push; report any unperformed signed-release test due to missing owner secret.
