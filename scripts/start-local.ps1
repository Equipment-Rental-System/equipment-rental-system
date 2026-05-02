param(
  [string]$AvdName = "Pixel_7_API_34",
  [switch]$UseReleaseApk
)

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$frontend = Join-Path $root "frontend"
$backend = Join-Path $root "backend"
$databaseDir = Join-Path $root "database"
$androidDir = Join-Path $frontend "android"
$apkPath = Join-Path $androidDir "app\build\outputs\apk\release\app-release.apk"
$mysqlExe = "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"
$mysqldExe = "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqld.exe"
$mysqlConfig = "C:\mysql-local\my.ini"
$adb = "C:\Android\Sdk\platform-tools\adb.exe"
$emulatorExe = "C:\Android\Sdk\emulator\emulator.exe"

function Stop-PortProcesses {
  param([int]$Port)

  $owners = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue |
    Select-Object -ExpandProperty OwningProcess -Unique

  foreach ($ownerId in $owners) {
    if ($ownerId -and $ownerId -ne 0) {
      Stop-Process -Id $ownerId -Force -ErrorAction SilentlyContinue
    }
  }
}

function Stop-FrontendPortProcesses {
  $ports = @(8081, 19000, 19001, 19002)

  foreach ($port in $ports) {
    $owners = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue |
      Select-Object -ExpandProperty OwningProcess -Unique

    foreach ($ownerId in $owners) {
      if ($ownerId -and $ownerId -ne 0) {
        Stop-Process -Id $ownerId -Force -ErrorAction SilentlyContinue
      }
    }
  }
}

function Wait-ForHttp {
  param(
    [string]$Url,
    [int]$TimeoutSeconds = 30
  )

  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)

  while ((Get-Date) -lt $deadline) {
    try {
      $response = Invoke-WebRequest -Uri $Url -TimeoutSec 3 -UseBasicParsing
      if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 500) {
        return $true
      }
    } catch {
      Start-Sleep -Milliseconds 700
    }
  }

  return $false
}

function Wait-ForPorts {
  param(
    [int[]]$Ports,
    [int]$TimeoutSeconds = 60
  )

  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)

  while ((Get-Date) -lt $deadline) {
    $listening = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue |
      Where-Object { $_.LocalPort -in $Ports }
    if ($listening) {
      return $true
    }

    Start-Sleep -Seconds 2
  }

  return $false
}

function Wait-ForDevice {
  param([int]$TimeoutSeconds = 120)

  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)

  while ((Get-Date) -lt $deadline) {
    $output = & $adb devices
    if ($output -match "emulator-\d+\s+device") {
      return $true
    }

    Start-Sleep -Seconds 2
  }

  return $false
}

function Wait-ForBoot {
  param([int]$TimeoutSeconds = 180)

  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)

  while ((Get-Date) -lt $deadline) {
    try {
      $boot = (& $adb shell getprop sys.boot_completed 2>$null).Trim()
      if ($boot -eq "1") {
        return $true
      }
    } catch {
    }

    Start-Sleep -Seconds 3
  }

  return $false
}

function Invoke-MySqlFile {
  param(
    [string]$SqlFile,
    [string]$Database = ""
  )

  $databaseArg = if ($Database) { " $Database" } else { "" }
  $command = "`"$mysqlExe`" --protocol=TCP -h 127.0.0.1 -P 3307 -u root --default-character-set=utf8mb4$databaseArg < `"$SqlFile`""
  cmd /c $command | Out-Null

  if ($LASTEXITCODE -ne 0) {
    throw "Failed to apply SQL file: $SqlFile"
  }
}

function Ensure-MySql {
  $listening = Get-NetTCPConnection -LocalPort 3307 -ErrorAction SilentlyContinue |
    Where-Object State -eq "Listen"

  if ($listening) {
    return
  }

  if ((Test-Path $mysqldExe) -and (Test-Path $mysqlConfig)) {
    Start-Process -FilePath $mysqldExe -ArgumentList "--defaults-file=$mysqlConfig" -WindowStyle Hidden | Out-Null
    Start-Sleep -Seconds 5
  }
}

function Ensure-Database {
  if (-not (Test-Path $mysqlExe)) {
    throw "mysql.exe was not found."
  }

  $usersTable = @(
    & $mysqlExe --protocol=TCP -h 127.0.0.1 -P 3307 -u root -N -e "SHOW TABLES FROM equipment_rental LIKE 'users';" 2>$null
  ) -join ""

  if ($usersTable.Trim() -eq "users") {
    return
  }

  Invoke-MySqlFile -SqlFile (Join-Path $databaseDir "schema.sql")
  Invoke-MySqlFile -SqlFile (Join-Path $databaseDir "seed.sql") -Database "equipment_rental"
}

