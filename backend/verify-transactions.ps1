# End-to-end exercise of every CAITS transaction type.
# Creates real documents, checks status / stock / BLS, and reports gaps.
#
#   cd backend
#   powershell -ExecutionPolicy Bypass -File .\verify-transactions.ps1

$ErrorActionPreference = 'Stop'
$Base = 'http://localhost:8085/api/v1'
$script:pass = 0
$script:fail = 0
$script:gaps = [System.Collections.Generic.List[string]]::new()

function Check($label, $condition, $detail = '') {
    if ($condition) {
        $script:pass++
        Write-Host ("  PASS  {0}" -f $label) -ForegroundColor Green
    } else {
        $script:fail++
        Write-Host ("  FAIL  {0} -> {1}" -f $label, $detail) -ForegroundColor Red
    }
}

function Gap($msg) {
    $script:gaps.Add($msg)
    Write-Host ("  GAP   {0}" -f $msg) -ForegroundColor Yellow
}

function Section($t) { Write-Host "`n=== $t ===" -ForegroundColor Cyan }

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

# ---------------------------------------------------------------- login ----
Section '0. Authenticate'
$login = Invoke-RestMethod -Uri "$Base/auth/login" -Method Post -ContentType 'application/json' `
    -Body (@{ loginId = 'admin'; password = 'Admin@123' } | ConvertTo-Json)
$script:H = @{ Authorization = "Bearer $($login.token)" }
Check 'admin login' ([bool]$login.token) 'no token'

# ------------------------------------------------------------- lookups ----
Section '1. Master data for flows'
$entities  = Api Get '/entities?page=1&pageSize=20'
$locations = Api Get '/locations?page=1&pageSize=50'
$vendors   = Api Get '/vendors?page=1&pageSize=20'
$employees = Api Get '/employees?page=1&pageSize=20'
$items     = Api Get '/items?page=1&pageSize=50'
$units     = Api Get '/units?page=1&pageSize=20'

Check 'entities'  (@($entities.data).Count  -gt 0) 'none'
Check 'locations' (@($locations.data).Count -gt 0) 'none'
Check 'vendors'   (@($vendors.data).Count   -gt 0) 'none'
Check 'employees' (@($employees.data).Count -gt 0) 'none'
Check 'items'     (@($items.data).Count     -gt 0) 'none'

$entityId = $entities.data[0].entityId
$locA = $locations.data[0].locationId
$locB = if (@($locations.data).Count -gt 1) { $locations.data[1].locationId } else { $null }
$vendorId = $vendors.data[0].vendorId
$empId = $employees.data[0].employeeId
$today = TodayIso
$tag = "T$((Get-Date).ToString('HHmmss'))"

$assetItems = @($items.data | Where-Object { $_.itemType -eq 'asset' })
$consItems  = @($items.data | Where-Object { $_.itemType -eq 'consumable' })

# Seed a consumable catalog item when the DB has none (common on fresh local data).
if ($consItems.Count -eq 0 -and @($units.data).Count -gt 0) {
    $uomIdSeed = $units.data[0].unitId
    $seedCode = "CONS-$tag"
    try {
        $seeded = Api Post '/items' @{
            itemCode = $seedCode
            itemName = "Verify Consumable $tag"
            itemType = 'consumable'
            uomId = $uomIdSeed
            isActive = $true
            isConsumable = $true
            trackBatchLot = $true
        }
        $consItems = @($seeded)
        Check 'seeded consumable item' ($seeded.itemId -ne $null) $seeded
    } catch {
        Gap "Could not seed consumable item: $($_.Exception.Message)"
    }
}

$asset = if ($assetItems.Count -gt 0) { $assetItems[0] } else { $items.data[0] }
$cons  = if ($consItems.Count  -gt 0) { $consItems[0] }  else { $items.data[0] }

if (-not $locB) {
    try {
        $buPage = Api Get "/business-units?page=1&pageSize=5&entityId=$entityId"
        $buId = if (@($buPage.data).Count -gt 0) { $buPage.data[0].buId } else { $null }
        $seedLoc = Api Post '/locations' @{
            locationCode = "LOC-$tag"
            locationName = "Verify Store B $tag"
            entityId = $entityId
            buId = $buId
            isActive = $true
        }
        $locB = $seedLoc.locationId
        Check 'seeded second location for transfer' ($locB -ne $null) $seedLoc
    } catch {
        Gap "Only one location and could not seed a second: $($_.Exception.Message)"
    }
}
if ($assetItems.Count -eq 0) {
    Gap 'No asset items — asset serial / BLS unit path uses a fallback item'
}

# ----------------------------------------------- Opening Stock (asset) ----
Section '2. Opening Stock — asset units + BLS'
$ostBefore = Get-Stock $asset.itemId $locA
$serial1 = "SN-$tag-01"
$serial2 = "SN-$tag-02"
$ost = Api Post '/opening-stock' @{
    docDate         = $today
    postingDate     = $today
    entityId        = $entityId
    locationId      = $locA
    partyId         = $vendorId
    remarks         = "verify-transactions opening $tag"
    docSubmitAction = 'SUBMIT'
    lines = @(
        @{
            srNo = 1; itemId = $asset.itemId; uomId = $asset.uomId
            qty = 1; acceptedQty = 1; receivedQty = 1
            serialNo = $serial1; ipAddress = '10.0.0.11'; locationId = $locA
        },
        @{
            srNo = 2; itemId = $asset.itemId; uomId = $asset.uomId
            qty = 1; acceptedQty = 1; receivedQty = 1
            serialNo = $serial2; hostname = "host-$tag"; locationId = $locA
        }
    )
}
Check 'OST created' ($ost.docId -ne $null) $ost
Check 'OST series' ($ost.docNo -like 'OST-*') $ost.docNo
Check 'OST Completed on SUBMIT' ($ost.status -eq 'Completed') $ost.status
$ostDoc = Api Get "/opening-stock/$($ost.docId)"
$blsOk = (@($ostDoc.lines) | Where-Object { $_.blsId -ne $null }).Count -eq 2
Check 'OST lines linked to BLS' $blsOk ((@($ostDoc.lines) | ForEach-Object { $_.blsId }) -join ',')
Check 'OST serials persisted' (
    (@($ostDoc.lines).serialNo -contains $serial1) -and (@($ostDoc.lines).serialNo -contains $serial2)
) ((@($ostDoc.lines).serialNo) -join ',')
$ostAfter = Get-Stock $asset.itemId $locA
Check 'OST +2 stock' (($ostAfter - $ostBefore) -eq 2) "before=$ostBefore after=$ostAfter"
$assetStock = Api Get "/stock?itemId=$($asset.itemId)&locationId=$locA&page=1&pageSize=100"
$bucket1 = @($assetStock.data | Where-Object { $_.batchLotNo -eq $serial1 })
$bucket2 = @($assetStock.data | Where-Object { $_.batchLotNo -eq $serial2 })
Check 'serial1 has its own stock bucket' ($bucket1.Count -eq 1 -and [decimal]$bucket1[0].availableQty -eq 1) ($bucket1 | ConvertTo-Json -Compress)
Check 'serial2 has its own stock bucket' ($bucket2.Count -eq 1 -and [decimal]$bucket2[0].availableQty -eq 1) ($bucket2 | ConvertTo-Json -Compress)

# ----------------------------------------------- Opening Stock draft ----
Section '3. Opening Stock — draft does not post stock'
$beforeDraft = Get-Stock $cons.itemId $locA
$ostDraft = Api Post '/opening-stock' @{
    docDate = $today; entityId = $entityId; locationId = $locA
    docSubmitAction = 'SAVE_DRAFT'
    lines = @(@{ srNo = 1; itemId = $cons.itemId; uomId = $cons.uomId; qty = 5; locationId = $locA; batchLotNo = "B-$tag" })
}
Check 'OST draft status' ($ostDraft.status -eq 'Draft') $ostDraft.status
$afterDraft = Get-Stock $cons.itemId $locA
Check 'OST draft stock unchanged' ($afterDraft -eq $beforeDraft) "before=$beforeDraft after=$afterDraft"

# --------------------------------------------------------------- GRN ----
Section '4. GRN — submit posts accepted qty'
$grnBatch = "GRN-B-$tag"
$grnBefore = Get-Stock $cons.itemId $locA
$grn = Api Post '/grn' @{
    docDate = $today; partyId = $vendorId; locationId = $locA
    invoiceNo = "INV-$tag"; remarks = "verify GRN $tag"
    totalReceivedQty = 10; totalAcceptedQty = 7; totalRejectedQty = 3
    docSubmitAction = 'SUBMIT'
    lines = @(
        @{
            srNo = 1; itemId = $cons.itemId; uomId = $cons.uomId
            receivedQty = 10; acceptedQty = 7; rejectedQty = 3; qty = 7
            locationId = $locA; batchLotNo = $grnBatch; remark = '3 rejected'
        }
    )
}
Check 'GRN Completed' ($grn.status -eq 'Completed') $grn.status
Check 'GRN series' ($grn.docNo -like 'GRN-*') $grn.docNo
$grnDoc = Api Get "/grn/$($grn.docId)"
Check 'GRN has blsId' ($grnDoc.lines[0].blsId -ne $null) $grnDoc.lines[0].blsId
$grnAfter = Get-Stock $cons.itemId $locA
Check 'GRN +7 stock (accepted only)' (($grnAfter - $grnBefore) -eq 7) "before=$grnBefore after=$grnAfter"

# -------------------------------------------------------- Requisition ----
Section '5. Requisition — submit needs approval, no stock'
$reqBefore = Get-Stock $cons.itemId $locA
$req = Api Post '/requisitions' @{
    docDate = $today; requiredByDate = $today
    locationId = $locA; initiatedByEmpId = $empId
    purpose = "verify req $tag"
    docSubmitAction = 'SUBMIT'
    lines = @(@{ srNo = 1; itemId = $cons.itemId; uomId = $cons.uomId; requestedQty = 3; qty = 3; locationId = $locA })
}
Check 'REQ Pending Approval' ($req.status -eq 'Pending Approval') $req.status
$reqAfterSubmit = Get-Stock $cons.itemId $locA
Check 'REQ submit does not change stock' ($reqAfterSubmit -eq $reqBefore) "before=$reqBefore after=$reqAfterSubmit"

$approved = Api Post "/requisitions/$($req.docId)/approve" @{ approvedByEmpId = $empId; approvedDate = $today; remarks = 'ok' }
Check 'REQ Approved' ($approved.status -eq 'Approved' -or $approved.docId -ne $null) ($approved | ConvertTo-Json -Compress)
$reqDoc = Api Get "/requisitions/$($req.docId)"
Check 'REQ status Approved after approve' ($reqDoc.status -eq 'Approved') $reqDoc.status
$reqAfterApprove = Get-Stock $cons.itemId $locA
Check 'REQ approve still no stock (sign=0)' ($reqAfterApprove -eq $reqBefore) "before=$reqBefore after=$reqAfterApprove"

# ------------------------------------------------------------- Issue ----
Section '6. Material Issue — SUBMIT depletes stock (FIFO, no batch on line)'
$issBefore = Get-Stock $cons.itemId $locA
if ($issBefore -lt 3) {
    Gap "Stock for consumable at locA is $issBefore (<3); issue may fail"
}
try {
    $issue = Api Post '/material-issues' @{
        docDate = $today; locationId = $locA; initiatedByEmpId = $empId
        refTxnHeaderId = $req.docId
        docSubmitAction = 'SUBMIT'
        lines = @(@{ srNo = 1; itemId = $cons.itemId; uomId = $cons.uomId; qty = 2; locationId = $locA })
    }
    Check 'ISS Completed (FIFO without batch)' ($issue.status -eq 'Completed') $issue.status
    Check 'ISS series' ($issue.docNo -like 'MISS-*') $issue.docNo
    $issAfter = Get-Stock $cons.itemId $locA
    Check 'ISS -2 stock via FIFO' (($issBefore - $issAfter) -eq 2) "before=$issBefore after=$issAfter"
} catch {
    Check 'ISS SUBMIT succeeds' $false $_.Exception.Message
    Gap "Material Issue SUBMIT failed: $($_.Exception.Message)"
}

# Draft issue does not post
$issDraftBefore = Get-Stock $cons.itemId $locA
$issDraft = Api Post '/material-issues' @{
    docDate = $today; locationId = $locA; initiatedByEmpId = $empId
    docSubmitAction = 'SAVE_DRAFT'
    lines = @(@{ srNo = 1; itemId = $cons.itemId; uomId = $cons.uomId; qty = 1; locationId = $locA })
}
Check 'ISS draft status' ($issDraft.status -eq 'Draft') $issDraft.status
$issDraftAfter = Get-Stock $cons.itemId $locA
Check 'ISS draft stock unchanged' ($issDraftAfter -eq $issDraftBefore) "before=$issDraftBefore after=$issDraftAfter"

# ----------------------------------------------------------- Transfer ----
Section '7. Material Transfer — from A to B'
if ($locB) {
    $trFromBefore = Get-Stock $cons.itemId $locA
    $trToBefore   = Get-Stock $cons.itemId $locB
    if ($trFromBefore -lt 1) {
        Gap "Not enough stock at locA ($trFromBefore) to transfer"
    }
    try {
        $xfer = Api Post '/transfers' @{
            docDate = $today
            locationId = $locA
            fromLocationId = $locA
            toLocationId = $locB
            docSubmitAction = 'SUBMIT'
            lines = @(@{ srNo = 1; itemId = $cons.itemId; uomId = $cons.uomId; qty = 1; locationId = $locA })
        }
        Check 'MTRF Completed (FIFO without batch)' ($xfer.status -eq 'Completed') $xfer.status
        $trFromAfter = Get-Stock $cons.itemId $locA
        $trToAfter   = Get-Stock $cons.itemId $locB
        Check 'MTRF -1 at from' (($trFromBefore - $trFromAfter) -eq 1) "before=$trFromBefore after=$trFromAfter"
        Check 'MTRF +1 at to'   (($trToAfter - $trToBefore) -eq 1) "before=$trToBefore after=$trToAfter"
    } catch {
        Check 'MTRF SUBMIT succeeds' $false $_.Exception.Message
    }
} else {
    Gap 'Skipped transfer — need a second location'
}

# ------------------------------------------------------------- Return ----
Section '8. Material Return — SUBMIT adds stock'
$retBefore = Get-Stock $cons.itemId $locA
$ret = Api Post '/returns' @{
    docDate = $today; locationId = $locA; initiatedByEmpId = $empId
    docSubmitAction = 'SUBMIT'
    lines = @(@{ srNo = 1; itemId = $cons.itemId; uomId = $cons.uomId; qty = 1; locationId = $locA })
}
Check 'MRET Completed' ($ret.status -eq 'Completed') $ret.status
$retAfter = Get-Stock $cons.itemId $locA
Check 'MRET +1 stock' (($retAfter - $retBefore) -eq 1) "before=$retBefore after=$retAfter"

# ---------------------------------------------------- Gatepass Outward ----
Section '9. Gatepass Outward — SUBMIT depletes'
$gpoBefore = Get-Stock $cons.itemId $locA
try {
    $gpo = Api Post '/gatepass/outward' @{
        docDate = $today; locationId = $locA; fromLocationId = $locA
        returnFlag = 'Y'
        docSubmitAction = 'SUBMIT'
        lines = @(@{ srNo = 1; itemId = $cons.itemId; uomId = $cons.uomId; qty = 1; locationId = $locA })
    }
    Check 'GPO Completed' ($gpo.status -eq 'Completed') $gpo.status
    $gpoAfter = Get-Stock $cons.itemId $locA
    Check 'GPO -1 stock' (($gpoBefore - $gpoAfter) -eq 1) "before=$gpoBefore after=$gpoAfter"
} catch {
    Check 'GPO SUBMIT succeeds' $false $_.Exception.Message
}

# ----------------------------------------------------- Gatepass Inward ----
Section '10. Gatepass Inward — Pending then Approve posts stock'
$gpiBefore = Get-Stock $cons.itemId $locA
$gpi = Api Post '/gatepass/inward' @{
    docDate = $today; locationId = $locA
    docSubmitAction = 'SUBMIT'
    lines = @(@{ srNo = 1; itemId = $cons.itemId; uomId = $cons.uomId; qty = 1; locationId = $locA })
}
Check 'GPI Pending Approval' ($gpi.status -eq 'Pending Approval') $gpi.status
$gpiMid = Get-Stock $cons.itemId $locA
Check 'GPI submit no stock yet' ($gpiMid -eq $gpiBefore) "before=$gpiBefore mid=$gpiMid"
$gpiAppr = Api Post "/gatepass/inward/$($gpi.docId)/approve" @{ approvedByEmpId = $empId; approvedDate = $today }
$gpiDoc = Api Get "/gatepass/inward/$($gpi.docId)"
Check 'GPI Approved' ($gpiDoc.status -eq 'Approved') $gpiDoc.status
$gpiAfter = Get-Stock $cons.itemId $locA
Check 'GPI approve +1 stock' (($gpiAfter - $gpiBefore) -eq 1) "before=$gpiBefore after=$gpiAfter"

# ------------------------------------------- duplicate serial conflict ----
Section '11. BLS uniqueness — duplicate serial rejected'
try {
    Api Post '/opening-stock' @{
        docDate = $today; entityId = $entityId; locationId = $locA
        docSubmitAction = 'SUBMIT'
        lines = @(@{
            srNo = 1; itemId = $asset.itemId; uomId = $asset.uomId
            qty = 1; serialNo = $serial1; locationId = $locA
        })
    } | Out-Null
    Check 'duplicate serial blocked' $false 'create succeeded but should have failed'
} catch {
    Check 'duplicate serial blocked' $true $_.Exception.Message
}

# -------------------------------------------------------------- lists ----
Section '12. List endpoints respond'
foreach ($p in @(
    '/opening-stock?page=1&pageSize=5',
    '/grn?page=1&pageSize=5',
    '/requisitions?page=1&pageSize=5',
    '/material-issues?page=1&pageSize=5',
    '/transfers?page=1&pageSize=5',
    '/returns?page=1&pageSize=5',
    '/gatepass/inward?page=1&pageSize=5',
    '/gatepass/outward?page=1&pageSize=5'
)) {
    $page = Api Get $p
    Check "list $p" ($null -ne $page.data) 'no data array'
}

# -------------------------------------------------------------- summary ----
Section 'SUMMARY'
Write-Host ("Passed: {0}   Failed: {1}   Gaps noted: {2}" -f $pass, $fail, $gaps.Count)
if ($gaps.Count -gt 0) {
    Write-Host "`nGaps / follow-ups:" -ForegroundColor Yellow
    $gaps | ForEach-Object { Write-Host "  - $_" -ForegroundColor Yellow }
}
if ($fail -gt 0) { exit 1 } else { exit 0 }
