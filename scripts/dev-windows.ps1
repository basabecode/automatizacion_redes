$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

function Write-Step($message) {
  Write-Host "[dev-windows] $message" -ForegroundColor Cyan
}

function Test-TcpPort($hostName, $port) {
  try {
    $client = New-Object System.Net.Sockets.TcpClient
    $async = $client.BeginConnect($hostName, $port, $null, $null)
    $success = $async.AsyncWaitHandle.WaitOne(1000, $false)
    if (-not $success) {
      $client.Close()
      return $false
    }
    $client.EndConnect($async)
    $client.Close()
    return $true
  }
  catch {
    return $false
  }
}

function Ensure-DockerDesktop() {
  try {
    docker info | Out-Null
    return
  }
  catch {
    Write-Step "Docker Desktop no esta listo. Intentando iniciarlo..."
  }

  $dockerDesktopPath = "C:\Program Files\Docker\Docker\Docker Desktop.exe"
  if (Test-Path $dockerDesktopPath) {
    Start-Process -FilePath $dockerDesktopPath | Out-Null
  }

  for ($i = 0; $i -lt 60; $i++) {
    Start-Sleep -Seconds 2
    try {
      docker info | Out-Null
      Write-Step "Docker Desktop disponible."
      return
    }
    catch {
    }
  }

  throw "Docker Desktop no respondio a tiempo."
}

function Ensure-DatabaseContainer() {
  $containerName = "yetzar-db"
  $status = docker ps -a --filter "name=^${containerName}$" --format "{{.Status}}"

  if (-not $status) {
    Write-Step "Creando contenedor de base de datos..."
    docker compose up -d db
    return
  }

  if ($status -notmatch '^Up ') {
    Write-Step "Iniciando contenedor $containerName..."
    docker start $containerName | Out-Null
  }
  else {
    Write-Step "Contenedor $containerName ya esta corriendo."
  }
}

function Wait-ForDatabase() {
  Write-Step "Esperando PostgreSQL en localhost:5433..."
  for ($i = 0; $i -lt 60; $i++) {
    if (Test-TcpPort "127.0.0.1" 5433) {
      Write-Step "Base de datos disponible."
      return
    }
    Start-Sleep -Seconds 1
  }

  throw "PostgreSQL no estuvo disponible en localhost:5433."
}

Write-Step "Preparando entorno local..."
Ensure-DockerDesktop
Ensure-DatabaseContainer
Wait-ForDatabase

Write-Step "Iniciando Next.js en modo desarrollo con recarga de cambios..."
pnpm dev
