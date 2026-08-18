<#
.SYNOPSIS
    Replaces local caits_local schema with an exact copy from the shared dev database.

.DESCRIPTION
    Dumps schema caits_local from dev (192.168.0.223/caits) and restores into
    local Postgres (localhost/postgres). This wipes all local caits_local data.

    Passwords from environment (never stored in repo):
      $env:CAITS_DEV_PW   — dev database
      $env:CAITS_LOCAL_PW — local postgres

.EXAMPLE
    $env:CAITS_DEV_PW = '<dev-password>'
    $env:CAITS_LOCAL_PW = '<local-password>'
    .\clone-dev-to-local.ps1

.EXAMPLE
    .\clone-dev-to-local.ps1 -Force   # skip typed confirmation
#>
[CmdletBinding()]
param(
    [switch]$Force
)

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$dumpDir = Join-Path $PSScriptRoot 'db_dump'
$dumpFile = Join-Path $dumpDir 'caits_local_from_dev.sql'

if (-not (Test-Path $dumpDir)) {
    New-Item -ItemType Directory -Path $dumpDir | Out-Null
}

$devPw = [Environment]::GetEnvironmentVariable('CAITS_DEV_PW')
$localPw = [Environment]::GetEnvironmentVariable('CAITS_LOCAL_PW')
if ([string]::IsNullOrWhiteSpace($devPw)) { throw 'Set $env:CAITS_DEV_PW before running.' }
if ([string]::IsNullOrWhiteSpace($localPw)) { throw 'Set $env:CAITS_LOCAL_PW before running.' }

Write-Host ""
Write-Host "This will DROP and recreate schema caits_local on LOCAL postgres" -ForegroundColor Yellow
Write-Host "using a fresh dump from DEV (all local caits data will be replaced)." -ForegroundColor Yellow
Write-Host ""

if (-not $Force) {
    $answer = Read-Host "Type 'clone' to confirm"
    if ($answer -ne 'clone') {
        Write-Host "Cancelled." -ForegroundColor Red
        return
    }
}

Write-Host "-> Dumping caits_local from dev..." -ForegroundColor Cyan
$env:PGPASSWORD = $devPw
& pg_dump -h 192.168.0.223 -p 5432 -U caits -d caits `
    -n caits_local --clean --if-exists --no-owner --no-acl -f $dumpFile
if ($LASTEXITCODE -ne 0) { throw "pg_dump failed with exit code $LASTEXITCODE" }
Write-Host "   Saved: $dumpFile ($((Get-Item $dumpFile).Length) bytes)"

Write-Host "-> Restoring into local postgres..." -ForegroundColor Cyan
$env:PGPASSWORD = $localPw
& psql -h localhost -p 5432 -U postgres -d postgres -v ON_ERROR_STOP=1 -f $dumpFile
if ($LASTEXITCODE -ne 0) { throw "psql restore failed with exit code $LASTEXITCODE" }

Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
Write-Host ""
Write-Host "Local caits_local is now a replica of dev." -ForegroundColor Green
Write-Host "Switch application.yml to localhost if you want the backend to use local." -ForegroundColor DarkGray
