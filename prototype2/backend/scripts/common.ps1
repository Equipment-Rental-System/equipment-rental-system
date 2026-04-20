Set-StrictMode -Version Latest

function Get-FirstExistingPath {
  param([string[]]$Candidates)

  foreach ($candidate in $Candidates) {
    if ($candidate -and (Test-Path $candidate)) {
      return $candidate
    }
  }

  return $null
}

function Resolve-NodeTool {
  param([Parameter(Mandatory = $true)][string]$ToolName)

  $candidates = @(
    "C:\Program Files\nodejs\$ToolName.cmd",
    "C:\Program Files\nodejs\$ToolName.exe",
    (Join-Path $env:ProgramFiles "nodejs\$ToolName.cmd"),
    (Join-Path $env:ProgramFiles "nodejs\$ToolName.exe")
  ) | Where-Object { $_ }

  $resolved = Get-FirstExistingPath -Candidates $candidates
  if ($resolved) {
    return $resolved
  }

  $command = Get-Command $ToolName -ErrorAction SilentlyContinue
  if ($command) {
    return $command.Source
  }

  throw "Unable to resolve $ToolName. Please confirm Node.js is installed."
}

function Resolve-AndroidTool {
  param([Parameter(Mandatory = $true)][string]$RelativePath)

  $sdkCandidates = @(
    $env:ANDROID_SDK_ROOT,
    $env:ANDROID_HOME,
    [Environment]::GetEnvironmentVariable("ANDROID_SDK_ROOT", "User"),
    [Environment]::GetEnvironmentVariable("ANDROID_HOME", "User"),
    (Join-Path $env:LOCALAPPDATA "Android\Sdk"),
    (Join-Path $env:USERPROFILE "AppData\Local\Android\Sdk"),
    "C:\Android\Sdk"
  ) | Where-Object { $_ -and (Test-Path $_) }

  $toolCandidates = foreach ($sdkRoot in $sdkCandidates) {
    Join-Path $sdkRoot $RelativePath
  }

  $resolved = Get-FirstExistingPath -Candidates $toolCandidates
  if ($resolved) {
    return $resolved
  }

  throw "Unable to resolve Android tool: $RelativePath"
}

function Test-PortListening {
  param([Parameter(Mandatory = $true)][int]$Port)

  try {
    return [bool](Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction Stop)
  } catch {
    return $false
  }
}

function Get-ListeningProcessIds {
  param([Parameter(Mandatory = $true)][int]$Port)

  try {
    return @(Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction Stop |
        Select-Object -ExpandProperty OwningProcess -Unique)
  } catch {
    return @()
  }
}

function Stop-ProcessesOnPort {
  param(
    [Parameter(Mandatory = $true)][int]$Port,
    [string]$Label = "service"
  )

  $processIds = Get-ListeningProcessIds -Port $Port

  foreach ($processId in $processIds) {
    if (-not $processId -or $processId -eq $PID) {
      continue
    }

    try {
      Stop-Process -Id $processId -Force -ErrorAction Stop
      Write-Host "Stopped $Label process on port $Port (PID $processId)."
    } catch {
      Write-Host "Failed to stop $Label process on port $Port (PID $processId): $($_.Exception.Message)"
    }
  }
}

function Wait-PortListening {
  param(
    [Parameter(Mandatory = $true)][int]$Port,
    [int]$TimeoutSeconds = 30
  )

  for ($index = 0; $index -lt $TimeoutSeconds; $index += 1) {
    if (Test-PortListening -Port $Port) {
      return $true
    }

    Start-Sleep -Seconds 1
  }

  return $false
}

function Test-HttpEndpoint {
  param(
    [Parameter(Mandatory = $true)][string]$Url,
    [string]$ContainsText = "",
    [int]$TimeoutSeconds = 5
  )

  try {
    $response = Invoke-WebRequest -UseBasicParsing -Uri $Url -TimeoutSec $TimeoutSeconds
    $contentText = ""

    if ($response.StatusCode -lt 200 -or $response.StatusCode -ge 300) {
      return $false
    }

    if ($response.Content -is [byte[]]) {
      $contentText = [System.Text.Encoding]::UTF8.GetString($response.Content)
    } elseif ($response.Content -is [System.Array]) {
      $contentText = ($response.Content -join "")
    } else {
      $contentText = [string]$response.Content
    }

    if ($ContainsText -and ($contentText -notlike "*$ContainsText*")) {
      return $false
    }

    return $true
  } catch {
    return $false
  }
}

function Wait-HttpEndpoint {
  param(
    [Parameter(Mandatory = $true)][string]$Url,
    [string]$ContainsText = "",
    [int]$TimeoutSeconds = 45
  )

  for ($index = 0; $index -lt $TimeoutSeconds; $index += 1) {
    if (Test-HttpEndpoint -Url $Url -ContainsText $ContainsText) {
      return $true
    }

    Start-Sleep -Seconds 1
  }

  return $false
}

function Start-DetachedPowerShell {
  param([Parameter(Mandatory = $true)][string]$Command)

  Repair-ProcessPathEnvironment

  Start-Process powershell -ArgumentList @(
    "-NoLogo",
    "-NoProfile",
    "-NoExit",
    "-ExecutionPolicy", "Bypass",
    "-Command", $Command
  ) | Out-Null
}

function Repair-ProcessPathEnvironment {
  $currentPath = [Environment]::GetEnvironmentVariable("Path", "Process")

  if (-not $currentPath) {
    $currentPath = $env:Path
  }

  [Environment]::SetEnvironmentVariable("PATH", $null, "Process")
  [Environment]::SetEnvironmentVariable("Path", $currentPath, "Process")
  $env:Path = $currentPath
}
