# E2E stock flow: 1 asset + 1 consumable. Measures inv_stock_mst after each step.
$ErrorActionPreference = 'Stop'
$base = 'http://localhost:8085/api/v1'
$pgHost = '192.168.0.223'; $pgDb = 'caits'; $pgUser = 'caits'
$env:PGPASSWORD = 'caits123'

# Fixtures (dev)
$assetId = 6          # LAP-TOSHIBA-SATELLITE-C640 (serialized)
$consId  = 4          # ITM007 paper napkin
$assetUom = 3
$consUom  = 1
$storeA = 2           # LOC-002 Admin Store (primary)
$storeB = 1           # LOC-001 FM Store (transfer dest)
$entityId = 2
$empId = 2            # EMP00
$vendorId = 1
$serial = "E2E-ASSET-$(Get-Date -Format 'HHmmss')"
$today = (Get-Date).ToString('yyyy-MM-dd')

function Sql([string]$q) {
  psql -h $pgHost -p 5432 -U $pgUser -d $pgDb -t -A -F '|' -c "SET search_path TO caits_local; $q" 2>$null |
    Where-Object { $_ -and $_ -notmatch '^SET$' }
}

function StockSnapshot([string]$label) {
  $rows = Sql @"
SELECT i.itm_item_code || '@' || l.loc_location_code || '=' ||
       COALESCE(s.stk_current_qty,0)::text
FROM (VALUES ($assetId), ($consId)) v(item_id)
CROSS JOIN (VALUES ($storeA), ($storeB)) loc(loc_id)
LEFT JOIN inv_stock_mst s
  ON s.stk_item_id_itm = v.item_id AND s.stk_location_id_loc = loc.loc_id AND COALESCE(s.stk_isactive,true)
LEFT JOIN inv_item_mst i ON i.itm_item_id = v.item_id
LEFT JOIN org_location_mst l ON l.loc_location_id = loc.loc_id
ORDER BY v.item_id, loc.loc_id;
"@
  $map = @{}
  foreach ($r in $rows) {
    if ($r -match '^(.+)=(.+)$') { $map[$Matches[1]] = [decimal]$Matches[2] }
  }
  [pscustomobject]@{
    Step = $label
    Asset_A = $map["LAP-TOSHIBA-SATELLITE-C640@LOC-002"]
    Asset_B = $map["LAP-TOSHIBA-SATELLITE-C640@LOC-001"]
    Cons_A  = $map["ITM007@LOC-002"]
    Cons_B  = $map["ITM007@LOC-001"]
  }
}

function Api($method, $path, $body) {
  $headers = @{ Authorization = "Bearer $script:token" }
  $params = @{
    Uri = "$base$path"
    Method = $method
    Headers = $headers
    ContentType = 'application/json'
  }
  if ($null -ne $body) { $params.Body = ($body | ConvertTo-Json -Depth 10 -Compress) }
  try {
    return Invoke-RestMethod @params
  } catch {
    $err = $_.ErrorDetails.Message
    if (-not $err) { $err = $_.Exception.Message }
    throw "$method $path failed: $err"
  }
}

