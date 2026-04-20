param()

$ErrorActionPreference = "Stop"
$scriptRoot = $PSScriptRoot
. (Join-Path $scriptRoot "common.ps1")

$packageName = "com.example.smartequipmentrental"
$backendHealthUrl = "http://127.0.0.1:4000/api/health"
$metroStatusUrl = "http://127.0.0.1:8081/status"
$bundleUrls = @(
  "http://127.0.0.1:8081/node_modules/expo/AppEntry.bundle?platform=android&dev=true&hot=false&lazy=true&transform.engine=hermes&transform.bytecode=1&transform.routerRoot=app&unstable_transformProfile=hermes-stable",
  "http://127.0.0.1:8081/index.bundle?platform=android&dev=true&minify=false"
)
$adb = Resolve-AndroidTool -RelativePath "platform-tools\adb.exe"
$results = New-Object System.Collections.Generic.List[object]

function Add-Result {
  param(
    [string]$Check,
    [bool]$Passed,
    [string]$Detail
  )

  $results.Add([pscustomobject]@{
      Check  = $Check
      Status = if ($Passed) { "OK" } else { "FAIL" }
      Detail = $Detail
    })
}

function Get-CollectionCount {
  param($Value)

  if ($null -eq $Value) {
    return 0
  }

  if ($Value -is [System.Array]) {
    return $Value.Count
  }

  if ($Value -is [System.Collections.IEnumerable] -and -not ($Value -is [string])) {
    return @($Value).Count
  }

  if ($Value.PSObject.Properties["data"]) {
    return Get-CollectionCount -Value $Value.data
  }

  if ($Value.PSObject.Properties["items"]) {
    return Get-CollectionCount -Value $Value.items
  }

  return 1
}

function Get-TokenFromResponse {
  param($Response)

  $candidates = @()

  if ($Response.PSObject.Properties["token"]) {
    $candidates += $Response.token
  }

  if ($Response.PSObject.Properties["accessToken"]) {
    $candidates += $Response.accessToken
  }

  if ($Response.PSObject.Properties["data"] -and $Response.data) {
    if ($Response.data.PSObject.Properties["token"]) {
      $candidates += $Response.data.token
    }

    if ($Response.data.PSObject.Properties["accessToken"]) {
      $candidates += $Response.data.accessToken
    }
  }

  $candidates = $candidates | Where-Object { $_ }

  return ($candidates | Select-Object -First 1)
}

function Wait-ForDeviceId {
  param([int]$TimeoutSeconds = 60)

  for ($index = 0; $index -lt $TimeoutSeconds; $index += 1) {
    $lines = @(& $adb devices | Select-String "emulator-\d+\s+device")
    if ($lines) {
      return ($lines[0].ToString() -split "\s+")[0]
    }

    Start-Sleep -Seconds 1
  }

  return $null
}

function Wait-ForAppActivity {
  param(
    [Parameter(Mandatory = $true)][string]$DeviceId,
    [int]$TimeoutSeconds = 45
  )

  for ($index = 0; $index -lt $TimeoutSeconds; $index += 1) {
    $activity = (& $adb -s $DeviceId shell dumpsys activity activities | Select-String -Pattern $packageName | Select-Object -First 1)
    if ($activity) {
      return $activity
    }

    Start-Sleep -Seconds 1
  }

  return $null
}

function Test-AnyBundleUrl {
  param(
    [string[]]$Urls,
    [int]$TimeoutSeconds = 20
  )

  foreach ($url in $Urls) {
    if (Wait-HttpEndpoint -Url $url -TimeoutSeconds $TimeoutSeconds) {
      return $true
    }
  }

  return $false
}

try {
  $healthResponse = Invoke-RestMethod -Method Get -Uri $backendHealthUrl -TimeoutSec 10
  $healthDetail = if ($healthResponse.PSObject.Properties["message"]) { $healthResponse.message } else { "Healthy" }
  Add-Result -Check "Backend health" -Passed $true -Detail $healthDetail
} catch {
  Add-Result -Check "Backend health" -Passed $false -Detail $_.Exception.Message
}

$token = $null
$authHeaders = @{}

