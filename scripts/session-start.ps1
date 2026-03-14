param(
    [switch]$Log
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$devLogPath = Join-Path $repoRoot "docs\\DEV_LOG.md"
$serenaArgs = @(
    "mcp",
    "add",
    "serena",
    "--",
    "python",
    "-m",
    "uv",
    "tool",
    "run",
    "--from",
    "git+https://github.com/oraios/serena",
    "serena-mcp-server",
    "--context",
    "codex",
    "--project-from-cwd"
)

try {
    $null = Get-Command codex -ErrorAction Stop
} catch {
    throw "Codex CLI is not available in PATH."
}

try {
    $null = python -m uv --version
} catch {
    throw "uv is not available. Install it with: python -m pip install --user uv"
}

$serverConfigured = $true
try {
    $serverInfo = codex mcp get serena 2>$null
} catch {
    $serverConfigured = $false
}

if (-not $serverConfigured) {
    Write-Host "Serena MCP is not configured globally. Adding it now..."
    & codex @serenaArgs | Out-Host
    $serverInfo = codex mcp get serena
}

Write-Host "Serena MCP is configured for Codex."
$serverInfo | Out-Host

if ($Log) {
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm"
    Add-Content -Path $devLogPath -Value ""
    Add-Content -Path $devLogPath -Value ("- Session start {0}: Serena preflight passed." -f $timestamp)
    Write-Host "Session entry appended to docs/DEV_LOG.md."
}
