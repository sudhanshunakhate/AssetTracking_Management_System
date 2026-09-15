# Deploy ROOT.war to local Tomcat and (re)start it.
param(
  [string]$CatalinaHome = $env:CATALINA_HOME,
  [string]$WarPath = ""
)

$ErrorActionPreference = "Stop"

if (-not $CatalinaHome -or -not (Test-Path $CatalinaHome)) {
  $CatalinaHome = "C:\Program Files\apache-tomcat-10.1.50"
}
if (-not (Test-Path $CatalinaHome)) {
  throw "CATALINA_HOME not found. Set `$env:CATALINA_HOME or install Tomcat 10.1."
}

$Root = Split-Path -Parent $PSScriptRoot
if (-not (Test-Path "$Root\backend\pom.xml")) {
  $Root = Split-Path -Parent $Root
}
if (-not $WarPath) {
  $WarPath = Join-Path $Root "backend\target\ROOT.war"
}
if (-not (Test-Path $WarPath)) {
  throw "WAR missing: $WarPath — run build-all.ps1 first"
}

$Webapps = Join-Path $CatalinaHome "webapps"
$Bin = Join-Path $CatalinaHome "bin"

Write-Host "==> Stopping Tomcat (if running)"
& "$Bin\shutdown.bat" 2>$null
Start-Sleep -Seconds 4

@(
  (Join-Path $Webapps "ROOT"),
  (Join-Path $Webapps "ROOT.war")
) | ForEach-Object {
  if (Test-Path $_) {
    Write-Host "Removing $_"
    Remove-Item $_ -Recurse -Force -ErrorAction SilentlyContinue
  }
}

Write-Host "==> Copying WAR -> $Webapps\ROOT.war"
Copy-Item $WarPath (Join-Path $Webapps "ROOT.war") -Force

Write-Host "==> Starting Tomcat"
& "$Bin\startup.bat"
Write-Host "Open http://localhost:8080/  Logs: $CatalinaHome\logs"
