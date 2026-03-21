$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

function Start-MinimizedProcess($filePath, $arguments) {
  Start-Process -FilePath $filePath -ArgumentList $arguments -WindowStyle Minimized | Out-Null
}

function Wait-ForHttp($url, $timeoutSeconds) {
  $deadline = (Get-Date).AddSeconds($timeoutSeconds)
  while ((Get-Date) -lt $deadline) {
    try {
      $response = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 2
      if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 500) {
        return $true
      }
    }
    catch {
    }
    Start-Sleep -Seconds 2
  }
  return $false
}

$devScript = Join-Path $root "scripts\dev-windows.ps1"
Start-MinimizedProcess "powershell.exe" "-ExecutionPolicy Bypass -File `"$devScript`""

if (Wait-ForHttp "http://localhost:3000" 90) {
  Start-Process "http://localhost:3000" | Out-Null
}
