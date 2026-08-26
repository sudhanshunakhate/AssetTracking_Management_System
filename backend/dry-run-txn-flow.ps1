# Dry-run: GRN (3 items) --- Requisition --- Issue --- Return --- Transfer to Damaged --- Gatepass
# Then verify reports track the chain.
#
#   cd backend
#   powershell -ExecutionPolicy Bypass -File .\dry-run-txn-flow.ps1

$ErrorActionPreference = 'Stop'
$Base = 'http://localhost:8085/api/v1'
$script:pass = 0
$script:fail = 0
$script:docs = [ordered]@{}

function Check($label, $condition, $detail = '') {
    if ($condition) {
        $script:pass++
        Write-Host ("  PASS  {0}" -f $label) -ForegroundColor Green
    } else {
        $script:fail++
        Write-Host ("  FAIL  {0} -> {1}" -f $label, $detail) -ForegroundColor Red
    }
}

function Section($t) { Write-Host "`n=== $t ===" -ForegroundColor Cyan }

function Api($method, $path, $body = $null) {
    $params = @{
        Uri         = "$Base$path"
        Method      = $method
        Headers     = $script:H
        ContentType = 'application/json'
    }
    if ($null -ne $body) { $params.Body = ($body | ConvertTo-Json -Depth 10) }
    try {
        return Invoke-RestMethod @params
    } catch {
        $resp = $_.ErrorDetails.Message
        if (-not $resp) { $resp = $_.Exception.Message }
        throw "API $method $path failed: $resp"
    }
}

function Get-Stock($itemId, $locId) {
    $qs = 'itemId={0}&locationId={1}&page=1&pageSize=50' -f $itemId, $locId
    $page = Api Get "/stock?$qs"
    $sum = [decimal]0
    foreach ($r in @($page.data)) { $sum += [decimal]$r.availableQty }
    return $sum
}

function TodayIso { (Get-Date).ToString('yyyy-MM-dd') }