try {
  $loginBody = @{ studentId = "20240001"; password = "user1234" } | ConvertTo-Json
  $loginResponse = Invoke-RestMethod -Method Post -Uri "http://127.0.0.1:4000/api/auth/login" -ContentType "application/json" -Body $loginBody -TimeoutSec 10
  $token = Get-TokenFromResponse -Response $loginResponse
  if ($token) {
    $authHeaders = @{ Authorization = "Bearer $token" }
  }
  $loginDetail = if ($token) { "Token issued successfully" } else { "Login response did not include a token" }
  Add-Result -Check "User login" -Passed ([bool]$token) -Detail $loginDetail
} catch {
  Add-Result -Check "User login" -Passed $false -Detail $_.Exception.Message
}

try {
  $equipmentResponse = Invoke-RestMethod -Method Get -Uri "http://127.0.0.1:4000/api/equipments" -Headers $authHeaders -TimeoutSec 10
  $equipmentCount = Get-CollectionCount -Value $equipmentResponse
  Add-Result -Check "Equipment list" -Passed ($equipmentCount -gt 0) -Detail "$equipmentCount equipment records returned"
} catch {
  Add-Result -Check "Equipment list" -Passed $false -Detail $_.Exception.Message
}

try {
  $qrResponse = Invoke-RestMethod -Method Get -Uri "http://127.0.0.1:4000/api/equipments/qr/EQ-LAP-001" -Headers $authHeaders -TimeoutSec 10
  $qrName = "Equipment found"
  if ($qrResponse.PSObject.Properties["data"] -and $qrResponse.data -and $qrResponse.data.PSObject.Properties["name"]) {
    $qrName = $qrResponse.data.name
  } elseif ($qrResponse.PSObject.Properties["name"]) {
    $qrName = $qrResponse.name
  }
  Add-Result -Check "QR lookup" -Passed $true -Detail $qrName
} catch {
  Add-Result -Check "QR lookup" -Passed $false -Detail $_.Exception.Message
}

Add-Result -Check "Metro status" -Passed (Test-HttpEndpoint -Url $metroStatusUrl -ContainsText "packager-status:running") -Detail "GET /status"
Add-Result -Check "Metro bundle" -Passed (Test-AnyBundleUrl -Urls $bundleUrls -TimeoutSeconds 20) -Detail "Expo bundle endpoint"

$deviceId = Wait-ForDeviceId -TimeoutSeconds 60
$adbDeviceDetail = if ($deviceId) { $deviceId } else { "No emulator device detected" }
Add-Result -Check "ADB device" -Passed ([bool]$deviceId) -Detail $adbDeviceDetail

if ($deviceId) {
  $reverseList = @(& $adb -s $deviceId reverse --list)
  $reverseDetail = if ($reverseList.Count -gt 0) { $reverseList -join "; " } else { "No reverse rules" }
  $hasReverse8081 = [bool]($reverseList -match "tcp:8081")
  $hasReverse4000 = [bool]($reverseList -match "tcp:4000")
  Add-Result -Check "ADB reverse 8081" -Passed $hasReverse8081 -Detail $reverseDetail
  Add-Result -Check "ADB reverse 4000" -Passed $hasReverse4000 -Detail $reverseDetail

  $packageInstalled = (& $adb -s $deviceId shell pm list packages $packageName) -match $packageName
  $packageDetail = if ($packageInstalled) { $packageName } else { "Package is not installed" }
  Add-Result -Check "Android package" -Passed ([bool]$packageInstalled) -Detail $packageDetail

  $selectedSubtype = (& $adb -s $deviceId shell settings get secure selected_input_method_subtype).Trim()
  $isKoreanIme = $selectedSubtype -eq "-1906255757"
  Add-Result -Check "Korean IME" -Passed $isKoreanIme -Detail "selected_input_method_subtype=$selectedSubtype"

  $topActivity = Wait-ForAppActivity -DeviceId $deviceId -TimeoutSeconds 45
  $activityDetail = if ($topActivity) { $topActivity.Line.Trim() } else { "App activity not found in dumpsys output" }
  Add-Result -Check "App activity" -Passed ([bool]$topActivity) -Detail $activityDetail
}

$results | Format-Table -AutoSize

$failed = @($results | Where-Object { $_.Status -eq "FAIL" })
if ($failed.Count -gt 0) {
  throw "Environment verification failed for $($failed.Count) check(s)."
}

Write-Host ""
Write-Host "All verification checks passed."
exit 0
