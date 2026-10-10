#!/usr/bin/env bash
# Android emulator-only QA. Never uninstall and never use real production signing secrets.
set -euo pipefail
PACKAGE=com.pengin0503.pctycoon
ACTIVITY="$PACKAGE/.MainActivity"
APK="apps/android/android/app/build/outputs/apk/debug/app-debug.apk"
OUT="test-results/android-emulator"
mkdir -p "$OUT"

fail(){ echo "Android emulator QA failed: $*" >&2; adb logcat -d -t 300 >"$OUT/failure-logcat.txt" || true; exit 1; }
adb wait-for-device
adb shell settings put system accelerometer_rotation 0
adb shell settings put system user_rotation 1
test -s "$APK" || fail "initial APK missing"
adb install -r "$APK" || fail "initial install failed"
adb shell am start -W -n "$ACTIVITY" || fail "initial launch failed"
sleep 8
adb shell pidof "$PACKAGE" || fail "process exited after first launch"
adb exec-out screencap -p >"$OUT/first-launch.png" || fail "initial screenshot failed"

# Marker in the app-private data directory verifies an *in-place* upgrade retains Android app data.
# A clean WebView launch may not create the standard files directory yet.
adb shell run-as "$PACKAGE" mkdir -p files || fail "cannot prepare app-private files directory"
# adb shell joins its arguments into one device command line, so the redirect must be quoted for the device shell;
# otherwise it runs outside run-as (in /, without the app's files directory).
adb shell "run-as $PACKAGE sh -c 'echo keep-save-data > files/pct-emulator-upgrade-marker.txt'" || fail "cannot persist debug marker"
adb shell run-as "$PACKAGE" cat files/pct-emulator-upgrade-marker.txt | grep -Fx 'keep-save-data' || fail "marker read failed"

# Same temporary debug signing key in this runner, strictly higher versionCode.
pushd apps/android/android >/dev/null
PCT_VERSION_CODE=1002 PCT_VERSION_NAME=emulator.qa.2 ./gradlew --no-daemon clean assembleDebug
popd >/dev/null
test -s "$APK" || fail "upgrade APK missing"
"$ANDROID_HOME/build-tools/36.0.0/apksigner" verify "$APK" || fail "upgrade signing invalid"
"$ANDROID_HOME/build-tools/36.0.0/aapt" dump badging "$APK" >"$OUT/upgrade-badging.txt"
grep -q "versionCode='1002'" "$OUT/upgrade-badging.txt" || fail "upgrade code incorrect"
adb install -r "$APK" || fail "same-signature in-place update failed"
adb shell run-as "$PACKAGE" cat files/pct-emulator-upgrade-marker.txt | grep -Fx 'keep-save-data' || fail "app data lost during upgrade"

adb shell am force-stop "$PACKAGE"
adb shell am start -W -n "$ACTIVITY" || fail "post-upgrade launch failed"
sleep 4
adb shell pidof "$PACKAGE" || fail "process exited after update"
adb shell input keyevent KEYCODE_BACK
sleep 2
adb shell pidof "$PACKAGE" || fail "Android Back killed game"
adb exec-out screencap -p >"$OUT/back-navigation.png" || fail "Back screenshot failed"

adb shell am force-stop "$PACKAGE"
adb shell svc wifi disable || fail "cannot disable WiFi"
adb shell svc data disable || true
adb shell am start -W -n "$ACTIVITY" || fail "offline launch failed"
sleep 6
adb shell pidof "$PACKAGE" || fail "process exited after offline launch"
adb shell run-as "$PACKAGE" cat files/pct-emulator-upgrade-marker.txt | grep -Fx 'keep-save-data' || fail "data lost on offline relaunch"
adb exec-out screencap -p >"$OUT/offline-relaunch.png" || fail "offline screenshot failed"
adb logcat -d -t 400 >"$OUT/logcat-tail.txt"
echo "PASS emulator install, update without uninstall, app data persistence, Back, offline relaunch"
