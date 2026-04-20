param(
  [string]$AvdName = "Pixel_7_API_35",
  [switch]$Rebuild
)

$ErrorActionPreference = "Stop"
$scriptRoot = $PSScriptRoot
. (Join-Path $scriptRoot "common.ps1")

$projectRoot = Split-Path -Parent (Split-Path -Parent $scriptRoot)
$npxBin = Resolve-NodeTool -ToolName "npx"
$packageName = "com.example.smartequipmentrental"
$activityName = "$packageName.MainActivity"
$projectCacheDir = "C:\gradle-cache\smart-rental-project"
$defaultFrontendDir = Join-Path $projectRoot "frontend"
$buildFrontendDir = "C:\build\smart-rental\frontend"
$adb = Resolve-AndroidTool -RelativePath "platform-tools\adb.exe"
$emulator = Resolve-AndroidTool -RelativePath "emulator\emulator.exe"
$metroStatusUrl = "http://127.0.0.1:8081/status"
$encodedMetroUrl = [System.Uri]::EscapeDataString("http://127.0.0.1:8081")
$devClientUrl = "${packageName}://expo-development-client/?url=$encodedMetroUrl"

$env:JAVA_HOME = [Environment]::GetEnvironmentVariable("JAVA_HOME", "User")
$env:ANDROID_HOME = [Environment]::GetEnvironmentVariable("ANDROID_HOME", "User")
$env:ANDROID_SDK_ROOT = [Environment]::GetEnvironmentVariable("ANDROID_SDK_ROOT", "User")
$env:GRADLE_USER_HOME = [Environment]::GetEnvironmentVariable("GRADLE_USER_HOME", "User")

if (-not $env:JAVA_HOME) {
  $env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
}

if (-not $env:ANDROID_HOME) {
  $env:ANDROID_HOME = Split-Path -Parent (Split-Path -Parent $adb)
}

if (-not $env:ANDROID_SDK_ROOT) {
  $env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
}

if (-not $env:GRADLE_USER_HOME) {
  $env:GRADLE_USER_HOME = "C:\gradle-cache\smart-rental-home"
}

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

function Get-DeviceId {
  $devices = Get-EmulatorStates | Where-Object { $_.State -eq "device" }
  if ($devices) {
    return $devices[0].Id
  }

  return $null
}

function Get-EmulatorStates {
  $states = @()
  $deviceLines = @(& $adb devices)

  foreach ($line in $deviceLines) {
    if ($line -match "^(emulator-\d+)\s+(device|offline|unauthorized)$") {
      $states += [pscustomobject]@{
        Id    = $matches[1]
        State = $matches[2]
      }
    }
  }

  return $states
}

function Restart-AdbServer {
  & $adb kill-server | Out-Null
  Start-Sleep -Seconds 2
  & $adb start-server | Out-Null
}

function Stop-EmulatorProcesses {
  $emulatorProcesses = Get-Process emulator,qemu-system-x86_64 -ErrorAction SilentlyContinue

  foreach ($process in $emulatorProcesses) {
    try {
      Stop-Process -Id $process.Id -Force -ErrorAction Stop
    } catch {
      Write-Host "Failed to stop emulator process $($process.Id): $($_.Exception.Message)"
    }
  }
}

function Wait-ForBoot {
  param([int]$TimeoutSeconds = 180)

  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)

  while ((Get-Date) -lt $deadline) {
    $readyDevice = Get-DeviceId

    if ($readyDevice) {
      $bootCompleted = (& $adb -s $readyDevice shell getprop sys.boot_completed 2>$null).Trim()
      if ($bootCompleted -eq "1") {
        Write-Host "Emulator boot completed."
        return $readyDevice
      }
    }

    Start-Sleep -Seconds 3
  }

  return $null
}

function Ensure-DeviceReady {
  param([Parameter(Mandatory = $true)][string]$DeviceId)

  & $adb -s $DeviceId shell settings put secure show_ime_with_hard_keyboard 1 | Out-Null
  & $adb -s $DeviceId reverse tcp:8081 tcp:8081 | Out-Null
  & $adb -s $DeviceId reverse tcp:4000 tcp:4000 | Out-Null

  try {
    & $adb -s $DeviceId shell settings put secure selected_input_method_subtype -1906255757 | Out-Null
  } catch {
    Write-Host "Korean Gboard subtype could not be forced automatically."
  }
}

function Launch-InstalledApp {
  param([Parameter(Mandatory = $true)][string]$DeviceId)

  & $adb -s $DeviceId shell am force-stop $packageName | Out-Null
  Start-Sleep -Seconds 2
  & $adb -s $DeviceId shell am start -a android.intent.action.VIEW -d $devClientUrl $packageName | Out-Null
}

if (-not (Wait-HttpEndpoint -Url $metroStatusUrl -ContainsText "packager-status:running" -TimeoutSeconds 60)) {
  throw "Metro is not ready. Start Metro before launching Android."
}

New-Item -ItemType Directory -Force $env:GRADLE_USER_HOME | Out-Null
New-Item -ItemType Directory -Force $projectCacheDir | Out-Null
New-Item -ItemType Directory -Force "C:\temp" | Out-Null
$env:TEMP = "C:\temp"
$env:TMP = "C:\temp"

$deviceId = Get-DeviceId

if (-not $deviceId) {
  $emulatorStates = @(Get-EmulatorStates)

  if ($emulatorStates.Count -gt 0) {
    Write-Host "Offline emulator detected. Restarting adb and relaunching the emulator."
    Restart-AdbServer
    $deviceId = Wait-ForBoot -TimeoutSeconds 20
  }

  if (-not $deviceId) {
    Stop-EmulatorProcesses
    Start-Sleep -Seconds 3
    Repair-ProcessPathEnvironment
    Start-Process -FilePath $emulator -ArgumentList @("-avd", $AvdName) | Out-Null
    Start-Sleep -Seconds 5
    $deviceId = Wait-ForBoot -TimeoutSeconds 180
  }
}

if (-not $deviceId) {
  throw "No healthy Android emulator became available."
}

Ensure-DeviceReady -DeviceId $deviceId

$packageInstalled = (& $adb -s $deviceId shell pm list packages $packageName) -match $packageName

if ($Rebuild -or -not $packageInstalled) {
  Sync-BuildFrontend
  $frontendDir = Get-FrontendDir
  Set-Location $frontendDir
  $env:NODE_ENV = "development"
  & $npxBin expo run:android --variant debug -- --project-cache-dir $projectCacheDir
  Start-Sleep -Seconds 6
}

Launch-InstalledApp -DeviceId $deviceId
Write-Host "Android app launch sequence finished."
