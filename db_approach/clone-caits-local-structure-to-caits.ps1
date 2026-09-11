<#
.SYNOPSIS
    Clone structure (no data) from schema caits_local into schema caits on the shared DB.

.DESCRIPTION
    Uses pg_dump --schema-only, rewrites the schema name, restores into caits.
    Strips PostgreSQL 17-only dump directives so it can load on PostgreSQL 15.
    Does not copy rows. Run 048_seed_caits_schema_admin.sql afterwards for admin.

.EXAMPLE
    $env:CAITS_DEV_PW = 'caits123'
    .\clone-caits-local-structure-to-caits.ps1 -Force
#>
[CmdletBinding()]
param(
    [switch]$Force
)

$ErrorActionPreference = 'Stop'

$dumpDir = Join-Path $PSScriptRoot 'db_dump'
$dumpFile = Join-Path $dumpDir 'caits_schema_from_caits_local.sql'
$pgBin = 'C:\Program Files\PostgreSQL\17\bin'
$devHost = '192.168.0.223'
$devDb = 'caits'
$devUser = 'caits'

if (-not (Test-Path $dumpDir)) {
    New-Item -ItemType Directory -Path $dumpDir | Out-Null
}

$devPw = [Environment]::GetEnvironmentVariable('CAITS_DEV_PW')
if ([string]::IsNullOrWhiteSpace($devPw)) { throw 'Set $env:CAITS_DEV_PW before running.' }

Write-Host ""
Write-Host "This DROPS and recreates schema 'caits' from 'caits_local' structure (no data)." -ForegroundColor Yellow
Write-Host "Schema caits_local is left untouched." -ForegroundColor Yellow
Write-Host ""

if (-not $Force) {
    $answer = Read-Host "Type 'clone' to confirm"
    if ($answer -ne 'clone') {
        Write-Host "Cancelled." -ForegroundColor Red
        return
    }
}

$env:PGPASSWORD = $devPw
Write-Host "-> Dumping caits_local (schema-only)..." -ForegroundColor Cyan
& "$pgBin\pg_dump.exe" -h $devHost -p 5432 -U $devUser -d $devDb `
    -n caits_local --schema-only --clean --if-exists --no-owner --no-acl -f $dumpFile
if ($LASTEXITCODE -ne 0) { throw "pg_dump failed: $LASTEXITCODE" }

$content = Get-Content -Raw -Path $dumpFile
$content = $content -replace 'caits_local', 'caits'
$content = $content -replace '(?m)^SET transaction_timeout = 0;\r?\n', ''
$content = $content -replace '(?m)^\\restrict .+\r?\n', ''
$content = $content -replace '(?m)^\\unrestrict\s*\r?\n?', ''
Set-Content -Path $dumpFile -Value $content -NoNewline

Write-Host "-> Restoring into schema caits..." -ForegroundColor Cyan
& "$pgBin\psql.exe" -h $devHost -p 5432 -U $devUser -d $devDb -v ON_ERROR_STOP=1 -f $dumpFile
if ($LASTEXITCODE -ne 0) { throw "psql restore failed: $LASTEXITCODE" }

Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
Write-Host ""
Write-Host "Done. Schema caits now mirrors caits_local structure with no data." -ForegroundColor Green
Write-Host "Next: psql ... -f 048_seed_caits_schema_admin.sql" -ForegroundColor DarkGray
