# Refresh deployment/frontend and deployment/backend from latest builds.
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
if (-not (Test-Path "$Root\frontend\package.json")) {
  $Root = Split-Path -Parent $Root
}

$Dist = Join-Path $Root "frontend\dist"
$War = Join-Path $Root "backend\target\ROOT.war"
if (-not (Test-Path "$Dist\index.html")) { throw "Missing frontend dist — run build-all.ps1 first" }
if (-not (Test-Path $War)) { throw "Missing ROOT.war — run build-all.ps1 first" }

$DepFront = Join-Path $Root "deployment\frontend"
$DepBack = Join-Path $Root "deployment\backend"
New-Item -ItemType Directory -Force -Path $DepFront, $DepBack | Out-Null
Remove-Item "$DepFront\*" -Recurse -Force -ErrorAction SilentlyContinue
Copy-Item "$Dist\*" $DepFront -Recurse -Force
Copy-Item $War (Join-Path $DepBack "ROOT.war") -Force
Write-Host "OK $DepFront"
Write-Host "OK $DepBack\ROOT.war"
