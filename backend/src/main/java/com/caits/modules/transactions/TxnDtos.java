package com.caits.modules.transactions;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public final class TxnDtos {
    private TxnDtos() {}

    public record LineRequest(
            Integer srNo,
            Integer itemId,
            Integer uomId,
            BigDecimal orderedQty,
            BigDecimal receivedQty,
            BigDecimal acceptedQty,
            BigDecimal rejectedQty,
            BigDecimal requestedQty,
            BigDecimal qty,
            BigDecimal availableStock,
            BigDecimal amount,
            BigDecimal rate,
            BigDecimal mrp,
            String batchLotNo,
            LocalDate mfgDate,
            LocalDate expiryDate,
            Integer locationId,
            String locationBin,
            String itemCondition,
            String serialNo,
            String ipAddress,
            String macAddress,
            String hostname,
            Integer issuedToEmpId,
            String remark,
            Integer detailId
    ) {}

    public record DocumentRequest(
            String docType,
            LocalDate docDate,
            LocalDate postingDate,
            LocalDate requiredByDate,
            Integer entityId,
            Integer locationId,
            Integer fromLocationId,
            Integer toLocationId,
            Integer partyId,
            String partyAdd,
            String partyContactPerson,
            String partyPhone,
            String partyGstin,
            String shipTo,
            Integer departmentId,
            Integer initiatedByEmpId,
            String employeeRefCode,
            String designation,
            String docSubtype,
            String returnFlag,
            Integer refTxnHeaderId,
            String referenceNo,
            String invoiceNo,
            LocalDate invoiceDate,
            String poNo,
            LocalDate poDate,
            String purpose,
            String attachmentUrl,
            String attachmentName,
            Integer inspectedByEmpId,
            LocalDate inspectionDate,
            Integer handedOverToEmpId,
            String handoverDesignation,
            LocalDate handoverDate,
            Integer receivedByEmpId,
            String receivedByName,
            String receivedDesignation,
            LocalDate receivedDate,
            String conditionOnReturn,
            Integer preparedByEmpId,
            LocalDate preparedDate,
            Integer approvedByEmpId,
            LocalDate approvedDate,
            BigDecimal totalOrderedQty,
            BigDecimal totalReceivedQty,
            BigDecimal totalAcceptedQty,
            BigDecimal totalRejectedQty,
            BigDecimal totalPendingQty,
            BigDecimal totalAmount,
            String footerRemark,
            String remarks,
            String docSubmitAction,
            List<LineRequest> lines
    ) {}

    public record LineResponse(
            Integer detailId,
            Integer srNo,
            Integer itemId,
            String itemCode,
            String itemName,
            String itemType,
            Integer uomId,
            String uomCode,
            BigDecimal orderedQty,
            BigDecimal receivedQty,
            BigDecimal acceptedQty,
            BigDecimal rejectedQty,
            BigDecimal requestedQty,
            BigDecimal qty,
            BigDecimal availableStock,
            BigDecimal amount,
            BigDecimal rate,
            BigDecimal mrp,
            String batchLotNo,
            LocalDate mfgDate,
            LocalDate expiryDate,
            Integer locationId,
            String locationBin,
            String itemCondition,
            String serialNo,
            String ipAddress,
            String macAddress,
            String hostname,
            Integer issuedToEmpId,
            String remark,
            Integer blsId
    ) {}

    public record DocumentResponse(
            Integer docId,
            String docNo,
            String docType,
            LocalDate docDate,
            LocalDate postingDate,
            LocalDate requiredByDate,
            Integer entityId,
            Integer locationId,
            Integer fromLocationId,
            Integer toLocationId,
            Integer partyId,
            String partyAdd,
            String partyContactPerson,
            String partyPhone,
            String partyGstin,
            String shipTo,
            Integer departmentId,
            Integer departmentLocationId,
            Integer initiatedByEmpId,
            String employeeRefCode,
            String designation,
            String docSubtype,
            String returnFlag,
            Integer refTxnHeaderId,
            String referenceNo,
            String invoiceNo,
            LocalDate invoiceDate,
            String poNo,
            LocalDate poDate,
            String purpose,
            String attachmentUrl,
            String attachmentName,
            Integer inspectedByEmpId,
            LocalDate inspectionDate,
            Integer handedOverToEmpId,
            String handoverDesignation,
            LocalDate handoverDate,
            Integer receivedByEmpId,
            String receivedByName,
            String receivedDesignation,
            LocalDate receivedDate,
            String conditionOnReturn,
            Integer preparedByEmpId,
            LocalDate preparedDate,
            Integer approvedByEmpId,
            LocalDate approvedDate,
            BigDecimal totalOrderedQty,
            BigDecimal totalReceivedQty,
            BigDecimal totalAcceptedQty,
            BigDecimal totalRejectedQty,
            BigDecimal totalPendingQty,
            BigDecimal totalAmount,
            String footerRemark,
            String remarks,
            String status,
            String createdBy,
            java.time.LocalDateTime createdOn,
            String message,
            List<LineResponse> lines
    ) {}

    public record ListItem(
            Integer docId,
            String docNo,
            String docType,
            LocalDate docDate,
            LocalDate postingDate,
            LocalDate requiredByDate,
            Integer entityId,
            Integer locationId,
            Integer fromLocationId,
            Integer toLocationId,
            Integer partyId,
            Integer departmentId,
            Integer departmentLocationId,
            Integer initiatedByEmpId,
            Integer refTxnHeaderId,
            String referenceNo,
            String invoiceNo,
            Integer totalItems,
            BigDecimal totalAmount,
            String status,
            String docSubtype,
            String returnFlag,
            String attachmentUrl,
            String attachmentName,
            java.time.LocalDateTime createdOn,
            java.time.LocalDateTime modifiedOn
    ) {}

    public record ApproveRequest(Integer approvedByEmpId, String remarks) {}

    public record RejectRequest(String reason) {}

    /** Item IDs and serial units currently allotted to an employee or department (Material Return picker). */
    public record AllottedUnit(
            Integer itemId,
            String serialNo,
            String ipAddress,
            String macAddress,
            String hostname,
            String batchLotNo
    ) {}

    /** Allotted quantity still with the employee or department for one item (Issue − Return + custody). */
    public record AllottedItemQty(Integer itemId, java.math.BigDecimal qty) {}

    public record AllottedItemsResponse(
            List<Integer> itemIds,
            List<AllottedUnit> units,
            List<AllottedItemQty> quantities
    ) {}

    /**
     * Serial units for Issue / Transfer pickers: not issued, and (when scoped to a location)
     * only those with positive on-hand stock at that store.
     */
    public record AvailableSerialUnit(
            Integer blsId,
            Integer itemId,
            Integer locationId,
            String serialNo,
            String ipAddress,
            String macAddress,
            String hostname,
            String batchLotNo,
            String itemCondition,
            Integer partyId,
            String partyName
    ) {}

    /** Vendor / party from the inbound GRN or Opening Stock that brought the stock in. */
    public record InboundPartyInfo(
            Integer partyId,
            String partyName,
            String sourceDocType
    ) {}
}
