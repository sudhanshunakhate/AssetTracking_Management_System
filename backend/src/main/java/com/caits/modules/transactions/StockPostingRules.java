package com.caits.modules.transactions;

/**
 * Pure stock-posting rules for transaction document types.
 * Kept separate from {@link TxnDocumentService} so unit tests can cover them without Spring.
 */
public final class StockPostingRules {

    private StockPostingRules() {}

    /** Status after SUBMIT (before optional approval). */
    public static String initialSubmitStatus(DocType docType) {
        return switch (docType) {
            case MATERIAL_REQUISITION, GATEPASS_INWARD -> "Pending Approval";
            default -> "Completed";
        };
    }

    /** Whether SUBMIT immediately posts stock (approval-gated types return false). */
    public static boolean postsStockOnSubmit(DocType docType) {
        return switch (docType) {
            case GRN, OPENING_STOCK, MATERIAL_ISSUE, MATERIAL_TRANSFER, MATERIAL_RETURN, GATEPASS_OUTWARD -> true;
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
