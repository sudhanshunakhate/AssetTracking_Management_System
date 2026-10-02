# Enable LAN HTTPS (self-signed) so Windows/OS push notifications work
# without a purchased certificate. Run from repo root or backend folder.
#
# Usage:
#   .\scripts\enable-lan-https.ps1
#   .\scripts\enable-lan-https.ps1 -HostName 192.168.0.223 -Port 8443
#
# Then start the backend. Open https://HOST:PORT , accept the browser warning once,
# log in, and click "Allow Windows notifications".

param(
  [string]$HostName = $(try { (Get-NetIPAddress -AddressFamily IPv4 |
      Where-Object { $_.IPAddress -notlike '127.*' -and $_.PrefixOrigin -ne 'WellKnown' } |
      Select-Object -First 1 -ExpandProperty IPAddress) } catch { 'localhost' }),
  [int]$Port = 8443
)

$env:CAITS_TLS_ENABLED = 'true'
$env:CAITS_TLS_HOST = $HostName
$env:CAITS_TLS_PORT = "$Port"
$env:CAITS_SECURITY_COOKIE_SECURE = 'true'
$env:CAITS_CORS_ALLOWED_ORIGINS = "https://${HostName}:${Port},http://localhost:5173,http://127.0.0.1:5173,*"

Write-Host ""
Write-Host "CAITS LAN HTTPS env set for this PowerShell session:"
Write-Host "  CAITS_TLS_ENABLED=true"
Write-Host "  CAITS_TLS_HOST=$HostName"
Write-Host "  CAITS_TLS_PORT=$Port"
Write-Host "  CAITS_SECURITY_COOKIE_SECURE=true"
Write-Host "  CAITS_CORS_ALLOWED_ORIGINS=https://${HostName}:${Port},..."
Write-Host ""
Write-Host "Next:"
Write-Host "  cd backend"
Write-Host "  mvn spring-boot:run"
Write-Host "Then open https://${HostName}:${Port}  (accept the certificate warning once)."
Write-Host "Keystore (auto-created): uploads/caits-tls.p12  password: caits-tls"
Write-Host ""
