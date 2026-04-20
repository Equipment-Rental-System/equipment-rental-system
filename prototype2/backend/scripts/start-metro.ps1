param(
  [switch]$CurrentWindow
)

$ErrorActionPreference = "Stop"
$scriptRoot = $PSScriptRoot
. (Join-Path $scriptRoot "common.ps1")

$projectRoot = Split-Path -Parent (Split-Path -Parent $scriptRoot)
$npxBin = Resolve-NodeTool -ToolName "npx"
$defaultFrontendDir = Join-Path $projectRoot "frontend"
$buildFrontendDir = "C:\build\smart-rental\frontend"
$metroStatusUrl = "http://127.0.0.1:8081/status"

function Get-FrontendDir {
  if (Test-Path (Join-Path $buildFrontendDir "node_modules")) {
    return $buildFrontendDir
  }

  return $defaultFrontendDir
}

function Sync-BuildFrontend {
  if (-not (Test-Path $buildFrontendDir)) {
    return
  }

  try {
    Copy-Item -Recurse -Force (Join-Path $defaultFrontendDir "src") $buildFrontendDir
    Copy-Item -Force (Join-Path $defaultFrontendDir "App.js") (Join-Path $buildFrontendDir "App.js")
    Copy-Item -Force (Join-Path $defaultFrontendDir "app.json") (Join-Path $buildFrontendDir "app.json")
    Copy-Item -Force (Join-Path $defaultFrontendDir "package.json") (Join-Path $buildFrontendDir "package.json")

    if (Test-Path (Join-Path $defaultFrontendDir "android\gradle.properties")) {
      Copy-Item -Force (Join-Path $defaultFrontendDir "android\gradle.properties") (Join-Path $buildFrontendDir "android\gradle.properties")
    }

    if (Test-Path (Join-Path $defaultFrontendDir "android\local.properties")) {
      Copy-Item -Force (Join-Path $defaultFrontendDir "android\local.properties") (Join-Path $buildFrontendDir "android\local.properties")
    }
  } catch {
    Write-Host "Build frontend sync skipped: $($_.Exception.Message)"
  }
}

function Test-MetroHealthy {
  return (Test-HttpEndpoint -Url $metroStatusUrl -ContainsText "packager-status:running")
}

if (Test-PortListening -Port 8081) {
  if (Test-MetroHealthy) {
    Write-Host "Metro is already healthy on port 8081."
    exit 0
  }

  Stop-ProcessesOnPort -Port 8081 -Label "Metro"
  Start-Sleep -Seconds 1
}

Sync-BuildFrontend
$frontendDir = Get-FrontendDir
$command = "`$env:NODE_ENV='development'; Set-Location '$frontendDir'; & '$npxBin' expo start --dev-client --clear --host localhost"

if ($CurrentWindow) {
  Invoke-Expression $command
  exit 0
}

Start-DetachedPowerShell -Command $command

if (-not (Wait-HttpEndpoint -Url $metroStatusUrl -ContainsText "packager-status:running" -TimeoutSeconds 60)) {
  throw "Metro did not become healthy on http://127.0.0.1:8081/status."
}

Write-Host "Metro is ready."
