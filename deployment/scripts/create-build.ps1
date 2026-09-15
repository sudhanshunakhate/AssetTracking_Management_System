<#
.SYNOPSIS
  Create a production Tomcat build (frontend + backend ROOT.war) and refresh the handoff folder.

.DESCRIPTION
  1) Builds the React/Vite frontend → frontend/dist
  2) Packages Spring Boot WAR with embedded UI → backend/target/ROOT.war
  3) Copies artifacts into deployment/CAITS_SERVER_HANDOFF for server handoff

.EXAMPLE
  cd D:\AssetTracking_Management_System\deployment\scripts
  .\create-build.ps1
#>
[CmdletBinding()]
param(
  # Skip "npm ci" and use existing node_modules (faster when deps already installed)
  [switch]$SkipNpmInstall
)

$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $PSScriptRoot
if (-not (Test-Path "$Root\frontend\package.json")) {
  $Root = Split-Path -Parent $Root
}

Write-Host ""
Write-Host "CAITS production build" -ForegroundColor Cyan
Write-Host "Repo: $Root"
Write-Host ""

# --- Frontend ---
Write-Host "==> [1/3] Frontend build (Vite)" -ForegroundColor Yellow
Set-Location "$Root\frontend"
if (-not $SkipNpmInstall) {
  if (Test-Path "package-lock.json") {
    Write-Host "    npm ci ..."
    npm ci
  } else {
    Write-Host "    npm install ..."
    npm install
  }
} else {
  Write-Host "    Skipping npm install (-SkipNpmInstall)"
}
npm run build
if (-not (Test-Path "dist\index.html")) {
  throw "Frontend build failed - dist\index.html not found"
}
Write-Host "    OK  $Root\frontend\dist" -ForegroundColor Green

# --- Backend WAR ---
Write-Host "==> [2/3] Backend WAR (Maven)" -ForegroundColor Yellow
# Unlock target if a local Java process still holds files from spring-boot:run
Get-Process -Name java -ErrorAction SilentlyContinue | ForEach-Object {
  try {
    $cmd = (Get-CimInstance Win32_Process -Filter "ProcessId=$($_.Id)" -ErrorAction SilentlyContinue).CommandLine
    if ($cmd -and ($cmd -match 'caits-backend|spring-boot|ROOT\.war')) {
      Write-Host "    Stopping Java PID $($_.Id) that may lock backend\target ..."
      Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
    }
  } catch { }
}
Start-Sleep -Seconds 2

Set-Location "$Root\backend"
mvn -q clean package -DskipTests
$War = Join-Path $Root "backend\target\ROOT.war"
if (-not (Test-Path $War)) {
  throw "Backend build failed - ROOT.war not found"
}
$warMb = [math]::Round((Get-Item $War).Length / 1MB, 1)
Write-Host "    OK  $War  ($warMb MB)" -ForegroundColor Green

# --- Handoff package ---
Write-Host "==> [3/3] Refresh deployment handoff folder" -ForegroundColor Yellow
$Handoff = Join-Path $Root "deployment\CAITS_SERVER_HANDOFF"
$AppDir = Join-Path $Handoff "01_application"
New-Item -ItemType Directory -Force -Path $AppDir | Out-Null
Copy-Item $War (Join-Path $AppDir "ROOT.war") -Force

$DepFront = Join-Path $Root "deployment\frontend"
$DepBack = Join-Path $Root "deployment\backend"
New-Item -ItemType Directory -Force -Path $DepFront, $DepBack | Out-Null
Remove-Item "$DepFront\*" -Recurse -Force -ErrorAction SilentlyContinue
Copy-Item "$Root\frontend\dist\*" $DepFront -Recurse -Force
Copy-Item $War (Join-Path $DepBack "ROOT.war") -Force

Write-Host ""
Write-Host "BUILD COMPLETE" -ForegroundColor Green
Write-Host "--------------"
Write-Host "Frontend dist : $Root\frontend\dist"
Write-Host "Backend WAR   : $War"
Write-Host "Handoff WAR   : $AppDir\ROOT.war"
Write-Host ""
Write-Host "Deploy to Tomcat:"
Write-Host "  Copy ROOT.war → %CATALINA_HOME%\webapps\ROOT.war"
Write-Host "  Or run: .\deploy-tomcat.ps1"
Write-Host ""