# --- login ---
$login = Invoke-RestMethod -Uri "$base/auth/login" -Method POST -ContentType 'application/json' `
  -Body '{"loginId":"admin","password":"Admin@123"}'
$script:token = $login.token
Write-Host "Logged in as $($login.user.employeeName). Serial=$serial"

$report = [System.Collections.Generic.List[object]]::new()
$report.Add((StockSnapshot '0_BASELINE'))

# --- 1 Opening Stock: +1 asset unit + +10 consumable at Admin Store ---
$ost = Api POST '/opening-stock' @{
  docDate = $today
  entityId = $entityId
  locationId = $storeA
  preparedByEmpId = $empId
  preparedDate = $today
  remarks = 'E2E stock flow opening'
  docSubmitAction = 'SUBMIT'
  lines = @(
    @{
      srNo = 1; itemId = $assetId; uomId = $assetUom; qty = 1; receivedQty = 1; acceptedQty = 1
      locationId = $storeA; serialNo = $serial; itemCondition = 'Good'
    },
    @{
      srNo = 2; itemId = $consId; uomId = $consUom; qty = 10; receivedQty = 10; acceptedQty = 10
      locationId = $storeA
    }
  )
}
Write-Host "1 Opening Stock: $($ost.docNo) status=$($ost.status)"
$report.Add((StockSnapshot '1_AFTER_OPENING_STOCK'))

# --- 2 Requisition: request 1 asset + 3 consumable (no stock change) ---
$sr = Api POST '/requisitions' @{
  docDate = $today
  requiredByDate = $today
  locationId = $storeA
  entityId = $entityId
  initiatedByEmpId = $empId
  departmentId = $null
  docSubtype = 'EMPLOYEE'
  employeeRefCode = 'EMP00'
  preparedByEmpId = $empId
  preparedDate = $today
  remarks = 'E2E requisition'
  docSubmitAction = 'SUBMIT'
  lines = @(
    @{ srNo = 1; itemId = $assetId; uomId = $assetUom; requestedQty = 1; qty = 1; locationId = $storeA }
    @{ srNo = 2; itemId = $consId; uomId = $consUom; requestedQty = 3; qty = 3; locationId = $storeA }
  )
}
Write-Host "2 Requisition: $($sr.docNo) status=$($sr.status)"
$report.Add((StockSnapshot '2_AFTER_REQUISITION'))

# --- 3 Store Issue against requisition: -1 asset, -3 consumable ---
$iss = Api POST '/material-issues' @{
  docDate = $today
  locationId = $storeA
  entityId = $entityId
  initiatedByEmpId = $empId
  refTxnHeaderId = $sr.id
  preparedByEmpId = $empId
  preparedDate = $today
  remarks = 'E2E issue'
  docSubmitAction = 'SUBMIT'
  lines = @(
    @{
      srNo = 1; itemId = $assetId; uomId = $assetUom; qty = 1; locationId = $storeA
      serialNo = $serial
    }
    @{
      srNo = 2; itemId = $consId; uomId = $consUom; qty = 3; locationId = $storeA
    }
  )
}
Write-Host "3 Issue: $($iss.docNo) status=$($iss.status)"
$report.Add((StockSnapshot '3_AFTER_ISSUE'))

# --- 4 Transfer: move 2 consumable Admin → FM ---
$trf = Api POST '/transfers' @{
  docDate = $today
  fromLocationId = $storeA
  toLocationId = $storeB
  locationId = $storeA
  entityId = $entityId
  preparedByEmpId = $empId
  preparedDate = $today
  remarks = 'E2E transfer'
  docSubmitAction = 'SUBMIT'
  lines = @(
    @{ srNo = 1; itemId = $consId; uomId = $consUom; qty = 2; locationId = $storeA }
  )
}
Write-Host "4 Transfer: $($trf.docNo) status=$($trf.status)"
$report.Add((StockSnapshot '4_AFTER_TRANSFER'))

# --- 5 Return: +1 consumable back to Admin ---
$rtn = Api POST '/returns' @{
  docDate = $today
  locationId = $storeA
  entityId = $entityId
  initiatedByEmpId = $empId
  preparedByEmpId = $empId
  preparedDate = $today
  remarks = 'E2E return'
  docSubmitAction = 'SUBMIT'
  lines = @(
    @{ srNo = 1; itemId = $consId; uomId = $consUom; qty = 1; locationId = $storeA }
  )
}
Write-Host "5 Return: $($rtn.docNo) status=$($rtn.status)"
$report.Add((StockSnapshot '5_AFTER_RETURN'))

# --- 6 GRN: +5 consumable at Admin ---
$grn = Api POST '/grn' @{
  docDate = $today
  partyId = $vendorId
  locationId = $storeA
  entityId = $entityId
  preparedByEmpId = $empId
  preparedDate = $today
  remarks = 'E2E GRN'
  docSubmitAction = 'SUBMIT'
  lines = @(
    @{
      srNo = 1; itemId = $consId; uomId = $consUom
      receivedQty = 5; acceptedQty = 5; rejectedQty = 0; qty = 5
      locationId = $storeA
    }
  )
}
Write-Host "6 GRN: $($grn.docNo) status=$($grn.status)"
$report.Add((StockSnapshot '6_AFTER_GRN'))

Write-Host ''
Write-Host '=== STOCK SNAPSHOTS (qty at store) ==='
$report | Format-Table -AutoSize | Out-String | Write-Host

# Expected deltas from baseline
$b = $report[0]
$f = $report[$report.Count - 1]
$expectedAssetA = [decimal]$b.Asset_A + 1 - 1   # +OST -Issue = baseline
$expectedConsA  = [decimal]$b.Cons_A + 10 - 3 - 2 + 1 + 5
$expectedConsB  = [decimal]$b.Cons_B + 2

$checks = @(
  [pscustomobject]@{ Check = 'Requisition did not change stock'; Pass = ($report[1].Asset_A -eq $report[2].Asset_A -and $report[1].Cons_A -eq $report[2].Cons_A) }
  [pscustomobject]@{ Check = "Asset Admin after OST+Issue == baseline ($expectedAssetA)"; Pass = ([decimal]$f.Asset_A -eq $expectedAssetA) }
  [pscustomobject]@{ Check = "Consumable Admin final == $expectedConsA (base+10-3-2+1+5)"; Pass = ([decimal]$f.Cons_A -eq $expectedConsA) }
  [pscustomobject]@{ Check = "Consumable FM after transfer == $expectedConsB"; Pass = ([decimal]$f.Cons_B -eq $expectedConsB) }
  [pscustomobject]@{ Check = 'No negative stock on tested rows'; Pass = (
      [decimal]$f.Asset_A -ge 0 -and [decimal]$f.Cons_A -ge 0 -and [decimal]$f.Cons_B -ge 0
    )}
)

Write-Host '=== PASS/FAIL ==='
$checks | Format-Table -AutoSize | Out-String | Write-Host
$fail = @($checks | Where-Object { -not $_.Pass }).Count
Write-Host "RESULT: $(if ($fail -eq 0) { 'ALL CHECKS PASSED' } else { \"$fail CHECK(S) FAILED\" })"
Write-Host "Docs: OST=$($ost.docNo) SR=$($sr.docNo) ISS=$($iss.docNo) TRF=$($trf.docNo) RTN=$($rtn.docNo) GRN=$($grn.docNo)"
