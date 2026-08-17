# End-to-end: GRN (inspection-needed) → Quarantine → Pending IAPR → Approve → Home store
#
#   cd backend
#   powershell -ExecutionPolicy Bypass -File .\verify-inspection-approval.ps1

$ErrorActionPreference = 'Stop'
$Base = 'http://localhost:8085/api/v1'
$script:pass = 0
$script:fail = 0

function Check($label, $condition, $detail = '') {
    if ($condition) {
        $script:pass++
        Write-Host ("  PASS  {0}" -f $label) -ForegroundColor Green
    } else {
        $script:fail++
        Write-Host ("  FAIL  {0} -> {1}" -f $label, $detail) -ForegroundColor Red
    }
}

function Api($method, $path, $body = $null) {
    $params = @{
        Uri         = "$Base$path"
        Method      = $method
        Headers     = $script:H
        ContentType = 'application/json'
    }
    if ($null -ne $body) {
        $params.Body = ($body | ConvertTo-Json -Depth 8)
    }
    try {
        return Invoke-RestMethod @params
    } catch {
        $resp = $_.ErrorDetails.Message
        if (-not $resp) { $resp = $_.Exception.Message }
        throw "API $method $path failed: $resp"
    }
}

function Get-Stock($itemId, $locId) {
    $page = Api Get "/stock?itemId=$itemId&locationId=$locId&page=1&pageSize=50"
    $sum = [decimal]0
    foreach ($r in @($page.data)) { $sum += [decimal]$r.availableQty }
    return $sum
}

function TodayIso { (Get-Date).ToString('yyyy-MM-dd') }

Write-Host "`n=== Inspection Approval E2E ===" -ForegroundColor Cyan

$login = Invoke-RestMethod -Uri "$Base/auth/login" -Method Post -ContentType 'application/json' `
    -Body (@{ loginId = 'admin'; password = 'Admin@123' } | ConvertTo-Json)
$script:H = @{ Authorization = "Bearer $($login.token)" }
Check 'admin login' ([bool]$login.token) 'no token'

$entities  = Api Get '/entities?page=1&pageSize=20'
$locations = Api Get '/locations?page=1&pageSize=100'
$employees = Api Get '/employees?page=1&pageSize=20'
$items     = Api Get '/items?page=1&pageSize=100'
$units     = Api Get '/units?page=1&pageSize=20'
$vendors   = Api Get '/vendors?page=1&pageSize=20'

$entityId = $entities.data[0].entityId
$store = $locations.data | Where-Object { $_.systemRole -ne 'QUARANTINE' -and $_.systemRole -ne 'REJECTED' } | Select-Object -First 1
$locId = $store.locationId
$empId = $employees.data[0].employeeId
$vendorId = $vendors.data[0].vendorId
$uomId = $units.data[0].unitId
$today = TodayIso
$tag = "I$((Get-Date).ToString('HHmmss'))"

$item = $items.data | Where-Object { $_.currentLocationId -ne $null } | Select-Object -First 1
if (-not $item) { throw 'No item with home store found' }

# Flag item for inspection
$patched = Api Put "/items/$($item.itemId)" @{
    itemCode = $item.itemCode
    itemName = $item.itemName
    itemType = $item.itemType
    uomId = $item.uomId
    isActive = $true
    inspectionNeeded = $true
    currentLocationId = $item.currentLocationId
}
Check 'item inspectionNeeded=true' ($patched.inspectionNeeded -eq $true) ($patched | ConvertTo-Json -Compress)

$quarLoc = ($locations.data | Where-Object { $_.systemRole -eq 'QUARANTINE' -and $_.buId -eq $store.buId } | Select-Object -First 1).locationId
$homeLoc = $item.currentLocationId
Check 'quarantine loc resolved' ($quarLoc -ne $null) "bu=$($store.buId)"
Check 'home store on item' ($homeLoc -ne $null) $item.itemCode

$qBefore = Get-Stock $item.itemId $quarLoc
$hBefore = Get-Stock $item.itemId $homeLoc
$batch = "B-$tag"
$acceptQty = 2

$grn = Api Post '/grn' @{
    docDate = $today
    entityId = $entityId
    locationId = $locId
    partyId = $vendorId
    inspectedByEmpId = $empId
    inspectionDate = $today
    preparedByEmpId = $empId
    preparedDate = $today
    docSubmitAction = 'SUBMIT'
    lines = @(@{
        srNo = 1
        itemId = $item.itemId
        uomId = $item.uomId
        receivedQty = $acceptQty
        acceptedQty = $acceptQty
        rejectedQty = 0
        qty = $acceptQty
        locationId = $locId
        batchLotNo = $batch
    })
}
Check 'GRN Completed' ($grn.status -eq 'Completed') $grn.status

$qAfterGrn = Get-Stock $item.itemId $quarLoc
Check 'quarantine +accepted on GRN' (($qAfterGrn - $qBefore) -eq $acceptQty) "before=$qBefore after=$qAfterGrn"

Api Post '/inspection-approvals/sync-from-grn' @{} | Out-Null

$pending = Api Get "/inspection-approvals?status=Pending&page=1&pageSize=50"
$iapr = @($pending.data) | Where-Object { $_.referenceNo -eq $grn.docNo } | Select-Object -First 1
Check 'pending IAPR created' ($iapr -ne $null) $grn.docNo
if (-not $iapr) { throw 'No IAPR for GRN' }

$iaprDoc = Api Get "/inspection-approvals/$($iapr.docId)"
Check 'IAPR links GRN' ($iaprDoc.refTxnHeaderId -eq $grn.docId) "$($iaprDoc.refTxnHeaderId) vs $($grn.docId)"
Check 'IAPR assignee = inspector' ($iaprDoc.initiatedByEmpId -eq $empId) "$($iaprDoc.initiatedByEmpId)"

$approved = Api Put "/inspection-approvals/$($iapr.docId)" @{
    docDate = $today
    entityId = $entityId
    refTxnHeaderId = $grn.docId
    referenceNo = $grn.docNo
    initiatedByEmpId = $empId
    docSubmitAction = 'SUBMIT'
    lines = @(@{
        srNo = 1
        itemId = $item.itemId
        uomId = $item.uomId
        qty = $acceptQty
        batchLotNo = $batch
        locationId = $homeLoc
    })
}
Check 'IAPR Approved' ($approved.status -eq 'Approved') $approved.status

$qAfter = Get-Stock $item.itemId $quarLoc
$hAfter = Get-Stock $item.itemId $homeLoc
Check 'quarantine -qty after approve' (($qAfterGrn - $qAfter) -eq $acceptQty) "grn=$qAfterGrn after=$qAfter"
Check 'home store +qty after approve' (($hAfter - $hBefore) -eq $acceptQty) "before=$hBefore after=$hAfter"

Write-Host "`n=== Summary: pass=$script:pass fail=$script:fail ===" -ForegroundColor Cyan
if ($script:fail -gt 0) { exit 1 }
