<#
Run PC Tycoon Enhanced's game and debug-APK verification locally, without GitHub-hosted Actions.
Requires PowerShell 7, Node.js 24, Python 3, and (unless skipped) JDK 21 + Android SDK 36.
The Android emulator/device manual acceptance remains separate.
#>
[CmdletBinding()]
param(
    [switch]$SkipInstall,
    [switch]$SkipBrowser,
    [switch]$SkipAndroid,
    [string]$ExpectedCommit = ""
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
$onWindows = [Environment]::OSVersion.Platform -eq [PlatformID]::Win32NT
$npm = if ($onWindows) { "npm.cmd" } else { "npm" }
$npx = if ($onWindows) { "npx.cmd" } else { "npx" }

function Invoke-Checked {
    param(
        [Parameter(Mandatory)][string]$Label,
        [Parameter(Mandatory)][string]$Program,
        [Parameter(Mandatory)][string[]]$CommandArgs
    )
    Write-Host "=== $Label ==="
    & $Program @CommandArgs
    if ($LASTEXITCODE -ne 0) {
        throw "$Label failed with exit code $LASTEXITCODE. Do not merge until it passes."
    }
}

$root = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot ".."))
Push-Location $root
try {
    if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
        throw "Git is required to identify the tested commit."
    }
    $commit = (& git rev-parse HEAD).Trim()
    if ($LASTEXITCODE -ne 0 -or $commit -notmatch '^[a-f0-9]{40}$') {
        throw "Cannot resolve the current Git commit."
    }
    if ($ExpectedCommit -and $commit -cne $ExpectedCommit) {
        throw "Wrong revision: expected $ExpectedCommit but found $commit. Check out the exact PR commit."
    }
    Write-Host "Testing commit: $commit"
    if (-not (Get-Command $npm -ErrorAction SilentlyContinue)) {
        throw "Install Node.js 24 and ensure npm is in PATH."
    }
    if (-not (Get-Command $npx -ErrorAction SilentlyContinue)) {
        throw "The npx command is missing from PATH."
    }

    $pythonExe = if (Get-Command py -ErrorAction SilentlyContinue) { "py" }
        elseif (Get-Command python -ErrorAction SilentlyContinue) { "python" }
        elseif (Get-Command python3 -ErrorAction SilentlyContinue) { "python3" }
        else { throw "Python 3 is required for the project's unit tests and APK verification." }
    $pythonPrefix = if ($pythonExe -eq "py") { @("-3") } else { @() }

    if (-not $SkipInstall) {
        Invoke-Checked -Label "npm clean dependencies" -Program $npm -CommandArgs @("ci")
    }
    Invoke-Checked -Label "TypeScript typecheck" -Program $npm -CommandArgs @("run", "typecheck")
    Invoke-Checked -Label "Vitest (all unit tests)" -Program $npm -CommandArgs @("test")
    Write-Host "=== Android signing setup static validation (no secrets created) ==="
    & (Join-Path $PSScriptRoot "setup-android-signing.ps1") -ValidateOnly
    Invoke-Checked -Label "Python unittest" -Program $pythonExe -CommandArgs ($pythonPrefix + @("-m", "unittest", "discover", "-s", "tests", "-p", "*_test.py"))
    Invoke-Checked -Label "Browser game build" -Program $npm -CommandArgs @("run", "build")

    if (-not $SkipBrowser) {
        Invoke-Checked -Label "Install Playwright headless Chromium" -Program $npx -CommandArgs @("playwright", "install", "chromium", "--only-shell")
        Invoke-Checked -Label "Playwright E2E" -Program $npm -CommandArgs @("run", "test:e2e")
        Invoke-Checked -Label "Playwright PWA" -Program $npm -CommandArgs @("run", "test:pwa")
    } else {
        Write-Warning "Browser E2E and PWA skipped: NOT equivalent to full CI verification."
    }

    if (-not $SkipAndroid) {
        if (-not $onWindows) {
            throw "This local Android debug build recipe targets Windows. On Linux, run the Android job steps in .github/workflows/ci.yml instead."
        }
        if (-not (Get-Command java -ErrorAction SilentlyContinue)) {
            throw "JDK 21 is required for the Android Gradle build."
        }
        $sdkHome = if ($env:ANDROID_HOME) { $env:ANDROID_HOME }
            elseif ($env:ANDROID_SDK_ROOT) { $env:ANDROID_SDK_ROOT }
            else { Join-Path $env:LOCALAPPDATA "Android\Sdk" }
        if (-not $sdkHome -or -not (Test-Path -LiteralPath $sdkHome)) {
            throw "Android SDK not found. Install Android SDK platform 36 + build-tools 36.0.0 and set ANDROID_HOME."
        }
        $env:ANDROID_HOME = $sdkHome
        $apksigner = Join-Path $sdkHome "build-tools\36.0.0\apksigner.bat"
        $aapt = Join-Path $sdkHome "build-tools\36.0.0\aapt.exe"
        if (-not (Test-Path -LiteralPath $apksigner) -or -not (Test-Path -LiteralPath $aapt)) {
            throw "Install Android SDK build-tools 36.0.0 (aapt.exe + apksigner.bat)."
        }

        Invoke-Checked -Label "Sync packaged web assets to native project" -Program $npm -CommandArgs @("run", "android:sync")
        Push-Location (Join-Path $root "apps/android/android")
        try {
            Invoke-Checked -Label "Gradle debug APK build" -Program ".\gradlew.bat" -CommandArgs @("--no-daemon", "assembleDebug")
        } finally {
            Pop-Location
        }
        Invoke-Checked -Label "Compare packaged APK assets with current web build" -Program $pythonExe -CommandArgs ($pythonPrefix + @("tools/verify_apk.py"))
        $apk = Join-Path $root "apps/android/android/app/build/outputs/apk/debug/app-debug.apk"
        if (-not (Test-Path -LiteralPath $apk -PathType Leaf)) {
            throw "Expected APK missing: $apk"
        }
        Invoke-Checked -Label "Verify Android debug certificate" -Program $apksigner -CommandArgs @("verify", "--verbose", $apk)
        $hash = Get-FileHash -LiteralPath $apk -Algorithm SHA256
        Write-Host "APK: $apk"
        Write-Host "APK SHA256: $($hash.Hash)"
        Write-Warning "This is a local DEBUG APK. Back up saves before replacing any differently signed installation."
    } else {
        Write-Warning "Android packaging, APK content and signature verification skipped: NOT full CI verification."
    }

    Write-Host "PASS: all selected local checks for $commit"
    if ($SkipBrowser -or $SkipAndroid) {
        Write-Warning "The selected verification is PARTIAL; omitted checks remain unverified."
    }
    Write-Warning "Android emulator and physical-device acceptance, long-lived owner signing and GitHub Release publishing are NOT verified by this script."
} finally {
    Pop-Location
}
