package com.caits.modules.transactions;

/**
 * Pure stock-posting rules for transaction document types.
 * Kept separate from {@link TxnDocumentService} so unit tests can cover them without Spring.
 */
public final class StockPostingRules {

    private StockPostingRules() {}

    /** Status stored when the user saves as draft. */
    public static String draftStatus(DocType docType) {
        return switch (docType) {
            case GRN, OPENING_STOCK -> "In Pending";
            case MATERIAL_REQUISITION, MATERIAL_ISSUE, MATERIAL_TRANSFER, MATERIAL_RETURN -> "Pending";
            default -> "Draft";
        };
    }

    /** Status after SUBMIT (final save that posts stock or raises a request). */
    public static String initialSubmitStatus(DocType docType) {
        return switch (docType) {
            case MATERIAL_REQUISITION -> "Requested";
            case MATERIAL_ISSUE -> "Issued";
            case MATERIAL_TRANSFER -> "Transferred";
            case MATERIAL_RETURN -> "Returned";
            case GRN, OPENING_STOCK, GATEPASS_INWARD, GATEPASS_OUTWARD -> "Completed";
            default -> "Completed";
        };
    }

    /** Draft-like statuses that may still be edited or deleted. */
    public static boolean isEditableStatus(String status) {
        if (status == null || status.isBlank()) return true;
        String s = status.trim();
        return "Draft".equalsIgnoreCase(s)
                || "Pending".equalsIgnoreCase(s)
                || "In Pending".equalsIgnoreCase(s)
                || "Rejected".equalsIgnoreCase(s);
    }

    /** Whether SUBMIT immediately posts stock (approval-gated types return false). */
    public static boolean postsStockOnSubmit(DocType docType) {
        return switch (docType) {
            case GRN, OPENING_STOCK, MATERIAL_ISSUE, MATERIAL_TRANSFER, MATERIAL_RETURN,
                    GATEPASS_INWARD, GATEPASS_OUTWARD -> true;
            default -> false;
        };
    }

    /**
     * Direction of quantity into {@code inv_stock_mst}.
     * Transfer uses −1 at source; destination is handled separately as +qty.
     */
    public static int stockSign(DocType docType) {
        return switch (docType) {
            case GRN, GATEPASS_INWARD, OPENING_STOCK, MATERIAL_RETURN -> 1;
            case MATERIAL_ISSUE, GATEPASS_OUTWARD, MATERIAL_TRANSFER -> -1;
            case MATERIAL_REQUISITION -> 0;
        };
    }

    /** Inbound docs must not re-receive a serial already claimed by another document. */
    public static boolean isInboundStock(DocType docType) {
        return switch (docType) {
            case GRN, OPENING_STOCK, MATERIAL_RETURN, GATEPASS_INWARD -> true;
            default -> false;
        };
    }
}
