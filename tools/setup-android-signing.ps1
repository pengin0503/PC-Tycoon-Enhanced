param(
    [string]$Repository = "pengin0503/PC-Tycoon-Enhanced",
    [string]$KeystorePath = "",
    [string]$KeyAlias = "pc-tycoon",
    [switch]$AllowReplace,
    [switch]$ValidateOnly
)
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if ($ValidateOnly) {
    Write-Output "Android signing setup script parses successfully."
    return
}
if ($env:OS -ne "Windows_NT") { throw "Run this signing setup on your Windows PC." }
if ($Repository -notmatch '^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$') { throw "Expected owner/repo." }
if ($KeyAlias -notmatch '^[A-Za-z0-9_-]+$') { throw "Invalid key alias." }
if (-not (Get-Command gh -ErrorAction SilentlyContinue)) { throw "Install GitHub CLI (gh) and run: gh auth login" }
if (-not (Get-Command keytool -ErrorAction SilentlyContinue)) { throw "Install JDK 21 and restart PowerShell." }

& gh auth status *> $null
if ($LASTEXITCODE -ne 0) { throw "Run: gh auth login" }
& gh repo view $Repository --json name --jq '.name' *> $null
if ($LASTEXITCODE -ne 0) { throw "GitHub CLI cannot access $Repository." }

$requiredSecrets = @(
    "PCT_ANDROID_KEYSTORE_BASE64",
    "PCT_ANDROID_KEYSTORE_PASSWORD",
    "PCT_ANDROID_KEY_ALIAS",
    "PCT_ANDROID_KEY_PASSWORD"
)
$existingNames = @(& gh secret list --repo $Repository --json name --jq '.[].name')
if ($LASTEXITCODE -ne 0) { throw "Could not inspect Actions Secrets; check repository permissions." }
$present = @($existingNames | Where-Object { $requiredSecrets -contains $_ })
if ($present.Count -gt 0 -and -not $AllowReplace) {
    throw "Signing secrets already exist. No changes made. To recover a partial setup, rerun with -AllowReplace and the SAME original keystore."
}

if (-not $KeystorePath) {
    $docs = [Environment]::GetFolderPath("MyDocuments")
    if (-not $docs) { $docs = $HOME }
    $KeystorePath = Join-Path (Join-Path $docs "PC-Tycoon-Enhanced-Signing") "pc-tycoon-release.jks"
}
$KeystorePath = [IO.Path]::GetFullPath($KeystorePath)
if (-not (Test-Path -LiteralPath $KeystorePath -PathType Leaf)) {
    $published = @(& gh release list --repo $Repository --limit 1 --json tagName --jq '.[].tagName')
    if ($LASTEXITCODE -ne 0 -or $published.Count -gt 0) {
        throw "A release may already exist; restore the ORIGINAL signing keystore instead of creating a new key."
    }
    if ($AllowReplace) {
        throw "-AllowReplace requires an existing keystore to preserve the signing identity."
    }
    $directory = Split-Path -Parent $KeystorePath
    if (-not (Test-Path -LiteralPath $directory)) {
        New-Item -ItemType Directory -Path $directory -Force | Out-Null
    }
    Write-Host "Creating a new dedicated signing key: $KeystorePath"
    Write-Host "Enter and confirm a strong password at the keytool prompts."
    & keytool -genkeypair -keystore $KeystorePath -storetype PKCS12 -alias $KeyAlias -keyalg RSA -keysize 3072 -validity 10000 -dname "CN=PC Tycoon Enhanced, OU=Personal, O=Private, L=Tokyo, ST=Tokyo, C=JP"
    if ($LASTEXITCODE -ne 0 -or -not (Test-Path -LiteralPath $KeystorePath -PathType Leaf)) {
        throw "Could not generate the keystore."
    }
} else {
    Write-Host "Reusing existing signing key: $KeystorePath"
}

Write-Host "Back up this .jks file to a separate safe location before uploading secrets."
if ((Read-Host "After independently checking the backup, type BACKED-UP") -cne "BACKED-UP") {
    throw "No GitHub Secrets were changed. Make a backup first."
}
$securePassword = Read-Host "Enter the keystore password again (input hidden)" -AsSecureString
$pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
try {
    $storePassword = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)
} finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)
}
if (-not $storePassword) { throw "Empty keystore password is not permitted." }

