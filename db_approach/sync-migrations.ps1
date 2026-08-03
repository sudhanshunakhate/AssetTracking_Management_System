<#
.SYNOPSIS
    Reports which CAITS migrations are missing from a database, and optionally applies them.

.DESCRIPTION
    Reads metadata/db/migrations.json and compares the recorded "applied" state for the
    chosen environment. Dry run by default — nothing touches a database unless -Apply is
    passed, and applying to dev additionally requires typing the environment name.

.EXAMPLE
    .\sync-migrations.ps1                          # what is pending on dev?
    .\sync-migrations.ps1 -Environment local       # what is pending locally?
    .\sync-migrations.ps1 -Apply                   # apply pending to dev (prompts)
#>
[CmdletBinding()]
param(
    [ValidateSet('local', 'dev')]
    [string]$Environment = 'dev',

    [switch]$Apply,

    # Skips the typed confirmation. Intended for scripted runs only.
    [switch]$Force
)

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$ledgerPath = Join-Path $repoRoot 'metadata\db\migrations.json'
if (-not (Test-Path $ledgerPath)) { throw "Ledger not found: $ledgerPath" }
$ledger = Get-Content $ledgerPath -Raw | ConvertFrom-Json

# Connection details. Passwords come from the environment so they stay out of the repo:
#   $env:CAITS_LOCAL_PW / $env:CAITS_DEV_PW
$targets = @{
    local = @{ PgHost = 'localhost';     Port = 5432; Db = 'postgres'; User = 'postgres'; PwVar = 'CAITS_LOCAL_PW' }
    dev   = @{ PgHost = '192.168.0.223'; Port = 5432; Db = 'caits';    User = 'caits';    PwVar = 'CAITS_DEV_PW' }
}
$target = $targets[$Environment]

$pending = @($ledger.migrations | Where-Object { -not $_.applied.$Environment })

Write-Host ""
Write-Host "Environment : $Environment  ($($target.User)@$($target.PgHost):$($target.Port)/$($target.Db))"
Write-Host "Ledger      : $ledgerPath"
Write-Host "Recorded    : $($ledger.migrations.Count) migration(s)"
Write-Host "Pending     : $($pending.Count)"
Write-Host ""

if ($pending.Count -eq 0) {
    Write-Host "Nothing to do - $Environment is up to date." -ForegroundColor Green
    return
}

foreach ($m in $pending) {
    Write-Host ("  [ ] {0}" -f $m.id)
    Write-Host ("      {0}" -f $m.file) -ForegroundColor DarkGray
    Write-Host ("      {0}" -f $m.description) -ForegroundColor DarkGray
}
Write-Host ""

if (-not $Apply) {
    Write-Host "Dry run. Re-run with -Apply to execute these against '$Environment'." -ForegroundColor Yellow
    return
}

if (-not $Force) {
    Write-Host "About to modify the '$Environment' database." -ForegroundColor Yellow
    $answer = Read-Host "Type '$Environment' to confirm"
    if ($answer -ne $Environment) {
        Write-Host "Cancelled - nothing was run." -ForegroundColor Red
        return
    }
}

$pw = [Environment]::GetEnvironmentVariable($target.PwVar)
if ([string]::IsNullOrWhiteSpace($pw)) {
    throw "Set `$env:$($target.PwVar) with the $Environment database password before using -Apply."
}
$env:PGPASSWORD = $pw

$today = Get-Date -Format 'yyyy-MM-dd'
$applied = @()
try {
    foreach ($m in $pending) {
        $sqlPath = Join-Path $repoRoot $m.file
        if (-not (Test-Path $sqlPath)) { throw "Missing SQL file for $($m.id): $sqlPath" }

        Write-Host "-> $($m.id)" -ForegroundColor Cyan
        & psql -h $target.PgHost -p $target.Port -U $target.User -d $target.Db -v ON_ERROR_STOP=1 -f $sqlPath
        if ($LASTEXITCODE -ne 0) { throw "$($m.id) failed with exit code $LASTEXITCODE. Later migrations were skipped." }

        $m.applied.$Environment = $today
        $applied += $m.id
    }
}
finally {
    Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
    if ($applied.Count -gt 0) {
        # Record partial progress too, so a failed run does not lose what already succeeded.
        $ledger.updated = $today
        $ledger | ConvertTo-Json -Depth 8 | Set-Content $ledgerPath -Encoding UTF8
        Write-Host ""
        Write-Host "Applied and recorded: $($applied -join ', ')" -ForegroundColor Green
    }
}
