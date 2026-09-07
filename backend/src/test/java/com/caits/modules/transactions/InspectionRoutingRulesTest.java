package com.caits.modules.transactions;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class InspectionRoutingRulesTest {

    @Test
    void transferCannotLandInspectionItemsInDamagedOrScrap() {
        assertTrue(InspectionRoutingRules.blocksTransferToRole("DAMAGED"));
        assertTrue(InspectionRoutingRules.blocksTransferToRole("SCRAP"));
        assertFalse(InspectionRoutingRules.blocksTransferToRole("QUARANTINE"));
        assertFalse(InspectionRoutingRules.blocksTransferToRole("REJECTED"));
        assertFalse(InspectionRoutingRules.blocksTransferToRole(null));
    }

    @Test
    void newOutwardCannotLeaveInspectionHolds() {
        assertTrue(InspectionRoutingRules.blocksNewOutwardFromRole("DAMAGED"));
        assertTrue(InspectionRoutingRules.blocksNewOutwardFromRole("SCRAP"));
        assertTrue(InspectionRoutingRules.blocksNewOutwardFromRole("QUARANTINE"));
        assertFalse(InspectionRoutingRules.blocksNewOutwardFromRole("REJECTED"));
        assertFalse(InspectionRoutingRules.blocksNewOutwardFromRole("MAIN_STORE"));
    }
}
