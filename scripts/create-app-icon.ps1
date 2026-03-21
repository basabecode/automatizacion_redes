$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$sourcePath = Join-Path $root "public\logo\favicon-48.png"
$targetPath = Join-Path $root "public\logo\app-icon.ico"

if (-not (Test-Path $sourcePath)) {
  throw "No se encontro la imagen fuente para el icono: $sourcePath"
}

Add-Type -AssemblyName System.Drawing
Add-Type @"
using System;
using System.Runtime.InteropServices;
public static class NativeMethods {
  [DllImport("user32.dll", CharSet = CharSet.Auto)]
  public static extern bool DestroyIcon(IntPtr handle);
}
"@

$bitmap = [System.Drawing.Bitmap]::FromFile($sourcePath)
$resized = New-Object System.Drawing.Bitmap 48, 48
$graphics = [System.Drawing.Graphics]::FromImage($resized)
$graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$graphics.DrawImage($bitmap, 0, 0, 48, 48)
$hIcon = $resized.GetHicon()
$icon = [System.Drawing.Icon]::FromHandle($hIcon)
$fileStream = [System.IO.File]::Open($targetPath, [System.IO.FileMode]::Create)
$icon.Save($fileStream)
$fileStream.Close()

$icon.Dispose()
$graphics.Dispose()
$resized.Dispose()
$bitmap.Dispose()
[NativeMethods]::DestroyIcon($hIcon) | Out-Null

Write-Host "Icono creado en $targetPath"
