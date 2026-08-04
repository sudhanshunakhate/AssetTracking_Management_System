# Creates a clearly tagged UI demo: masters + transactions.
# Login: admin / Admin@123
# Search UI lists for codes containing DEMO-UI-

$ErrorActionPreference = 'Stop'
$Base = 'http://localhost:8085/api/v1'
$tag = "DEMO-UI-$(Get-Date -Format 'yyyyMMdd-HHmm')"
$today = (Get-Date).ToString('yyyy-MM-dd')
$report = [ordered]@{}

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

function Step($t) { Write-Host "`n=== $t ===" -ForegroundColor Cyan }

function Get-Stock($itemId, $locId) {
    $page = Api Get "/stock?itemId=$itemId&locationId=$locId&page=1&pageSize=50"
    $sum = [decimal]0
    foreach ($r in @($page.data)) { $sum += [decimal]$r.availableQty }
    return $sum
}

# ---------------------------------------------------------------- login
Step '0. Login (admin)'
$login = Invoke-RestMethod -Uri "$Base/auth/login" -Method Post -ContentType 'application/json' `
    -Body (@{ loginId = 'admin'; password = 'Admin@123' } | ConvertTo-Json)
$script:H = @{ Authorization = "Bearer $($login.token)" }
$report.login = "admin / Admin@123"
$report.tag = $tag
Write-Host "Logged in as $($login.user.employeeName)"

# ------------------------------------------------------------- masters
Step '1. Create / resolve masters'

# Unit
$units = Api Get '/units?page=1&pageSize=100'
$unit = @($units.data) | Where-Object { $_.unitCode -eq 'DEMO-UOM' } | Select-Object -First 1
if (-not $unit) {
    $unit = Api Post '/units' @{
        unitCode = 'DEMO-UOM'
        unitName = 'Demo Unit (Nos)'
        desc     = "Created by $tag"
        isActive = $true
    }
}
$report.unit = "$($unit.unitCode) id=$($unit.unitId)"
Write-Host "Unit: $($report.unit)"

# Category
$cats = Api Get '/categories?page=1&pageSize=100'
$cat = @($cats.data) | Where-Object { $_.categoryCode -eq 'DEMO-CAT' } | Select-Object -First 1
if (-not $cat) {
    $cat = Api Post '/categories' @{
        categoryCode = 'DEMO-CAT'
        categoryName = 'Demo IT Hardware'
        desc         = "Created by $tag"
        isActive     = $true
    }
}
$report.category = "$($cat.categoryCode) id=$($cat.categoryId)"
Write-Host "Category: $($report.category)"

# Subcategory
$subs = Api Get '/subcategories?page=1&pageSize=200'
$sub = @($subs.data) | Where-Object { $_.subcategoryCode -eq 'DEMO-SUB' } | Select-Object -First 1
if (-not $sub) {
    $sub = Api Post '/subcategories' @{
        subcategoryCode = 'DEMO-SUB'
        subcategoryName = 'Demo Laptops'
        categoryId      = $cat.categoryId
        isActive        = $true
    }
}
$report.subcategory = "$($sub.subcategoryCode) id=$($sub.subcategoryId)"
Write-Host "Subcategory: $($report.subcategory)"

# Organization
$entities = Api Get '/entities?page=1&pageSize=50'
$entity = @($entities.data) | Where-Object { $_.entityCode -eq 'DEMO-ORG' } | Select-Object -First 1
if (-not $entity) {
    $entity = Api Post '/entities' @{
        entityCode = 'DEMO-ORG'
        entityName = 'Demo CAITS Org'
        shortName  = 'DEMO'
        city       = 'Pune'
        isActive   = $true
    }
}
$report.organization = "$($entity.entityCode) id=$($entity.entityId)"
Write-Host "Organization: $($report.organization)"

# OU
$bus = Api Get "/business-units?page=1&pageSize=50&entityId=$($entity.entityId)"
$bu = @($bus.data) | Where-Object { $_.buCode -eq 'DEMO-OU' } | Select-Object -First 1
if (-not $bu) {
    $bu = Api Post '/business-units' @{
        buCode   = 'DEMO-OU'
        buName   = 'Demo Pune OU'
        entityId = $entity.entityId
        buType   = 'Regional'
        city     = 'Pune'
        isActive = $true
    }
}
$report.operatingUnit = "$($bu.buCode) id=$($bu.buId)"
Write-Host "OU: $($report.operatingUnit)"

# Location A
$locations = Api Get '/locations?page=1&pageSize=100'
$locA = @($locations.data) | Where-Object { $_.locationCode -eq 'DEMO-STR-A' } | Select-Object -First 1
if (-not $locA) {
    $locA = Api Post '/locations' @{
        locationCode = 'DEMO-STR-A'
        locationName = 'Demo Store A (Main)'
        entityId     = $entity.entityId
        buId         = $bu.buId
        locationType = 'Store'
        isActive     = $true
    }
}
$report.storeA = "$($locA.locationCode) id=$($locA.locationId)"
Write-Host "Store A: $($report.storeA)"

# Location B (for transfer)
$locB = @($locations.data) | Where-Object { $_.locationCode -eq 'DEMO-STR-B' } | Select-Object -First 1
if (-not $locB) {
    # refresh list in case A was just created
    $locations = Api Get '/locations?page=1&pageSize=100'
    $locB = @($locations.data) | Where-Object { $_.locationCode -eq 'DEMO-STR-B' } | Select-Object -First 1
}
if (-not $locB) {
    $locB = Api Post '/locations' @{
        locationCode = 'DEMO-STR-B'
        locationName = 'Demo Store B (Secondary)'
        entityId     = $entity.entityId
        buId         = $bu.buId
        locationType = 'Store'
        isActive     = $true
    }
}
$report.storeB = "$($locB.locationCode) id=$($locB.locationId)"
Write-Host "Store B: $($report.storeB)"

# Vendor
$vendors = Api Get '/vendors?page=1&pageSize=100'
$vendor = @($vendors.data) | Where-Object { $_.vendorCode -eq 'DEMO-VND' } | Select-Object -First 1
if (-not $vendor) {
    $vendor = Api Post '/vendors' @{
        vendorCode = 'DEMO-VND'
        vendorName = 'Demo ACME Supplies'
        partyType  = 'Vendor'
        phone      = '9999900001'
        city       = 'Pune'
        isActive   = $true
    }
}
$report.vendor = "$($vendor.vendorCode) id=$($vendor.vendorId)"
Write-Host "Vendor: $($report.vendor)"

# Consumable item (unique per run so stock story is clean)
$itemCode = "DEMO-ITEM-$($tag.Substring(8))"
$item = Api Post '/items' @{
    itemCode      = $itemCode
    itemName      = "Demo A4 Paper Ream ($tag)"
    itemType      = 'consumable'
    categoryId    = $cat.categoryId
    subcategoryId = $sub.subcategoryId
    uomId         = $unit.unitId
    isActive      = $true
    isConsumable  = $true
    trackBatchLot = $true
}
$report.item = "$($item.itemCode) id=$($item.itemId)"
Write-Host "Item: $($report.item)"

# Employee for approve/issue
$employees = Api Get '/employees?page=1&pageSize=20'
$emp = @($employees.data) | Select-Object -First 1
if (-not $emp) { throw 'No employees found — need at least one for approve/issue' }
$report.employee = "$($emp.employeeCode) id=$($emp.employeeId) ($($emp.firstName))"
Write-Host "Employee used: $($report.employee)"

# --------------------------------------------------------- transactions
Step '2. Opening Stock plus 20 at Store A'
$ost = Api Post '/opening-stock' @{
    docDate         = $today
    postingDate     = $today
    entityId        = $entity.entityId
    locationId      = $locA.locationId
    partyId         = $vendor.vendorId
    remarks         = "UI demo opening $tag"
    docSubmitAction = 'SUBMIT'
    lines = @(
        @{
            srNo = 1; itemId = $item.itemId; uomId = $unit.unitId
            qty = 20; acceptedQty = 20; receivedQty = 20
            locationId = $locA.locationId; batchLotNo = "BATCH-$tag-OST"
            remark = 'Initial demo stock'
        }
    )
}
$stock1 = Get-Stock $item.itemId $locA.locationId
$report.openingStock = "$($ost.docNo) status=$($ost.status) stockNow=$stock1"
Write-Host $report.openingStock

Step '3. GRN plus 10 accepted of 12 received'
$grn = Api Post '/grn' @{
    docDate = $today
    partyId = $vendor.vendorId
    locationId = $locA.locationId
    invoiceNo = "INV-$tag"
    remarks = "UI demo GRN $tag"
    totalReceivedQty = 12
    totalAcceptedQty = 10
    totalRejectedQty = 2
    docSubmitAction = 'SUBMIT'
    lines = @(
        @{
            srNo = 1; itemId = $item.itemId; uomId = $unit.unitId
            receivedQty = 12; acceptedQty = 10; rejectedQty = 2; qty = 10
            locationId = $locA.locationId; batchLotNo = "BATCH-$tag-GRN"
            remark = '2 rejected on inspection'
        }
    )
}
$stock2 = Get-Stock $item.itemId $locA.locationId
$report.grn = "$($grn.docNo) status=$($grn.status) stockNow=$stock2"
Write-Host $report.grn

Step '4. Requisition Pending then Approve - no stock change'
$stockBeforeReq = Get-Stock $item.itemId $locA.locationId
$req = Api Post '/requisitions' @{
    docDate = $today
    requiredByDate = $today
    locationId = $locA.locationId
    initiatedByEmpId = $emp.employeeId
    purpose = "UI demo requisition $tag"
    docSubmitAction = 'SUBMIT'
    lines = @(
        @{
            srNo = 1; itemId = $item.itemId; uomId = $unit.unitId
            requestedQty = 5; qty = 5; locationId = $locA.locationId
        }
    )
}
$approved = Api Post "/requisitions/$($req.docId)/approve" @{
    approvedByEmpId = $emp.employeeId
    approvedDate = $today
    remarks = "Approved for UI demo $tag"
}
$reqDoc = Api Get "/requisitions/$($req.docId)"
$stockAfterReq = Get-Stock $item.itemId $locA.locationId
$report.requisition = "$($req.docNo) status=$($reqDoc.status) stockUnchanged=$($stockBeforeReq -eq $stockAfterReq) stock=$stockAfterReq"
Write-Host $report.requisition

Step '5. Material Issue minus 3 against requisition'
$issue = Api Post '/material-issues' @{
    docDate = $today
    locationId = $locA.locationId
    initiatedByEmpId = $emp.employeeId
    refTxnHeaderId = $req.docId
    remarks = "UI demo issue $tag"
    docSubmitAction = 'SUBMIT'
    lines = @(
        @{
            srNo = 1; itemId = $item.itemId; uomId = $unit.unitId
            qty = 3; locationId = $locA.locationId
        }
    )
}
$stock3 = Get-Stock $item.itemId $locA.locationId
$report.issue = "$($issue.docNo) status=$($issue.status) stockNow=$stock3 ref=$($req.docNo)"
Write-Host $report.issue

Step '6. Transfer minus 2 from A plus 2 to B'
$xfer = Api Post '/transfers' @{
    docDate = $today
    locationId = $locA.locationId
    fromLocationId = $locA.locationId
    toLocationId = $locB.locationId
    remarks = "UI demo transfer $tag"
    docSubmitAction = 'SUBMIT'
    lines = @(
        @{
            srNo = 1; itemId = $item.itemId; uomId = $unit.unitId
            qty = 2; locationId = $locA.locationId
        }
    )
}
$stockA = Get-Stock $item.itemId $locA.locationId
$stockB = Get-Stock $item.itemId $locB.locationId
$report.transfer = "$($xfer.docNo) status=$($xfer.status) storeA=$stockA storeB=$stockB"
Write-Host $report.transfer

Step '7. Material Return plus 1 at Store A'
$ret = Api Post '/returns' @{
    docDate = $today
    locationId = $locA.locationId
    initiatedByEmpId = $emp.employeeId
    remarks = "UI demo return $tag"
    docSubmitAction = 'SUBMIT'
    lines = @(
        @{
            srNo = 1; itemId = $item.itemId; uomId = $unit.unitId
            qty = 1; locationId = $locA.locationId
        }
    )
}
$stockFinalA = Get-Stock $item.itemId $locA.locationId
$stockFinalB = Get-Stock $item.itemId $locB.locationId
$report.return = "$($ret.docNo) status=$($ret.status) storeA=$stockFinalA"
Write-Host $report.return

# Expected: OST+20, GRN+10 = 30; Issue-3 = 27; Transfer-2 = 25 at A (+2 at B); Return+1 = 26 at A
$report.finalStockA = "$stockFinalA (expect 26)"
$report.finalStockB = "$stockFinalB (expect 2)"

# Write report file for the user
$outPath = Join-Path $PSScriptRoot '..\docs\DEMO_UI_WORKFLOW_RUN.md'
$outPath = [System.IO.Path]::GetFullPath($outPath)

@"
# Demo UI Workflow Run — $tag

**Login:** ``admin`` / ``Admin@123``  
**Created via API** so you can open the same records in the UI.

## Masters (search codes starting with DEMO-)

| Master | Code / Name | Where in UI |
|--------|-------------|-------------|
| Unit | DEMO-UOM | Masters → Unit |
| Category | DEMO-CAT | Masters → Inventory Category |
| Sub-category | DEMO-SUB (under DEMO-CAT) | Masters → Inventory Sub-Category |
| Organization | DEMO-ORG | Masters → Organization |
| Operating Unit | DEMO-OU | Masters → Operating Unit |
| Store A | DEMO-STR-A | Masters → Location |
| Store B | DEMO-STR-B | Masters → Location |
| Vendor | DEMO-VND | Masters → Vendor/Party |
| Item | **$itemCode** | Masters → Item |

Employee used for approve/issue: $($report.employee)

## Transactions (filter/search remarks containing ``$tag``)

| Step | Document | Doc No | Status | Stock effect |
|------|----------|--------|--------|--------------|
| 1 | Opening Stock | $($ost.docNo) | $($ost.status) | +20 @ DEMO-STR-A |
| 2 | GRN | $($grn.docNo) | $($grn.status) | +10 accepted (12 received, 2 rejected) |
| 3 | Requisition | $($req.docNo) | $($reqDoc.status) | no stock change |
| 4 | Material Issue | $($issue.docNo) | $($issue.status) | -3 (linked to requisition) |
| 5 | Transfer | $($xfer.docNo) | $($xfer.status) | -2 A / +2 B |
| 6 | Return | $($ret.docNo) | $($ret.status) | +1 @ A |

## Final stock (analyze in Stock Register)

| Item | Location | Qty |
|------|----------|-----|
| $itemCode | DEMO-STR-A | **$stockFinalA** (expect 26) |
| $itemCode | DEMO-STR-B | **$stockFinalB** (expect 2) |

Math: 20 (OST) + 10 (GRN) - 3 (Issue) - 2 (Transfer) + 1 (Return) = **26** at Store A; Transfer **+2** at Store B.

## How to analyze in UI

1. Login as ``admin`` / ``Admin@123``
2. Open each **Master** page and search ``DEMO-``
3. Open **Opening Stock / GRN / Requisitions / Issues / Transfers / Returns** and find docs above
4. Open **Reports → Stock Register**, filter location DEMO-STR-A / DEMO-STR-B or search ``$itemCode``
5. Open **Reports → Full Report**, filter dates today and look for the doc numbers

## Stock story flowchart

``````mermaid
flowchart LR
  OST[OST +20] --> A[Store A]
  GRN[GRN +10] --> A
  ISS[Issue -3] --> A
  TRF[Transfer -2] --> A
  TRF --> B[Store B +2]
  RET[Return +1] --> A
  A --> FA[Final A = 26]
  B --> FB[Final B = 2]
``````
"@ | Set-Content -Path $outPath -Encoding UTF8

Write-Host "`n=== DONE ===" -ForegroundColor Green
Write-Host "Report written: $outPath"
Write-Host "Item: $itemCode | Store A qty=$stockFinalA | Store B qty=$stockFinalB"
