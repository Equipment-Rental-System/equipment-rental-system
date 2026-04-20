param(
  [string]$AvdName = "Pixel_7_API_35",
  [switch]$Rebuild
)

$ErrorActionPreference = "Stop"
$scriptRoot = $PSScriptRoot

& (Join-Path $scriptRoot "setup-android-env.ps1")
& (Join-Path $scriptRoot "start-backend.ps1")
& (Join-Path $scriptRoot "start-metro.ps1")
& (Join-Path $scriptRoot "start-android.ps1") -AvdName $AvdName -Rebuild:$Rebuild
& (Join-Path $scriptRoot "verify-dev-env.ps1")

Write-Host ""
Write-Host "Development environment is stable and ready."
exit 0
