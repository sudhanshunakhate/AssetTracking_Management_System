package com.caits.modules.transactions;

import com.caits.common.MessageResponse;
import com.caits.common.PageResponse;
import com.caits.modules.transactions.TxnDtos.*;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

/**
 * Shared request handlers for all transaction document types.
 * Thin resource controllers delegate here with a fixed DocType.
 */
@RestController
@RequestMapping("/api/v1")
public class TransactionControllers {

    private final TxnDocumentService service;

    public TransactionControllers(TxnDocumentService service) {
        this.service = service;
    }

    // ---------- GRN ----------
    @GetMapping("/grn")
    public PageResponse<ListItem> listGrn(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(required = false) Integer locationId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int pageSize
    ) {
        return service.list(DocType.GRN, status, fromDate, toDate, locationId, null, null, null, null, null, null, null, null, page, pageSize);
    }

    @GetMapping("/grn/{docId}")
    public DocumentResponse getGrn(@PathVariable Integer docId) {
        return service.get(DocType.GRN, docId);
    }

    @PostMapping("/grn")
    public ResponseEntity<DocumentResponse> createGrn(@RequestBody DocumentRequest body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(DocType.GRN, body));
    }

    @PutMapping("/grn/{docId}")
    public DocumentResponse updateGrn(@PathVariable Integer docId, @RequestBody DocumentRequest body) {
        return service.update(DocType.GRN, docId, body);
    }

    @DeleteMapping("/grn/{docId}")
    public MessageResponse deleteGrn(@PathVariable Integer docId) {
        return service.delete(DocType.GRN, docId);
    }

    // GRN / Gatepass complete and post stock on SUBMIT — no approval workflow.

    @GetMapping("/grn/{docId}/print")
    public DocumentResponse printGrn(@PathVariable Integer docId) {
        return service.printView(DocType.GRN, docId);
    }

    // ---------- Gatepass Inward ----------
    @GetMapping("/gatepass/inward")
    public PageResponse<ListItem> listGpi(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(required = false) Integer locationId,
            @RequestParam(required = false) String docSubtype,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int pageSize
    ) {
        return service.list(DocType.GATEPASS_INWARD, status, fromDate, toDate, locationId, null, null, null, null, null, docSubtype, null, null, page, pageSize);
    }

    @GetMapping("/gatepass/inward/{docId}")
    public DocumentResponse getGpi(@PathVariable Integer docId) {
        return service.get(DocType.GATEPASS_INWARD, docId);
    }

    @PostMapping("/gatepass/inward")
    public ResponseEntity<DocumentResponse> createGpi(@RequestBody DocumentRequest body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(DocType.GATEPASS_INWARD, body));
    }

    @DeleteMapping("/gatepass/inward/{docId}")
    public MessageResponse deleteGpi(@PathVariable Integer docId) {
        return service.delete(DocType.GATEPASS_INWARD, docId);
    }

    /** Kept for any legacy Pending Approval inward docs created before approval was removed. */
    @PostMapping("/gatepass/inward/{docId}/approve")
    public DocumentResponse approveGpi(@PathVariable Integer docId, @RequestBody(required = false) ApproveRequest body) {
        return service.approve(DocType.GATEPASS_INWARD, docId, body);
    }

    @GetMapping("/gatepass/inward/{docId}/print")
    public DocumentResponse printGpi(@PathVariable Integer docId) {
        return service.printView(DocType.GATEPASS_INWARD, docId);
    }

    // ---------- Gatepass Outward ----------
    @GetMapping("/gatepass/outward")
    public PageResponse<ListItem> listGpo(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(required = false) Integer locationId,
            @RequestParam(required = false) String returnFlag,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int pageSize
    ) {
        return service.list(DocType.GATEPASS_OUTWARD, status, fromDate, toDate, locationId, null, null, null, null, null, null, returnFlag, null, page, pageSize);
    }

    @GetMapping("/gatepass/outward/{docId}")
    public DocumentResponse getGpo(@PathVariable Integer docId) {
        return service.get(DocType.GATEPASS_OUTWARD, docId);
    }

    @PostMapping("/gatepass/outward")
    public ResponseEntity<DocumentResponse> createGpo(@RequestBody DocumentRequest body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(DocType.GATEPASS_OUTWARD, body));
    }

    @PutMapping("/gatepass/outward/{docId}")
    public DocumentResponse updateGpo(@PathVariable Integer docId, @RequestBody DocumentRequest body) {
        return service.update(DocType.GATEPASS_OUTWARD, docId, body);
    }

    @DeleteMapping("/gatepass/outward/{docId}")
    public MessageResponse deleteGpo(@PathVariable Integer docId) {
        return service.delete(DocType.GATEPASS_OUTWARD, docId);
    }

    @GetMapping("/gatepass/outward/{docId}/print")
    public DocumentResponse printGpo(@PathVariable Integer docId) {
        return service.printView(DocType.GATEPASS_OUTWARD, docId);
    }

    // ---------- Requisitions ----------
    @GetMapping("/requisitions")
    public PageResponse<ListItem> listReq(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(required = false) Integer locationId,
            @RequestParam(required = false) Integer departmentId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int pageSize
    ) {
        return service.list(DocType.MATERIAL_REQUISITION, status, fromDate, toDate, locationId, null, null, departmentId, null, null, null, null, null, page, pageSize);
    }

    @GetMapping("/requisitions/{docId}")
    public DocumentResponse getReq(@PathVariable Integer docId) {
        return service.get(DocType.MATERIAL_REQUISITION, docId);
    }

    @PostMapping("/requisitions")
    public ResponseEntity<DocumentResponse> createReq(@RequestBody DocumentRequest body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(DocType.MATERIAL_REQUISITION, body));
    }

    @PutMapping("/requisitions/{docId}")
    public DocumentResponse updateReq(@PathVariable Integer docId, @RequestBody DocumentRequest body) {
        return service.update(DocType.MATERIAL_REQUISITION, docId, body);
    }

    @DeleteMapping("/requisitions/{docId}")
    public MessageResponse deleteReq(@PathVariable Integer docId) {
        return service.delete(DocType.MATERIAL_REQUISITION, docId);
    }

    @PostMapping("/requisitions/{docId}/approve")
    public DocumentResponse approveReq(@PathVariable Integer docId, @RequestBody(required = false) ApproveRequest body) {
        return service.approve(DocType.MATERIAL_REQUISITION, docId, body);
    }

    @PostMapping("/requisitions/{docId}/reject")
    public MessageResponse rejectReq(@PathVariable Integer docId, @RequestBody RejectRequest body) {
        return service.reject(DocType.MATERIAL_REQUISITION, docId, body);
    }

    @GetMapping("/requisitions/{docId}/print")
    public DocumentResponse printReq(@PathVariable Integer docId) {
        return service.printView(DocType.MATERIAL_REQUISITION, docId);
    }

    // ---------- Material Issues ----------
    @GetMapping("/material-issues")
    public PageResponse<ListItem> listIssue(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(required = false) Integer locationId,
            @RequestParam(required = false) Integer refTxnHeaderId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int pageSize
    ) {
        return service.list(DocType.MATERIAL_ISSUE, status, fromDate, toDate, locationId, null, null, null, refTxnHeaderId, null, null, null, null, page, pageSize);
    }

    @GetMapping("/material-issues/{docId}")
    public DocumentResponse getIssue(@PathVariable Integer docId) {
        return service.get(DocType.MATERIAL_ISSUE, docId);
    }

    @PostMapping("/material-issues")
    public ResponseEntity<DocumentResponse> createIssue(@RequestBody DocumentRequest body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(DocType.MATERIAL_ISSUE, body));
    }

    @PutMapping("/material-issues/{docId}")
    public DocumentResponse patchIssueIdentity(@PathVariable Integer docId, @RequestBody DocumentRequest body) {
        return service.patchPostedIssueIdentity(docId, body);
    }

    @DeleteMapping("/material-issues/{docId}")
    public MessageResponse deleteIssue(@PathVariable Integer docId) {
        return service.delete(DocType.MATERIAL_ISSUE, docId);
    }

    @GetMapping("/material-issues/{docId}/print")
    public DocumentResponse printIssue(@PathVariable Integer docId) {
        return service.printView(DocType.MATERIAL_ISSUE, docId);
    }

    @GetMapping("/material-issues/pending-requisitions")
    public PageResponse<ListItem> pendingRequisitions(@RequestParam(required = false) Integer locationId) {
        return service.pendingRequisitions(locationId);
    }

    // ---------- Opening Stock ----------
    @GetMapping("/opening-stock")
    public PageResponse<ListItem> listOst(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(required = false) Integer locationId,
            @RequestParam(required = false) Integer entityId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int pageSize
    ) {
        return service.list(DocType.OPENING_STOCK, status, fromDate, toDate, locationId, null, null, null, null, entityId, null, null, null, page, pageSize);
    }

    @GetMapping("/opening-stock/{docId}")
    public DocumentResponse getOst(@PathVariable Integer docId) {
        return service.get(DocType.OPENING_STOCK, docId);
    }

    @PostMapping("/opening-stock")
    public ResponseEntity<DocumentResponse> createOst(@RequestBody DocumentRequest body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(DocType.OPENING_STOCK, body));
    }

    @PutMapping("/opening-stock/{docId}")
    public DocumentResponse updateOst(@PathVariable Integer docId, @RequestBody DocumentRequest body) {
        return service.update(DocType.OPENING_STOCK, docId, body);
    }

    // ---------- Transfers ----------
    @GetMapping("/transfers")
    public PageResponse<ListItem> listTransfer(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(required = false) Integer locationId,
            @RequestParam(required = false) Integer fromLocationId,
            @RequestParam(required = false) Integer toLocationId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int pageSize
    ) {
        return service.list(DocType.MATERIAL_TRANSFER, status, fromDate, toDate, locationId, fromLocationId, toLocationId, null, null, null, null, null, null, page, pageSize);
    }

    @GetMapping("/transfers/{docId}")
    public DocumentResponse getTransfer(@PathVariable Integer docId) {
        return service.get(DocType.MATERIAL_TRANSFER, docId);
    }

    @PostMapping("/transfers")
    public ResponseEntity<DocumentResponse> createTransfer(@RequestBody DocumentRequest body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(DocType.MATERIAL_TRANSFER, body));
    }

    @GetMapping("/transfers/{docId}/print")
    public DocumentResponse printTransfer(@PathVariable Integer docId) {
        return service.printView(DocType.MATERIAL_TRANSFER, docId);
    }

    // ---------- Returns ----------
    @GetMapping("/returns/allotted-items")
    public AllottedItemsResponse allottedItems(@RequestParam Integer employeeId) {
        return service.listAllottedItems(employeeId);
    }

    @GetMapping("/issues/available-serials")
    public List<AvailableSerialUnit> availableSerials(
            @RequestParam Integer itemId,
            @RequestParam(required = false) Integer locationId
    ) {
        return service.listAvailableSerials(itemId, locationId);
    }

    @GetMapping("/returns")
    public PageResponse<ListItem> listReturn(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(required = false) Integer locationId,
            @RequestParam(required = false) Integer refTxnHeaderId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int pageSize
    ) {
        return service.list(DocType.MATERIAL_RETURN, status, fromDate, toDate, locationId, null, null, null, refTxnHeaderId, null, null, null, null, page, pageSize);
    }

    @GetMapping("/returns/{docId}")
    public DocumentResponse getReturn(@PathVariable Integer docId) {
        return service.get(DocType.MATERIAL_RETURN, docId);
    }

    @PostMapping("/returns")
    public ResponseEntity<DocumentResponse> createReturn(@RequestBody DocumentRequest body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(DocType.MATERIAL_RETURN, body));
    }

    @GetMapping("/returns/{docId}/print")
    public DocumentResponse printReturn(@PathVariable Integer docId) {
        return service.printView(DocType.MATERIAL_RETURN, docId);
    }

    // ---------- Inspection Approval ----------
    @GetMapping("/inspection-approvals")
    public PageResponse<ListItem> listInspectionApproval(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(required = false) Integer locationId,
            @RequestParam(required = false) Integer entityId,
            @RequestParam(required = false) Integer initiatedByEmpId,
            @RequestParam(defaultValue = "false") boolean syncGrn,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int pageSize
    ) {
        if (syncGrn) {
            service.syncPendingInspectionsFromGrn();
        }
        return service.list(
                DocType.INSPECTION_APPROVAL,
                status,
                fromDate,
                toDate,
                locationId,
                null,
                null,
                null,
                null,
                entityId,
                null,
                null,
                initiatedByEmpId,
                page,
                pageSize
        );
    }

    @GetMapping("/inspection-approvals/{docId}")
    public DocumentResponse getInspectionApproval(@PathVariable Integer docId) {
        return service.get(DocType.INSPECTION_APPROVAL, docId);
    }

    @PostMapping("/inspection-approvals")
    public ResponseEntity<DocumentResponse> createInspectionApproval(@RequestBody DocumentRequest body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(DocType.INSPECTION_APPROVAL, body));
    }

    @PutMapping("/inspection-approvals/{docId}")
    public DocumentResponse updateInspectionApproval(@PathVariable Integer docId, @RequestBody DocumentRequest body) {
        return service.update(DocType.INSPECTION_APPROVAL, docId, body);
    }

    @DeleteMapping("/inspection-approvals/{docId}")
    public MessageResponse deleteInspectionApproval(@PathVariable Integer docId) {
        return service.delete(DocType.INSPECTION_APPROVAL, docId);
    }

    @PostMapping("/inspection-approvals/sync-from-grn")
    public MessageResponse syncInspectionApprovalsFromGrn() {
        service.syncPendingInspectionsFromGrn();
        return MessageResponse.of("Inspection approvals synced from GRN");
    }

    @GetMapping("/inspection-approvals/{docId}/print")
    public DocumentResponse printInspectionApproval(@PathVariable Integer docId) {
        return service.printView(DocType.INSPECTION_APPROVAL, docId);
    }
}
