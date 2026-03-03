param(
  [switch]$KeepNodeModules = $true,
  [switch]$CleanNextCache = $true
)

$ErrorActionPreference = "Continue"

function Remove-PathSafe {
  param([string]$Target)
  if (Test-Path $Target) {
    Write-Host "Removing $Target"
    Remove-Item -Recurse -Force $Target
  }
}

# Approved local artifacts only.
Remove-PathSafe "backend/.secrets/playwright-profile"
Get-ChildItem "backend/.secrets" -Filter "*.json" -ErrorAction SilentlyContinue | ForEach-Object {
  Remove-PathSafe $_.FullName
}
Remove-PathSafe "tmp"

if ($CleanNextCache) {
  Remove-PathSafe "frontend/.next"
}

if (-not $KeepNodeModules) {
  Write-Host "KeepNodeModules is false, but cleanup policy keeps node_modules by default."
  Write-Host "Skipping node_modules removal by design."
}

Write-Host "Cleanup complete."
