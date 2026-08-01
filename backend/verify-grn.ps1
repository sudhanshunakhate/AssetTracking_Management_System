# End-to-end check for the Goods Receipt Note screen.
# Exercises every field the GRN form sends, then reads it back and confirms
# the accepted quantity landed in stock.
#
#   powershell -ExecutionPolicy Bypass -File .\verify-grn.ps1

$ErrorActionPreference = 'Stop'
$Base = 'http://localhost:8085/api/v1'
$pass = 0
$fail = 0

function Check($label, $condition, $detail) {
    if ($condition) {
        $script:pass++
        Write-Host ("  PASS  {0}" -f $label) -ForegroundColor Green
    } else {
        $script:fail++
        Write-Host ("  FAIL  {0} -> {1}" -f $label, $detail) -ForegroundColor Red
    }
}

function Section($t) { Write-Host "`n$t" -ForegroundColor Cyan }

# ---------------------------------------------------------------- login ----
Section '1. Authenticate'
$login = Invoke-RestMethod -Uri "$Base/auth/login" -Method Post -ContentType 'application/json' `
    -Body (@{ loginId = 'admin'; password = 'Admin@123' } | ConvertTo-Json)
$H = @{ Authorization = "Bearer $($login.token)" }
Check 'admin login returns a token' ($login.token) 'no token'

# ------------------------------------------------------------- lookups ----
Section '2. Lookups the GRN form depends on'
$vendors   = Invoke-RestMethod -Uri "$Base/vendors?page=0&size=5"   -Headers $H
$locations = Invoke-RestMethod -Uri "$Base/locations?page=0&size=5" -Headers $H
$employees = Invoke-RestMethod -Uri "$Base/employees?page=0&size=5" -Headers $H
$items     = Invoke-RestMethod -Uri "$Base/items?page=0&size=5"     -Headers $H

Check 'vendors available for Supplier'        ($vendors.data.Count   -gt 0) 'empty'
Check 'locations available for Store'         ($locations.data.Count -gt 0) 'empty'
Check 'employees available for Inspected By'  ($employees.data.Count -gt 0) 'empty'
Check 'items available for the line grid'     ($items.data.Count     -gt 0) 'empty'

$vendorId = $vendors.data[0].vendorId
$locId    = $locations.data[0].locationId
$empId    = $employees.data[0].employeeId
$emp2Id   = if ($employees.data.Count -gt 1) { $employees.data[1].employeeId } else { $empId }
$item     = $items.data[0]
$itemId   = $item.itemId
$uomId    = $item.uomId

# --------------------------------------------------------- stock before ----
# Same call the line grid makes to fill the Available Stock column.
function Get-AvailableStock($itemId, $locId) {
    $page = Invoke-RestMethod -Uri "$Base/stock?itemId=$itemId&locationId=$locId&page=1&pageSize=200" -Headers $H
    $sum = 0
    foreach ($r in $page.data) { $sum += [decimal]$r.availableQty }
    return [decimal]$sum
}

Section '3. Stock level before the GRN'
$qtyBefore = Get-AvailableStock $itemId $locId
Check 'available-stock lookup used by the grid responds' ($qtyBefore -ne $null) 'no response'
Write-Host ("  available before = {0}" -f $qtyBefore)

# --------------------------------------------------------------- create ----
Section '4. Create a GRN with every form field populated'
$today = (Get-Date).ToString('yyyy-MM-dd')
$body = @{
    docDate           = $today
    partyId           = $vendorId
    locationId        = $locId
    invoiceNo         = 'INV-VERIFY-01'
    invoiceDate       = $today
    poNo              = 'ORD-VERIFY-01'
    poDate            = $today
    inspectedByEmpId  = $empId
    inspectionDate    = $today
    preparedByEmpId   = $empId
    preparedDate      = $today
    approvedByEmpId   = $emp2Id
    approvedDate      = $today
    remarks           = 'Verified by verify-grn.ps1'
    totalReceivedQty  = 10
    totalAcceptedQty  = 8
    totalRejectedQty  = 2
    totalAmount       = 1250.50
    docSubmitAction   = 'SAVE_DRAFT'
    lines = @(
        @{
            srNo           = 1
            itemId         = $itemId
            uomId          = $uomId
            receivedQty    = 10
            acceptedQty    = 8
            rejectedQty    = 2
            qty            = 8
            availableStock = $qtyBefore
            amount         = 1250.50
            locationId     = $locId
            remark         = 'two damaged'
        }
    )
} | ConvertTo-Json -Depth 6

$created = Invoke-RestMethod -Uri "$Base/grn" -Method Post -Headers $H -ContentType 'application/json' -Body $body
$docId = $created.docId
Check 'GRN created'                    ($docId -ne $null)              'no docId'
Check 'doc no uses the GRN- series'    ($created.docNo -like 'GRN-*')  $created.docNo
Check 'draft save does not complete it' ($created.status -eq 'Draft')  $created.status

# ------------------------------------------------------------- read back ----
Section '5. Read back every field'
$doc = Invoke-RestMethod -Uri "$Base/grn/$docId" -Headers $H

Check 'GRN Date'                ($doc.docDate         -eq $today)             $doc.docDate
Check 'Supplier'                ($doc.partyId         -eq $vendorId)          $doc.partyId
Check 'Store / Location'        ($doc.locationId      -eq $locId)             $doc.locationId
Check 'Invoice No.'             ($doc.invoiceNo       -eq 'INV-VERIFY-01')    $doc.invoiceNo
Check 'Invoice Date'            ($doc.invoiceDate     -eq $today)             $doc.invoiceDate
Check 'Reference Document'      ($doc.poNo            -eq 'ORD-VERIFY-01')    $doc.poNo
Check 'Reference Document Date' ($doc.poDate          -eq $today)             $doc.poDate
Check 'Inspected By'            ($doc.inspectedByEmpId -eq $empId)            $doc.inspectedByEmpId
Check 'Inspection Date'         ($doc.inspectionDate  -eq $today)             $doc.inspectionDate
Check 'GRN Prepared By'         ($doc.preparedByEmpId -eq $empId)             $doc.preparedByEmpId
Check 'Prepared Date'           ($doc.preparedDate    -eq $today)             $doc.preparedDate
Check 'Approved By'             ($doc.approvedByEmpId -eq $emp2Id)            $doc.approvedByEmpId
Check 'Approved Date'           ($doc.approvedDate    -eq $today)             $doc.approvedDate
Check 'Remarks'                 ($doc.remarks -eq 'Verified by verify-grn.ps1') $doc.remarks
Check 'Total Received Qty'      ([decimal]$doc.totalReceivedQty -eq 10)       $doc.totalReceivedQty
Check 'Total Accepted Qty'      ([decimal]$doc.totalAcceptedQty -eq 8)        $doc.totalAcceptedQty
Check 'Total Rejected Qty'      ([decimal]$doc.totalRejectedQty -eq 2)        $doc.totalRejectedQty
Check 'Total Amount'            ([decimal]$doc.totalAmount -eq 1250.50)       $doc.totalAmount

$line = $doc.lines[0]
Check 'line: item'            ($line.itemId -eq $itemId)                $line.itemId
Check 'line: uom'             ($line.uomId  -eq $uomId)                 $line.uomId
Check 'line: received qty'    ([decimal]$line.receivedQty -eq 10)       $line.receivedQty
Check 'line: accepted qty'    ([decimal]$line.acceptedQty -eq 8)        $line.acceptedQty
Check 'line: rejected qty'    ([decimal]$line.rejectedQty -eq 2)        $line.rejectedQty
Check 'line: available stock' ($line.availableStock -ne $null)          'null'
Check 'line: amount'          ([decimal]$line.amount -eq 1250.50)       $line.amount
Check 'line: location'        ($line.locationId -eq $locId)             $line.locationId
Check 'line: remark'          ($line.remark -eq 'two damaged')          $line.remark

# ------------------------------------------------------------------ list ----
Section '6. List columns'
$list = Invoke-RestMethod -Uri "$Base/grn?page=0&size=50" -Headers $H
$row = $list.data | Where-Object { $_.docId -eq $docId }
Check 'row present in list'      ($row -ne $null)                 'missing'
Check 'list: supplier column'    ($row.partyId   -eq $vendorId)   $row.partyId
Check 'list: invoice no column'  ($row.invoiceNo -eq 'INV-VERIFY-01') $row.invoiceNo
Check 'list: store column'       ($row.locationId -eq $locId)     $row.locationId
Check 'list: items column'       ($row.totalItems -eq 1)          $row.totalItems
Check 'list: amount column'      ([decimal]$row.totalAmount -eq 1250.50) $row.totalAmount

# ---------------------------------------------------------------- update ----
Section '7. Update the draft'
$body2 = ($body | ConvertFrom-Json)
$body2.remarks = 'Updated by verify-grn.ps1'
$body2.invoiceNo = 'INV-VERIFY-02'
Invoke-RestMethod -Uri "$Base/grn/$docId" -Method Put -Headers $H -ContentType 'application/json' `
    -Body ($body2 | ConvertTo-Json -Depth 6) | Out-Null
