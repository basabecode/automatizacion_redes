Set oShell = CreateObject("WScript.Shell")
currentDir = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName)
command = "powershell.exe -ExecutionPolicy Bypass -File """ & currentDir & "\scripts\dev-windows-launcher.ps1"""
oShell.Run command, 0, False