# ---------------------------------------------------------------- login ----
Section '0. Authenticate'
$loginOk = $false
foreach ($pw in @('admin123', 'Admin@123')) {
    try {
        $login = Invoke-RestMethod -Uri "$Base/auth/login" -Method Post -ContentType 'application/json' `
            -Body (@{ loginId = 'admin'; password = $pw } | ConvertTo-Json)
        if ($login.token) {
            $script:H = @{ Authorization = "Bearer $($login.token)" }
            $loginOk = $true
            Write-Host "  Logged in as admin"
            break
        }
    } catch { }
}
Check 'admin login' $loginOk 'could not authenticate'

# ------------------------------------------------------------- masters ----
Section '1. Resolve masters'
$entities  = Api Get '/entities?page=1&pageSize=20'
$locations = Api Get '/locations?page=1&pageSize=100'
$vendors   = Api Get '/vendors?page=1&pageSize=20'
$employees = Api Get '/employees?page=1&pageSize=20'
$items     = Api Get '/items?page=1&pageSize=100'
$units     = Api Get '/units?page=1&pageSize=20'

$entityId = $entities.data[0].entityId
$vendorId = $vendors.data[0].vendorId
$emp = $employees.data[0]
$empId = $emp.employeeId
$today = TodayIso
$tag = "DRY$((Get-Date).ToString('HHmmss'))"

# Operational stores (non-system)
$stores = @($locations.data | Where-Object {
    -not $_.isSystemLocation -and ($_.locationType -eq 'Store' -or -not $_.systemRole)
})
if ($stores.Count -eq 0) { $stores = @($locations.data | Where-Object { -not $_.isSystemLocation }) }
$locA = $stores[0]
$locAId = $locA.locationId

# Damaged system location for this org
$damaged = @($locations.data | Where-Object {
    $_.systemRole -eq 'DAMAGED' -or
    ($_.locationCode -match 'DMG|DAMAGED' -or $_.locationName -match 'Damaged')
}) | Select-Object -First 1
if (-not $damaged) {
    throw "No Damaged system location found for entity $entityId"
}
$dmgId = $damaged.locationId

# Prefer consumables without inspection for clean stock posting to store
$cons = @($items.data | Where-Object {
    $_.itemType -eq 'consumable' -and -not $_.inspectionNeeded
})
if ($cons.Count -lt 2) {
    $cons = @($items.data | Where-Object { $_.itemType -eq 'consumable' })
}
$assets = @($items.data | Where-Object {
    $_.itemType -eq 'asset' -and -not $_.inspectionNeeded
})
if ($assets.Count -eq 0) {
    $assets = @($items.data | Where-Object { $_.itemType -eq 'asset' })
}
if ($cons.Count -lt 2) { throw 'Need at least 2 consumable items for dry-run' }
if ($assets.Count -lt 1) { throw 'Need at least 1 asset item for Asset Movement report track' }

$item1 = $cons[0]
$item2 = $cons[1]
$asset = $assets[0]
$assetSerial = "SN-$tag-A1"

# Employee base / To location for issue
$toLocId = if ($emp.baseLocationId) { $emp.baseLocationId } else { $locAId }

Write-Host "  Store A     : $($locA.locationCode) id=$locAId"
Write-Host "  Damaged     : $($damaged.locationCode) id=$dmgId role=$($damaged.systemRole)"
Write-Host "  Employee    : $($emp.employeeCode) id=$empId base=$toLocId"
Write-Host "  GRN items   : $($item1.itemCode), $($item2.itemCode), asset $($asset.itemCode) ($assetSerial)"
Write-Host "  Asset home  : $($asset.currentLocationId)"
Write-Host "  Tag         : $tag"

# ----------------------------------------------------------------- GRN ----
Section '2. GRN --- insert 3 items (2 consumable + 1 asset)'
$before1 = Get-Stock $item1.itemId $locAId
$before2 = Get-Stock $item2.itemId $locAId
$assetHomeId = if ($asset.currentLocationId) { $asset.currentLocationId } else { $locAId }
$beforeA = Get-Stock $asset.itemId $assetHomeId

$grn = Api Post '/grn' @{
    docDate = $today
    partyId = $vendorId
    locationId = $locAId
    entityId = $entityId
    inspectedByEmpId = $empId
    inspectionDate = $today
    invoiceNo = "INV-$tag"
    remarks = "dry-run GRN 3 items $tag"
    totalReceivedQty = 21
    totalAcceptedQty = 21
    totalRejectedQty = 0
    docSubmitAction = 'SUBMIT'
    lines = @(
        @{
            srNo = 1; itemId = $item1.itemId; uomId = $item1.uomId
            receivedQty = 10; acceptedQty = 10; rejectedQty = 0; qty = 10
            locationId = $locAId; batchLotNo = "B1-$tag"; remark = 'consumable-1'
        },
        @{
            srNo = 2; itemId = $item2.itemId; uomId = $item2.uomId
            receivedQty = 10; acceptedQty = 10; rejectedQty = 0; qty = 10
            locationId = $locAId; batchLotNo = "B2-$tag"; remark = 'consumable-2'
        },
        @{
            srNo = 3; itemId = $asset.itemId; uomId = $asset.uomId
            receivedQty = 1; acceptedQty = 1; rejectedQty = 0; qty = 1
            locationId = $locAId; serialNo = $assetSerial; remark = 'asset-for-movement'
        }
    )
}
$script:docs.grn = $grn
Check 'GRN created' ($grn.docId -ne $null) $grn
Check 'GRN Completed' ($grn.status -eq 'Completed') $grn.status
Check 'GRN has 3 lines' ((@((Api Get "/grn/$($grn.docId)").lines)).Count -eq 3) ''
$after1 = Get-Stock $item1.itemId $locAId
$after2 = Get-Stock $item2.itemId $locAId
Check "GRN stock item1 +10" (($after1 - $before1) -eq 10) ("before={0} after={1}" -f $before1, $after1)
Check "GRN stock item2 +10" (($after2 - $before2) -eq 10) ("before={0} after={1}" -f $before2, $after2)
Write-Host ("  Doc: {0} id={1}" -f $grn.docNo, $grn.docId)

# Asset inspection-needed items land in Quarantine; approve so unit is at home store.
Section '2b. Inspection Approval --- release asset to home store'
try { Api Post '/inspection-approvals/sync-from-grn' @{} | Out-Null } catch { }
$pending = Api Get '/inspection-approvals?status=Pending&page=1&pageSize=50'
$iapr = @($pending.data) | Where-Object { $_.refTxnHeaderId -eq $grn.docId -or $_.referenceNo -eq $grn.docNo } | Select-Object -First 1
Check 'Pending inspection for GRN asset' ($null -ne $iapr) $grn.docNo
if ($iapr) {
    $approved = Api Put "/inspection-approvals/$($iapr.docId)" @{
        docDate = $today
        entityId = $entityId
        refTxnHeaderId = $grn.docId
        referenceNo = $grn.docNo
        initiatedByEmpId = $empId
        docSubmitAction = 'SUBMIT'
        lines = @(
            @{
                srNo = 1; itemId = $asset.itemId; uomId = $asset.uomId
                qty = 1; serialNo = $assetSerial; locationId = $assetHomeId
            }
        )
    }
    Check 'Inspection Approved' ($approved.status -eq 'Approved') $approved.status
    $afterA = Get-Stock $asset.itemId $assetHomeId
    Check 'Asset at home store after inspection' (($afterA - $beforeA) -eq 1) ("before={0} after={1} home={2}" -f $beforeA, $afterA, $assetHomeId)
}

# ---------------------------------------------------------- Requisition ----
Section '3. Store Requisition --- raise 1'
$req = Api Post '/requisitions' @{
    docDate = $today
    requiredByDate = $today
    locationId = $locAId
    initiatedByEmpId = $empId
    docSubtype = 'EMPLOYEE'
    purpose = "dry-run req $tag"
    remarks = "dry-run requisition $tag"
    docSubmitAction = 'SUBMIT'
    lines = @(
        @{
            srNo = 1; itemId = $item1.itemId; uomId = $item1.uomId
            requestedQty = 1; qty = 1; locationId = $locAId
        }
    )
}
$script:docs.req = $req
Check 'REQ created' ($req.docId -ne $null) $req
Check 'REQ Requested (ready to issue)' ($req.status -eq 'Requested') $req.status
Write-Host ("  Doc: {0} id={1}" -f $req.docNo, $req.docId)

# --------------------------------------------------------------- Issue ----
Section '4. Store Issue --- issue 1 against requisition'
$issBeforeStore = Get-Stock $item1.itemId $locAId
$issBeforeTo = Get-Stock $item1.itemId $toLocId
$issue = Api Post '/material-issues' @{
    docDate = $today
    locationId = $locAId
    fromLocationId = $locAId
    toLocationId = $toLocId
    initiatedByEmpId = $empId
    refTxnHeaderId = $req.docId
    remarks = "dry-run issue $tag"
    docSubmitAction = 'SUBMIT'
    lines = @(
        @{
            srNo = 1; itemId = $item1.itemId; uomId = $item1.uomId
            qty = 1; requestedQty = 1; locationId = $locAId
            issuedToEmpId = $empId
            batchLotNo = "B1-$tag"
        }
    )
}
$script:docs.issue = $issue
Check 'ISS created' ($issue.docId -ne $null) $issue
Check 'ISS Issued' ($issue.status -eq 'Issued') $issue.status
$issAfterStore = Get-Stock $item1.itemId $locAId
$issAfterTo = Get-Stock $item1.itemId $toLocId
Check 'ISS -1 at store' (($issBeforeStore - $issAfterStore) -eq 1) ("before={0} after={1}" -f $issBeforeStore, $issAfterStore)
if ($toLocId -ne $locAId) {
    Check 'ISS +1 at To Location' (($issAfterTo - $issBeforeTo) -eq 1) ("before={0} after={1}" -f $issBeforeTo, $issAfterTo)
}
$reqAfterIssue = Api Get "/requisitions/$($req.docId)"
Check 'REQ marked Issued' ($reqAfterIssue.status -eq 'Issued') $reqAfterIssue.status
Write-Host ("  Doc: {0} id={1}" -f $issue.docNo, $issue.docId)

# -------------------------------------------------------------- Return ----
Section '5. Material Return --- return issued qty to store'
$retBeforeStore = Get-Stock $item1.itemId $locAId
$retBeforeFrom = Get-Stock $item1.itemId $toLocId
$ret = Api Post '/returns' @{
    docDate = $today
    locationId = $locAId
    fromLocationId = $toLocId
    initiatedByEmpId = $empId
    remarks = "dry-run return $tag"
    docSubmitAction = 'SUBMIT'
    lines = @(
        @{
            srNo = 1; itemId = $item1.itemId; uomId = $item1.uomId
            qty = 1; locationId = $locAId
            batchLotNo = "B1-$tag"
        }
    )
}
$script:docs.ret = $ret
Check 'MRET created' ($ret.docId -ne $null) $ret
Check 'MRET Returned' ($ret.status -eq 'Returned') $ret.status
$retAfterStore = Get-Stock $item1.itemId $locAId
$retAfterFrom = Get-Stock $item1.itemId $toLocId
Check 'MRET +1 at return store' (($retAfterStore - $retBeforeStore) -eq 1) ("before={0} after={1}" -f $retBeforeStore, $retAfterStore)
if ($toLocId -ne $locAId) {
    Check 'MRET -1 at from (employee base)' (($retBeforeFrom - $retAfterFrom) -eq 1) ("before={0} after={1}" -f $retBeforeFrom, $retAfterFrom)
}
Write-Host ("  Doc: {0} id={1}" -f $ret.docNo, $ret.docId)

# ------------------------------------------- Transfer to Damaged ----
Section '6. Material Transfer --- asset to Damaged (needs outward gatepass)'
$xferFromLoc = $assetHomeId
$trFromBefore = Get-Stock $asset.itemId $xferFromLoc
$trDmgBefore = Get-Stock $asset.itemId $dmgId
$xfer = Api Post '/transfers' @{
    docDate = $today
    locationId = $xferFromLoc
    fromLocationId = $xferFromLoc
    toLocationId = $dmgId
    remarks = "dry-run transfer damaged $tag"
    purpose = 'Damaged goods move'
    docSubmitAction = 'SUBMIT'
    lines = @(
        @{
            srNo = 1; itemId = $asset.itemId; uomId = $asset.uomId
            qty = 1; locationId = $xferFromLoc
            serialNo = $assetSerial
            remark = 'send asset to damaged'
        }
    )
}
$script:docs.xfer = $xfer
Check 'MTRF created' ($xfer.docId -ne $null) $xfer
Check 'MTRF Pending for Outward' ($xfer.status -eq 'Pending for Outward') $xfer.status
$trFromAfter = Get-Stock $asset.itemId $xferFromLoc
$trDmgAfter = Get-Stock $asset.itemId $dmgId
Check 'MTRF -1 asset at store' (($trFromBefore - $trFromAfter) -eq 1) ("before={0} after={1}" -f $trFromBefore, $trFromAfter)
Check 'MTRF +1 asset at Damaged' (($trDmgAfter - $trDmgBefore) -eq 1) ("before={0} after={1}" -f $trDmgBefore, $trDmgAfter)
Write-Host ("  Doc: {0} id={1} status={2}" -f $xfer.docNo, $xfer.docId, $xfer.status)

# ------------------------------------------------------------- Gatepass ----
Section '7. Gatepass Outward --- against damaged transfer'
$gpo = Api Post '/gatepass/outward' @{
    docDate = $today
    locationId = $xferFromLoc
    fromLocationId = $xferFromLoc
    toLocationId = $dmgId
    refTxnHeaderId = $xfer.docId
    returnFlag = 'N'
    remarks = "dry-run gatepass for damaged transfer $tag"
    purpose = 'Outward for damaged transfer'
    docSubmitAction = 'SUBMIT'
    lines = @(
        @{
            srNo = 1; itemId = $asset.itemId; uomId = $asset.uomId
            qty = 1; locationId = $xferFromLoc
            serialNo = $assetSerial
        }
    )
}
$script:docs.gpo = $gpo
Check 'GPO created' ($gpo.docId -ne $null) $gpo
Check 'GPO Completed' ($gpo.status -eq 'Completed' -or $gpo.status -eq 'Issued') $gpo.status
$xferAfterGp = Api Get "/transfers/$($xfer.docId)"
Check 'Transfer now Transferred after gatepass' ($xferAfterGp.status -eq 'Transferred') $xferAfterGp.status
Write-Host "  Doc: $($gpo.docNo) id=$($gpo.docId)"

# -------------------------------------------------------------- Reports ----
Section '8. Reports --- track the full flow'
$itemIds = @($item1.itemId, $item2.itemId, $asset.itemId) | Select-Object -Unique
$docNos = @(
    $grn.docNo, $req.docNo, $issue.docNo, $ret.docNo, $xfer.docNo, $gpo.docNo
)

# Full Report
$fullQs = 'page=1&pageSize=200&fromDate={0}&toDate={0}' -f $today
$full = Api Get "/reports/full-report?$fullQs"
$fullDocs = @($full.data | Where-Object {
    $n = if ($_.txnNo) { $_.txnNo } else { $_.docNo }
    $docNos -contains $n
})
Check 'Full Report sees dry-run docs' ($fullDocs.Count -ge 4) ("found={0} of {1}" -f $fullDocs.Count, $docNos.Count)
Write-Host "  Full Report matches:"
$fullDocs | Select-Object -Unique -Property txnNo, txnType, status | ForEach-Object {
    Write-Host ("    {0}  {1}  {2}" -f $_.txnNo, $_.txnType, $_.status)
}

# Item Ledger for item1 (GRN + Issue + Return)
$led1Qs = 'page=1&pageSize=200&itemId={0}&fromDate={1}&toDate={1}' -f $item1.itemId, $today
$ledger1 = Api Get "/reports/item-ledger?$led1Qs"
$l1 = @($ledger1.data)
$hasGrnL = (@($l1 | Where-Object { $_.docNo -eq $grn.docNo })).Count -gt 0
$hasIssL = (@($l1 | Where-Object { $_.docNo -eq $issue.docNo })).Count -gt 0
$hasRetL = (@($l1 | Where-Object { $_.docNo -eq $ret.docNo })).Count -gt 0
Check 'Item Ledger item1 has GRN' $hasGrnL ''
Check 'Item Ledger item1 has Issue' $hasIssL ''
Check 'Item Ledger item1 has Return' $hasRetL ''
Write-Host ("  Item1 ledger rows today: {0}" -f $l1.Count)
$l1 | Select-Object -First 10 | ForEach-Object {
    Write-Host ("    {0} {1} recv={2} iss={3} bal={4} loc={5}" -f $_.docNo, $_.docType, $_.receipt, $_.issue, $_.balance, $_.locationCode)
}

# Item Ledger for asset (GRN + Transfer)
$led2Qs = 'page=1&pageSize=200&itemId={0}&fromDate={1}&toDate={1}' -f $asset.itemId, $today
$ledger2 = Api Get "/reports/item-ledger?$led2Qs"
$l2 = @($ledger2.data)
$hasXferL = (@($l2 | Where-Object { $_.docNo -eq $xfer.docNo })).Count -gt 0
$hasGpoInLedger = (@($l2 | Where-Object { $_.docNo -eq $gpo.docNo })).Count -gt 0
Check 'Item Ledger asset has Transfer' $hasXferL ''
Check 'Item Ledger skips linked Gatepass (stock on transfer)' (-not $hasGpoInLedger) ''
Write-Host ("  Asset ledger rows today: {0}" -f $l2.Count)
$l2 | Select-Object -First 10 | ForEach-Object {
    Write-Host ("    {0} {1} recv={2} iss={3} bal={4} loc={5}" -f $_.docNo, $_.docType, $_.receipt, $_.issue, $_.balance, $_.locationCode)
}

# Stock Movement (asset register)
$movQs = 'page=1&pageSize=200&fromDate={0}&toDate={0}' -f $today
$mov = Api Get "/reports/stock-movement?$movQs"
$movHits = @($mov.data | Where-Object {
    $n = if ($_.document) { $_.document } else { $_.docNo }
    $docNos -contains $n
})
Check 'Stock Movement has dry-run asset rows' ($movHits.Count -gt 0) ("found={0}" -f $movHits.Count)
$movHasXfer = (@($movHits | Where-Object { $_.document -eq $xfer.docNo -or $_.docNo -eq $xfer.docNo })).Count -gt 0
$movHasGrn = (@($movHits | Where-Object { $_.document -eq $grn.docNo -or $_.docNo -eq $grn.docNo })).Count -gt 0
Check 'Stock Movement includes GRN asset' $movHasGrn ''
Check 'Stock Movement includes damaged transfer' $movHasXfer ''
Write-Host ("  Stock Movement matches: {0}" -f $movHits.Count)
$movHits | Select-Object -First 12 | ForEach-Object {
    Write-Host ("    {0} {1} {2} -> {3} asset={4}" -f $_.document, $_.movementType, $_.fromLocation, $_.toLocation, $_.assetId)
}

# Stock Register
$srQs = 'page=1&pageSize=200&fromDate={0}&toDate={0}' -f $today
$stockReg = Api Get "/reports/stock-register?$srQs"
$srHits = @($stockReg.data | Where-Object { $itemIds -contains $_.itemId })
Check 'Stock Register has flow items' ($srHits.Count -gt 0) ("found={0}" -f $srHits.Count)
Write-Host "  Stock Register:"
$srHits | ForEach-Object {
    Write-Host ("    {0} open={1} recv={2} iss={3} close={4}" -f $_.itemName, $_.openingBalance, $_.receiptDuringPeriod, $_.issueDuringPeriod, $_.closingBalance)
}

# Stock Owner
$owner = Api Get '/reports/stock-owner?page=1&pageSize=200'
$ownHits = @($owner.data | Where-Object { $itemIds -contains $_.itemId })
Check 'Stock Owner has flow items' ($ownHits.Count -gt 0) ("found={0}" -f $ownHits.Count)
Write-Host "  Stock Owner sample:"
$ownHits | Select-Object -First 8 | ForEach-Object {
    Write-Host ("    {0} at {1} qty={2} custody={3} last={4}" -f $_.itemCode, $_.storeCode, $_.currentQty, $_.custodyMode, $_.lastIssueDocNo)
}

# -------------------------------------------------------------- summary ----
Section 'SUMMARY'
Write-Host ("Passed: {0}   Failed: {1}" -f $pass, $fail)
Write-Host "`nDocuments created (open in UI):" -ForegroundColor Cyan
Write-Host ("  GRN        {0}  /transactions/grn/{1}" -f $grn.docNo, $grn.docId)
Write-Host ("  Requisition{0}  /transactions/requisitions/{1}" -f $req.docNo, $req.docId)
Write-Host ("  Issue      {0}  /transactions/issues/{1}" -f $issue.docNo, $issue.docId)
Write-Host ("  Return     {0}  /transactions/returns/{1}" -f $ret.docNo, $ret.docId)
Write-Host ("  Transfer   {0}  /transactions/transfers/{1}  ({2})" -f $xfer.docNo, $xfer.docId, $xferAfterGp.status)
Write-Host ("  Gatepass   {0}  /transactions/gatepass/{1}" -f $gpo.docNo, $gpo.docId)
Write-Host "`nSearch remarks / invoice for tag: $tag"
Write-Host "Reports: Full Report, Item Ledger, Stock Movement, Stock Register, Stock Owner (filter today)"

if ($fail -gt 0) { exit 1 } else { exit 0 }

