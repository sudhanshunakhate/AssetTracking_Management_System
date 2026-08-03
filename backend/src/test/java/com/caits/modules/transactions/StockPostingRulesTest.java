package com.caits.modules.transactions;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class StockPostingRulesTest {

    @Test
    void requisitionAndGatepassInwardNeedApproval() {
        assertEquals("Pending Approval", StockPostingRules.initialSubmitStatus(DocType.MATERIAL_REQUISITION));
        assertEquals("Pending Approval", StockPostingRules.initialSubmitStatus(DocType.GATEPASS_INWARD));
        assertEquals("Completed", StockPostingRules.initialSubmitStatus(DocType.GRN));
        assertEquals("Completed", StockPostingRules.initialSubmitStatus(DocType.OPENING_STOCK));
        assertEquals("Completed", StockPostingRules.initialSubmitStatus(DocType.MATERIAL_ISSUE));
        assertEquals("Completed", StockPostingRules.initialSubmitStatus(DocType.MATERIAL_TRANSFER));
        assertEquals("Completed", StockPostingRules.initialSubmitStatus(DocType.MATERIAL_RETURN));
        assertEquals("Completed", StockPostingRules.initialSubmitStatus(DocType.GATEPASS_OUTWARD));
    }

    @Test
    void postsStockOnSubmitMatchesProductRules() {
        assertTrue(StockPostingRules.postsStockOnSubmit(DocType.GRN));
        assertTrue(StockPostingRules.postsStockOnSubmit(DocType.OPENING_STOCK));
        assertTrue(StockPostingRules.postsStockOnSubmit(DocType.MATERIAL_ISSUE));
        assertTrue(StockPostingRules.postsStockOnSubmit(DocType.MATERIAL_TRANSFER));
        assertTrue(StockPostingRules.postsStockOnSubmit(DocType.MATERIAL_RETURN));
        assertTrue(StockPostingRules.postsStockOnSubmit(DocType.GATEPASS_OUTWARD));
        assertFalse(StockPostingRules.postsStockOnSubmit(DocType.MATERIAL_REQUISITION));
        assertFalse(StockPostingRules.postsStockOnSubmit(DocType.GATEPASS_INWARD));
    }

    @Test
    void stockSigns() {
        assertEquals(1, StockPostingRules.stockSign(DocType.GRN));
        assertEquals(1, StockPostingRules.stockSign(DocType.OPENING_STOCK));
        assertEquals(1, StockPostingRules.stockSign(DocType.MATERIAL_RETURN));
        assertEquals(1, StockPostingRules.stockSign(DocType.GATEPASS_INWARD));
        assertEquals(-1, StockPostingRules.stockSign(DocType.MATERIAL_ISSUE));
        assertEquals(-1, StockPostingRules.stockSign(DocType.GATEPASS_OUTWARD));
        assertEquals(-1, StockPostingRules.stockSign(DocType.MATERIAL_TRANSFER));
        assertEquals(0, StockPostingRules.stockSign(DocType.MATERIAL_REQUISITION));
    }

    @Test
    void inboundStockDocs() {
        assertTrue(StockPostingRules.isInboundStock(DocType.GRN));
        assertTrue(StockPostingRules.isInboundStock(DocType.OPENING_STOCK));
        assertTrue(StockPostingRules.isInboundStock(DocType.MATERIAL_RETURN));
        assertTrue(StockPostingRules.isInboundStock(DocType.GATEPASS_INWARD));
        assertFalse(StockPostingRules.isInboundStock(DocType.MATERIAL_ISSUE));
        assertFalse(StockPostingRules.isInboundStock(DocType.MATERIAL_TRANSFER));
        assertFalse(StockPostingRules.isInboundStock(DocType.GATEPASS_OUTWARD));
        assertFalse(StockPostingRules.isInboundStock(DocType.MATERIAL_REQUISITION));
    }
}
