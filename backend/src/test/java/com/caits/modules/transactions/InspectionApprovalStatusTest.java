package com.caits.modules.transactions;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** Editable-status rules for inspection approval final states. */
class InspectionApprovalStatusTest {

    @Test
    void pendingInspectionIsEditable() {
        assertTrue(StockPostingRules.isEditableStatus("Pending"));
    }

    @Test
    void approvedInspectionIsNotEditable() {
        assertFalse(StockPostingRules.isEditableStatus("Approved"));
    }

    @Test
    void inspectionApprovalPostsStockOnSubmit() {
        assertTrue(StockPostingRules.postsStockOnSubmit(DocType.INSPECTION_APPROVAL));
    }

    @Test
    void inspectionApprovalSubmitStatusIsApproved() {
        assertEquals("Approved", StockPostingRules.initialSubmitStatus(DocType.INSPECTION_APPROVAL));
    }
}
