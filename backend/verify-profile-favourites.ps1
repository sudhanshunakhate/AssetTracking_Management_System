# Verify Profile + Favourite menus APIs
$ErrorActionPreference = 'Stop'
$Base = 'http://localhost:8085/api/v1'
$pass = 0; $fail = 0

function Check($label, $ok, $detail) {
  if ($ok) { $script:pass++; Write-Host "  PASS  $label" -ForegroundColor Green }
  else { $script:fail++; Write-Host "  FAIL  $label -> $detail" -ForegroundColor Red }
}

Write-Host "`n1. Login" -ForegroundColor Cyan
$login = Invoke-RestMethod -Uri "$Base/auth/login" -Method Post -ContentType 'application/json' `
  -Body (@{ loginId='admin'; password='Admin@123' } | ConvertTo-Json)
$H = @{ Authorization = "Bearer $($login.token)" }
Check 'login ok' ($login.token) 'no token'

Write-Host "`n2. /auth/me enriched" -ForegroundColor Cyan
$me = Invoke-RestMethod -Uri "$Base/auth/me" -Headers $H
Check 'has loginId' ([bool]$me.loginId) $me.loginId
Check 'has employeeId' ($me.employeeId -ne $null) $me.employeeId
Check 'has favouriteMenuCodes array' ($null -ne $me.favouriteMenuCodes) 'missing'

Write-Host "`n3. /auth/profile from employee master" -ForegroundColor Cyan
$p = Invoke-RestMethod -Uri "$Base/auth/profile" -Headers $H
Check 'employeeCode' ([bool]$p.employeeCode) $p.employeeCode
Check 'firstName' ([bool]$p.firstName) $p.firstName
Check 'email' ([bool]$p.email) $p.email
Check 'loginId matches' ($p.loginId -eq $me.loginId) "$($p.loginId) vs $($me.loginId)"
Check 'employeeId matches me' ($p.employeeId -eq $me.employeeId) "$($p.employeeId)"
Check 'role present' ([bool]$p.role) $p.role

Write-Host "`n4. Save favourites" -ForegroundColor Cyan
$codes = @('DASH','GRN','SR','AIM')
$saved = Invoke-RestMethod -Uri "$Base/auth/favourites" -Method Put -Headers $H -ContentType 'application/json' `
  -Body (@{ menuCodes = $codes } | ConvertTo-Json)
Check 'saved 4 favourites' ($saved.menuCodes.Count -eq 4) ($saved.menuCodes -join ',')
Check 'order preserved' (($saved.menuCodes -join ',') -eq 'DASH,GRN,SR,AIM') ($saved.menuCodes -join ',')

Write-Host "`n5. Get favourites" -ForegroundColor Cyan
$got = Invoke-RestMethod -Uri "$Base/auth/favourites" -Headers $H
Check 'get matches save' (($got.menuCodes -join ',') -eq 'DASH,GRN,SR,AIM') ($got.menuCodes -join ',')

Write-Host "`n6. /auth/me returns favourites" -ForegroundColor Cyan
$me2 = Invoke-RestMethod -Uri "$Base/auth/me" -Headers $H
Check 'me carries favourites' (($me2.favouriteMenuCodes -join ',') -eq 'DASH,GRN,SR,AIM') ($me2.favouriteMenuCodes -join ',')

Write-Host "`n7. Reject unavailable menu" -ForegroundColor Cyan
$rejected = $false
try {
  Invoke-RestMethod -Uri "$Base/auth/favourites" -Method Put -Headers $H -ContentType 'application/json' `
    -Body (@{ menuCodes = @('DASH','NOT-A-MENU') } | ConvertTo-Json) | Out-Null
} catch { $rejected = $true }
Check 'unknown menu code rejected' $rejected 'accepted invalid code'

Write-Host "`n8. Clear favourites" -ForegroundColor Cyan
$cleared = Invoke-RestMethod -Uri "$Base/auth/favourites" -Method Put -Headers $H -ContentType 'application/json' `
  -Body (@{ menuCodes = @() } | ConvertTo-Json)
Check 'cleared to empty' ($cleared.menuCodes.Count -eq 0) ($cleared.menuCodes.Count)

# Restore a useful set for manual UI testing
Invoke-RestMethod -Uri "$Base/auth/favourites" -Method Put -Headers $H -ContentType 'application/json' `
  -Body (@{ menuCodes = @('DASH','GRN','SR') } | ConvertTo-Json) | Out-Null

Write-Host "`n$pass passed, $fail failed" -ForegroundColor $(if ($fail -eq 0) {'Green'} else {'Red'})
if ($fail -gt 0) { exit 1 }