$doc2 = Invoke-RestMethod -Uri "$Base/grn/$docId" -Headers $H
Check 'update persisted remarks'  ($doc2.remarks   -eq 'Updated by verify-grn.ps1') $doc2.remarks
Check 'update persisted invoice'  ($doc2.invoiceNo -eq 'INV-VERIFY-02')             $doc2.invoiceNo

# ------------------------------------------------- save record posts stock ----
Section '8. Save Record completes the GRN and posts accepted qty to stock'
$body3 = ($body | ConvertFrom-Json)
$body3.docSubmitAction = 'SUBMIT'
$posted = Invoke-RestMethod -Uri "$Base/grn/$docId" -Method Put -Headers $H -ContentType 'application/json' `
    -Body ($body3 | ConvertTo-Json -Depth 6)
Check 'status is Completed, not Pending Approval' ($posted.status -eq 'Completed') $posted.status

$qtyAfter = Get-AvailableStock $itemId $locId
Check 'accepted qty (8) added to stock, rejected ignored' (($qtyAfter - $qtyBefore) -eq 8) `
    ("before=$qtyBefore after=$qtyAfter")

Section '9. A completed GRN can no longer be edited'
$locked = $false
try {
    Invoke-RestMethod -Uri "$Base/grn/$docId" -Method Put -Headers $H -ContentType 'application/json' -Body $body | Out-Null
} catch { $locked = $true }
Check 'edit of a Completed GRN is rejected' $locked 'update was allowed'

# --------------------------------------------------------------- summary ----
Write-Host ""
Write-Host ("{0} passed, {1} failed" -f $pass, $fail) -ForegroundColor $(if ($fail -eq 0) { 'Green' } else { 'Red' })
Write-Host ("GRN under test: docId={0}" -f $docId)
if ($fail -gt 0) { exit 1 }
