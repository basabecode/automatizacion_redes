$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$launcherPath = Join-Path $root "Abrir Yetzar Studio.vbs"
$iconPath = Join-Path $root "public\logo\app-icon.ico"
$iconScript = Join-Path $root "scripts\create-app-icon.ps1"

if (-not (Test-Path $iconPath)) {
  powershell.exe -ExecutionPolicy Bypass -File $iconScript | Out-Null
}

$desktopPath = [Environment]::GetFolderPath("Desktop")
$shortcutPath = Join-Path $desktopPath "Yetzar Studio.lnk"

$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = $launcherPath
$shortcut.WorkingDirectory = $root
$shortcut.IconLocation = $iconPath
$shortcut.WindowStyle = 7
$shortcut.Description = "Inicia Yetzar Studio con base local y recarga automatica."
$shortcut.Save()

Write-Host "Acceso directo creado en $shortcutPath"