function Ensure-BackendDependencies {
  $backendModules = Join-Path $backend "node_modules"
  if (Test-Path $backendModules) {
    return
  }

  Push-Location $backend
  try {
    & npm install
    if ($LASTEXITCODE -ne 0) {
      throw "npm install failed in backend."
    }
  } finally {
    Pop-Location
  }
}

function Ensure-BackendEnv {
  $envPath = Join-Path $backend ".env"
  $envExamplePath = Join-Path $backend ".env.example"

  if (Test-Path $envPath) {
    return
  }

  if (-not (Test-Path $envExamplePath)) {
    throw "backend/.env.example was not found."
  }

  Copy-Item -LiteralPath $envExamplePath -Destination $envPath -Force
}

function Ensure-FrontendDependencies {
  $frontendModules = Join-Path $frontend "node_modules"
  if (Test-Path $frontendModules) {
    return
  }

  Push-Location $frontend
  try {
    & npm install
    if ($LASTEXITCODE -ne 0) {
      throw "npm install failed in frontend."
    }
  } finally {
    Pop-Location
  }
}

function Ensure-ReleaseApk {
  if (Test-Path $apkPath) {
    return
  }

  if (-not $UseReleaseApk) {
    throw "Release APK is missing. Use -UseReleaseApk to build it explicitly."
  }

  cmd /c "subst X: /d" | Out-Null
  subst X: $root
  Push-Location "X:\frontend\android"

  try {
    & ".\gradlew.bat" "app:assembleRelease"
  } finally {
    Pop-Location
    cmd /c "subst X: /d" | Out-Null
  }

  if (-not (Test-Path $apkPath)) {
    throw "Release APK build did not produce app-release.apk."
  }
}

function Ensure-Emulator {
  try {
    & $adb devices | Out-Null
  } catch {
  }

  $devices = & $adb devices
  if ($devices -match "emulator-\d+\s+device") {
    if (-not (Wait-ForBoot -TimeoutSeconds 60)) {
      throw "Emulator is connected but did not finish booting."
    }
    return
  }

  if ($devices -match "emulator-\d+\s+offline") {
    try {
      Get-Process emulator, qemu-system-x86_64 -ErrorAction SilentlyContinue |
        Stop-Process -Force -ErrorAction SilentlyContinue
    } catch {
    }

    Start-Sleep -Seconds 5
  }

  Start-Process -FilePath $emulatorExe -ArgumentList "-avd $AvdName -no-snapshot-load -no-boot-anim" -WindowStyle Hidden | Out-Null

  if (-not (Wait-ForDevice -TimeoutSeconds 180)) {
    throw "Emulator did not connect to adb."
  }

  if (-not (Wait-ForBoot -TimeoutSeconds 240)) {
    throw "Emulator did not finish booting."
  }
}

function Start-ExpoGoApp {
  Stop-FrontendPortProcesses
  Ensure-FrontendDependencies

  & $adb reverse tcp:8081 tcp:8081 | Out-Null
  & $adb reverse tcp:19000 tcp:19000 | Out-Null
  & $adb reverse tcp:19001 tcp:19001 | Out-Null

  $expoCommand = "Set-Location -LiteralPath '$frontend'; npx expo start --android --localhost --clear"
  Start-Process -FilePath "powershell.exe" -ArgumentList "-NoLogo", "-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", $expoCommand -WindowStyle Hidden | Out-Null

  if (-not (Wait-ForPorts -Ports @(8081, 19000, 19001, 19002) -TimeoutSeconds 120)) {
    throw "Expo dev server did not start."
  }
}

Ensure-MySql
Ensure-Database
Ensure-BackendDependencies
Ensure-BackendEnv

Stop-PortProcesses -Port 3000
Start-Sleep -Seconds 1

Start-Process -FilePath "node.exe" -ArgumentList "server.js" -WorkingDirectory $backend -WindowStyle Hidden | Out-Null

if (-not (Wait-ForHttp -Url "http://127.0.0.1:3000/" -TimeoutSeconds 20)) {
  throw "Backend did not become ready on port 3000."
}

Ensure-Emulator

if ($UseReleaseApk) {
  Ensure-ReleaseApk
  & $adb install -r $apkPath | Out-Null
  & $adb shell am force-stop com.example.smartequipmentrental | Out-Null
  Start-Sleep -Seconds 1
  & $adb shell monkey -p com.example.smartequipmentrental -c android.intent.category.LAUNCHER 1 | Out-Null
  Write-Host "git release app is running."
  exit 0
}

Start-ExpoGoApp
Write-Host "git Expo Go app is running."