function Confirm-Keystore {
    param([string]$Path, [string]$Alias, [string]$Password)
    $info = New-Object System.Diagnostics.ProcessStartInfo
    $info.FileName = (Get-Command keytool).Source
    $info.Arguments = '-list -keystore "' + $Path + '" -storetype PKCS12 -alias ' + $Alias + ' -storepass:env PCT_LOCAL_STORE_PASSWORD'
    $info.UseShellExecute = $false
    $info.CreateNoWindow = $true
    $info.RedirectStandardOutput = $true
    $info.RedirectStandardError = $true
    $info.EnvironmentVariables["PCT_LOCAL_STORE_PASSWORD"] = $Password
    $process = New-Object System.Diagnostics.Process
    $process.StartInfo = $info
    try {
        if (-not $process.Start()) { throw "Cannot start keytool." }
        $null = $process.StandardOutput.ReadToEnd()
        $null = $process.StandardError.ReadToEnd()
        $process.WaitForExit()
        if ($process.ExitCode -ne 0) {
            throw "Keystore password or alias incorrect; no secrets uploaded."
        }
    } finally { $process.Dispose() }
}

# Never pass secrets via command-line arguments, files, logs, or clipboard.
function Set-PrivateGitHubSecret {
    param([string]$Name, [string]$Value, [string]$Repo)
    $info = New-Object System.Diagnostics.ProcessStartInfo
    $info.FileName = (Get-Command gh).Source
    $info.Arguments = "secret set $Name -R $Repo"
    $info.UseShellExecute = $false
    $info.CreateNoWindow = $true
    $info.RedirectStandardInput = $true
    $info.RedirectStandardOutput = $true
    $info.RedirectStandardError = $true
    $process = New-Object System.Diagnostics.Process
    $process.StartInfo = $info
    try {
        if (-not $process.Start()) { throw "Cannot start GitHub CLI." }
        $process.StandardInput.Write($Value)
        $process.StandardInput.Close()
        $null = $process.StandardOutput.ReadToEnd()
        $null = $process.StandardError.ReadToEnd()
        $process.WaitForExit()
        if ($process.ExitCode -ne 0) {
            throw "Setting $Name failed (secret redacted). To retry use -AllowReplace with the SAME keystore."
        }
    } finally { $process.Dispose() }
}

$keyBytes = $null
$keyBase64 = $null
try {
    Confirm-Keystore -Path $KeystorePath -Alias $KeyAlias -Password $storePassword
    $keyBytes = [IO.File]::ReadAllBytes($KeystorePath)
    $keyBase64 = [Convert]::ToBase64String($keyBytes)
    Set-PrivateGitHubSecret -Name "PCT_ANDROID_KEYSTORE_BASE64" -Value $keyBase64 -Repo $Repository
    Set-PrivateGitHubSecret -Name "PCT_ANDROID_KEYSTORE_PASSWORD" -Value $storePassword -Repo $Repository
    Set-PrivateGitHubSecret -Name "PCT_ANDROID_KEY_ALIAS" -Value $KeyAlias -Repo $Repository
    Set-PrivateGitHubSecret -Name "PCT_ANDROID_KEY_PASSWORD" -Value $storePassword -Repo $Repository
} finally {
    if ($null -ne $keyBytes) { [Array]::Clear($keyBytes, 0, $keyBytes.Length) }
    $keyBase64 = $null
    $storePassword = $null
    $securePassword = $null
}

$finalNames = @(& gh secret list --repo $Repository --json name --jq '.[].name')
if ($LASTEXITCODE -ne 0 -or @($requiredSecrets | Where-Object { $finalNames -notcontains $_ }).Count -ne 0) {
    throw "Unable to confirm all four Actions Secrets. Do not publish yet."
}
Write-Host "Four Actions signing secrets registered. Preserve the ORIGINAL key: $KeystorePath"
Write-Host "No Release tag has been pushed; release only after secrets are registered."
