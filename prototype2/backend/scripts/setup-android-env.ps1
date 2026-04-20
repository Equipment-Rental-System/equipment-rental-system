param(
  [string]$JavaHome = "C:\Program Files\Android\Android Studio\jbr",
  [string]$AndroidSdk = "",
  [string]$GradleUserHome = "C:\gradle-cache\smart-rental-home"
)

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)

function Set-UserVariable {
  param(
    [string]$Name,
    [string]$Value
  )

  $current = [Environment]::GetEnvironmentVariable($Name, "User")

  if ($current -ne $Value) {
    setx $Name $Value | Out-Null
    Write-Host "[env] $Name updated -> $Value"
  } else {
    Write-Host "[env] $Name already set"
  }

  [Environment]::SetEnvironmentVariable($Name, $Value, "Process")
}

if (-not (Test-Path $JavaHome)) {
  throw "JDK 경로를 찾을 수 없습니다: $JavaHome"
}

if (-not $AndroidSdk) {
  $sdkCandidates = @(
    [Environment]::GetEnvironmentVariable("ANDROID_SDK_ROOT", "User"),
    [Environment]::GetEnvironmentVariable("ANDROID_HOME", "User"),
    (Join-Path $env:LOCALAPPDATA "Android\Sdk"),
    (Join-Path $env:USERPROFILE "AppData\Local\Android\Sdk"),
    "C:\Android\Sdk"
  ) | Where-Object { $_ -and (Test-Path $_) }

  if ($sdkCandidates) {
    $AndroidSdk = $sdkCandidates[0]
  }
}

if (-not (Test-Path $AndroidSdk)) {
  throw "Android SDK 경로를 찾을 수 없습니다: $AndroidSdk"
}

Set-UserVariable -Name "JAVA_HOME" -Value $JavaHome
Set-UserVariable -Name "ANDROID_HOME" -Value $AndroidSdk
Set-UserVariable -Name "ANDROID_SDK_ROOT" -Value $AndroidSdk
Set-UserVariable -Name "GRADLE_USER_HOME" -Value $GradleUserHome

New-Item -ItemType Directory -Force $GradleUserHome | Out-Null
New-Item -ItemType Directory -Force "C:\gradle-cache\smart-rental-project" | Out-Null

$escapedSdk = $AndroidSdk.Replace("\", "\\")
$localPropertiesContent = "sdk.dir=$escapedSdk"
$localPropertiesTargets = @(
  (Join-Path $projectRoot "frontend\android\local.properties"),
  "C:\build\smart-rental\frontend\android\local.properties"
)

foreach ($target in $localPropertiesTargets) {
  $targetDir = Split-Path -Parent $target

  if (Test-Path $targetDir) {
    try {
      Set-Content -Path $target -Value $localPropertiesContent -Encoding ASCII
      Write-Host "[android] local.properties written -> $target"
    } catch {
      Write-Host "[android] local.properties skipped -> $target ($($_.Exception.Message))"
    }
  }
}

Write-Host ""
Write-Host "Environment variables were applied to this PowerShell session."
Write-Host "Future launches will reuse the same Android SDK path automatically."
