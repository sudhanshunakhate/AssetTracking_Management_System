# Build frontend (Vite) then backend WAR (Spring Boot) for Tomcat ROOT.
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
if (-not (Test-Path "$Root\frontend\package.json")) {
  $Root = Split-Path -Parent $Root
}

Write-Host "==> Frontend: npm ci / install + build"
Set-Location "$Root\frontend"
if (Test-Path "package-lock.json") {
  npm ci
} else {
  npm install
}
npm run build
if (-not (Test-Path "dist\index.html")) { throw "Frontend build missing dist/index.html" }

Write-Host "==> Backend: mvn clean package -DskipTests"
Set-Location "$Root\backend"
mvn -q clean package -DskipTests
$War = Join-Path (Get-Location) "target\ROOT.war"
if (-not (Test-Path $War)) { throw "WAR not found: $War" }

Write-Host "OK Frontend: $Root\frontend\dist"
Write-Host "OK Backend WAR: $War"
