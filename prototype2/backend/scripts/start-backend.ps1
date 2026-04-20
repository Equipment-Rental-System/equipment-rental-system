param(
  [switch]$CurrentWindow
)

$ErrorActionPreference = "Stop"
$scriptRoot = $PSScriptRoot
. (Join-Path $scriptRoot "common.ps1")

$projectRoot = Split-Path -Parent (Split-Path -Parent $scriptRoot)
$backendDir = Join-Path $projectRoot "backend"
$nodeBin = Resolve-NodeTool -ToolName "npm"
$mysqlBin = Get-FirstExistingPath -Candidates @(
  "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqld.exe"
)
$mysqlClientBin = "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"
$healthUrl = "http://127.0.0.1:4000/api/health"
$databaseName = "smart_equipment_rental"
$schemaFile = Join-Path $backendDir "sql\schema.sql"
$seedFile = Join-Path $backendDir "sql\seed.sql"

function Convert-ToMysqlPath {
  param([Parameter(Mandatory = $true)][string]$PathValue)

  return $PathValue.Replace("\", "/")
}

$mysqlRuntimeRoot = "C:\gradle-cache\smart-rental-backend"
$mysqlDataDir = Join-Path $mysqlRuntimeRoot "mysql-data"
$mysqlSeedDataDir = Join-Path $backendDir "mysql-data"
$mysqlDefaults = Join-Path $mysqlRuntimeRoot "mysql-local.ini"
$mysqlTmpDir = Join-Path $mysqlRuntimeRoot "mysql-tmp"
$mysqlPidFile = Join-Path $mysqlDataDir "$env:COMPUTERNAME.pid"
$mysqlStdOutLog = Join-Path $mysqlRuntimeRoot "mysql-local.stdout.log"
$mysqlStdErrLog = Join-Path $mysqlRuntimeRoot "mysql-wrapper.err.log"
$mysqlErrLog = Join-Path $mysqlRuntimeRoot "mysql-local.err"

function Stop-StaleMysqlProcesses {
  $mysqlProcesses = Get-Process mysqld -ErrorAction SilentlyContinue

  foreach ($process in $mysqlProcesses) {
    try {
      Stop-Process -Id $process.Id -Force -ErrorAction Stop
      Write-Host "Stopped stale mysqld process (PID $($process.Id))."
    } catch {
      Write-Host "Could not stop mysqld process (PID $($process.Id)): $($_.Exception.Message)"
    }
  }
}

function Write-MysqlDefaultsFile {
  $mysqlDefaultsContent = @"
[mysqld]
basedir=C:/Program Files/MySQL/MySQL Server 8.0
datadir=$(Convert-ToMysqlPath -PathValue $mysqlDataDir)
port=3307
bind-address=127.0.0.1
mysqlx=0
tmpdir=$(Convert-ToMysqlPath -PathValue $mysqlTmpDir)
log-error=$(Convert-ToMysqlPath -PathValue $mysqlErrLog)
lc-messages-dir=C:/Program Files/MySQL/MySQL Server 8.0/share
character-set-server=utf8mb4
collation-server=utf8mb4_unicode_ci

[client]
port=3307
default-character-set=utf8mb4
"@

  Set-Content -Path $mysqlDefaults -Value $mysqlDefaultsContent -Encoding ASCII
}

function Ensure-MysqlSeedData {
  if (Test-Path (Join-Path $mysqlDataDir "mysql.ibd")) {
    return
  }

  if (-not (Test-Path $mysqlSeedDataDir)) {
    throw "Seed MySQL data directory was not found."
  }

  if (Test-Path $mysqlDataDir) {
    Remove-Item -LiteralPath $mysqlDataDir -Recurse -Force -ErrorAction SilentlyContinue
  }

  Copy-Item -Recurse -Force $mysqlSeedDataDir $mysqlRuntimeRoot
}

function Ensure-LocalMysql {
  if (Test-PortListening -Port 3307) {
    Write-Host "Local MySQL is already listening on 3307."
    return
  }

  if (-not $mysqlBin) {
    throw "mysqld.exe was not found."
  }

  New-Item -ItemType Directory -Force -Path $mysqlRuntimeRoot | Out-Null
  New-Item -ItemType Directory -Force -Path $mysqlTmpDir | Out-Null

  Ensure-MysqlSeedData
  Write-MysqlDefaultsFile

  for ($attempt = 1; $attempt -le 2; $attempt += 1) {
    Stop-StaleMysqlProcesses
    Start-Sleep -Seconds 2

    if (Test-Path $mysqlPidFile) {
      Remove-Item -LiteralPath $mysqlPidFile -Force -ErrorAction SilentlyContinue
    }

    Repair-ProcessPathEnvironment
    Start-Process -FilePath $mysqlBin -ArgumentList @("--defaults-file=$mysqlDefaults") -WindowStyle Hidden `
      -RedirectStandardOutput $mysqlStdOutLog -RedirectStandardError $mysqlStdErrLog | Out-Null

    if (Wait-PortListening -Port 3307 -TimeoutSeconds 45) {
      Write-Host "Local MySQL is ready on 3307."
      return
    }

    Write-Host "Local MySQL start attempt $attempt did not open port 3307."
  }

  throw "Local MySQL did not become ready on port 3307."
}

function Ensure-AppDatabase {
  if (-not $mysqlClientBin) {
    throw "mysql.exe was not found."
  }

  if (-not (Test-Path $schemaFile)) {
    throw "schema.sql was not found."
  }

  if (-not (Test-Path $seedFile)) {
    throw "seed.sql was not found."
  }

  $existingDbOutput = @(& $mysqlClientBin --protocol=TCP -h 127.0.0.1 -P 3307 -u root -N -e "SHOW DATABASES LIKE '$databaseName';" 2>$null)
  $existingDb = ($existingDbOutput -join "").Trim()
  if ($existingDb -eq $databaseName) {
    return
  }

  Write-Host "Initializing application database..."
  Get-Content -Raw -Encoding UTF8 $schemaFile | & $mysqlClientBin --default-character-set=utf8mb4 --protocol=TCP -h 127.0.0.1 -P 3307 -u root
  Get-Content -Raw -Encoding UTF8 $seedFile | & $mysqlClientBin --default-character-set=utf8mb4 --protocol=TCP -h 127.0.0.1 -P 3307 -u root $databaseName
}

function Test-AppDatabaseReady {
  if (-not $mysqlClientBin) {
    return $false
  }

  try {
    $existingDbOutput = @(& $mysqlClientBin --protocol=TCP -h 127.0.0.1 -P 3307 -u root -N -e "SHOW DATABASES LIKE '$databaseName';" 2>$null)
    $existingDb = ($existingDbOutput -join "").Trim()
    return ($existingDb -eq $databaseName)
  } catch {
    return $false
  }
}

function Test-BackendHealthy {
  return (Test-HttpEndpoint -Url $healthUrl -ContainsText "API")
}

if ((Test-PortListening -Port 4000) -and (Test-PortListening -Port 3307) -and (Test-BackendHealthy) -and (Test-AppDatabaseReady)) {
  Write-Host "Backend API is already healthy on port 4000."
  exit 0
}

Ensure-LocalMysql
Ensure-AppDatabase

if (Test-PortListening -Port 4000) {
  if (Test-BackendHealthy) {
    Write-Host "Backend API is already healthy on port 4000."
    exit 0
  }

  Stop-ProcessesOnPort -Port 4000 -Label "backend"
  Start-Sleep -Seconds 1
}

$command = "Set-Location '$backendDir'; & '$nodeBin' start"

if ($CurrentWindow) {
  Invoke-Expression $command
  exit 0
}

Start-DetachedPowerShell -Command $command

if (-not (Wait-HttpEndpoint -Url $healthUrl -ContainsText "API" -TimeoutSeconds 45)) {
  throw "Backend API did not become healthy on http://127.0.0.1:4000/api/health."
}

Write-Host "Backend API is ready."
