package com.caits.modules.transactions;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class TransferGatepassRulesTest {

    @Test
    void ouTransferAlwaysNeedsGatepass() {
        assertTrue(TransferGatepassRules.needsGatepassOutward(
                "OU", 1, 2, null, "STORE-A", "Main Store"));
    }

    @Test
    void internalToRejectedNeedsGatepass() {
        assertTrue(TransferGatepassRules.needsGatepassOutward(
                "INTERNAL", 1, 2, "REJECTED", "SYS-1-REJ", "Rejected Store"));
    }

    @Test
    void internalMainToMainDoesNotNeedGatepass() {
        assertFalse(TransferGatepassRules.needsGatepassOutward(
                "INTERNAL", 1, 2, null, "GEN-01", "General Store"));
    }

    @Test
    void transferStatusAfterSubmit() {
        assertEquals(TransferGatepassRules.PENDING_FOR_OUTWARD,
                TransferGatepassRules.transferStatusAfterSubmit(true));
        assertEquals(TransferGatepassRules.TRANSFERRED,
                TransferGatepassRules.transferStatusAfterSubmit(false));
    }
}
