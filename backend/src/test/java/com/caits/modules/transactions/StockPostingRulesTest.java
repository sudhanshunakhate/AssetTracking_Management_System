package com.caits.modules.transactions;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class StockPostingRulesTest {

    @Test
    void draftStatuses() {
        assertEquals("In Pending", StockPostingRules.draftStatus(DocType.GRN));
        assertEquals("In Pending", StockPostingRules.draftStatus(DocType.OPENING_STOCK));
        assertEquals("Pending", StockPostingRules.draftStatus(DocType.MATERIAL_REQUISITION));
        assertEquals("Pending", StockPostingRules.draftStatus(DocType.MATERIAL_ISSUE));
        assertEquals("Pending", StockPostingRules.draftStatus(DocType.MATERIAL_TRANSFER));
        assertEquals("Pending", StockPostingRules.draftStatus(DocType.MATERIAL_RETURN));
        assertEquals("Draft", StockPostingRules.draftStatus(DocType.GATEPASS_INWARD));
    }

    @Test
    void submitStatuses() {
        assertEquals("Requested", StockPostingRules.initialSubmitStatus(DocType.MATERIAL_REQUISITION));
        assertEquals("Pending Approval", StockPostingRules.initialSubmitStatus(DocType.GATEPASS_INWARD));
        assertEquals("Completed", StockPostingRules.initialSubmitStatus(DocType.GRN));
        assertEquals("Completed", StockPostingRules.initialSubmitStatus(DocType.OPENING_STOCK));
        assertEquals("Issued", StockPostingRules.initialSubmitStatus(DocType.MATERIAL_ISSUE));
        assertEquals("Transferred", StockPostingRules.initialSubmitStatus(DocType.MATERIAL_TRANSFER));
        assertEquals("Returned", StockPostingRules.initialSubmitStatus(DocType.MATERIAL_RETURN));
        assertEquals("Completed", StockPostingRules.initialSubmitStatus(DocType.GATEPASS_OUTWARD));
    }

    @Test
    void editableStatuses() {
        assertTrue(StockPostingRules.isEditableStatus("Pending"));
        assertTrue(StockPostingRules.isEditableStatus("In Pending"));
        assertTrue(StockPostingRules.isEditableStatus("Draft"));
        assertTrue(StockPostingRules.isEditableStatus("Rejected"));
        assertFalse(StockPostingRules.isEditableStatus("Requested"));
        assertFalse(StockPostingRules.isEditableStatus("Completed"));
        assertFalse(StockPostingRules.isEditableStatus("Issued"));
    }

    @Test
    void postsStockOnSubmit() {
        assertTrue(StockPostingRules.postsStockOnSubmit(DocType.GRN));
        assertFalse(StockPostingRules.postsStockOnSubmit(DocType.MATERIAL_REQUISITION));
        assertFalse(StockPostingRules.postsStockOnSubmit(DocType.GATEPASS_INWARD));
        assertTrue(StockPostingRules.postsStockOnSubmit(DocType.MATERIAL_ISSUE));
    }

    @Test
    void stockSign() {
        assertEquals(1, StockPostingRules.stockSign(DocType.GRN));
        assertEquals(-1, StockPostingRules.stockSign(DocType.MATERIAL_ISSUE));
        assertEquals(-1, StockPostingRules.stockSign(DocType.MATERIAL_TRANSFER));
        assertEquals(0, StockPostingRules.stockSign(DocType.MATERIAL_REQUISITION));
    }
}
