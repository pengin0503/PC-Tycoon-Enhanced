# PC Tycoon Enhanced — Android Game

Independent **offline Android company-management game** with Japanese UI, original 3D-look product illustrations, research, hardware design, PC assembly, management and fictional AI/LLM development.

## Technology
The gameplay engine is strict **TypeScript** and remains deterministic. The UI uses React/Vite bundled locally in the **Capacitor Android APK**. Android-specific fullscreen, Back handling and file export are implemented in a small Java host. The WebView is an internal renderer: a public website or PWA is **not** the delivery target.

## Play / build
- Install the APK artifact from a successful GitHub Actions **verify** run, named `pc-tycoon-debug-apk`. Debug signatures change between CI runners: export JSON before replacing an existing install. Keep backups.
- Node 24+ and Java 21/Android SDK 36: `npm ci`, `npm run android:build`. This creates `apps/android/android/app/build/outputs/apk/debug/app-debug.apk`.
- For upgradeable signed release APKs, configure a **persistent keystore** and use the manual Android release workflow (see [APK distribution and acceptance](docs/android/APK_DISTRIBUTION.md)). Never commit signing keys.
- Verification: `npm run typecheck`, `npm test`, `npm run build`, `npm run test:e2e`, `npm run android:verify`. The browser harness only enables automated UI regression tests; it is not supported as a separate player distribution.

## Modules and data
`packages/sim` deterministic game state, `packages/content` gameplay data, `packages/save` backwards-compatible versioned JSON, `apps/web` bundled render UI, `apps/android` APK host. Game time advances through player actions or foreground timers only. The save file is local: keep periodic JSON exports, especially before signing identity changes. No real AI models are trained.

See [Android design](docs/superpowers/specs/2026-10-08-android-first-game-design.md) and [Android acceptance](docs/android/APK_DISTRIBUTION.md). Physical-device acceptance remains separate from green CI.
