package com.caits.modules.transactions;

/**
 * New Outward: inspection-needed items cannot leave from Quarantine until Inspection Approval.
 * Damaged / Scrap outward is allowed after assets are returned there by transfer.
 */
public final class InspectionRoutingRules {

    private InspectionRoutingRules() {}

    public static boolean inspectionRequired(Boolean inspectionNeeded) {
        return Boolean.TRUE.equals(inspectionNeeded);
    }

    /** @deprecated Transfers no longer block Damaged/Scrap destinations. */
    public static boolean blocksTransferToRole(String systemRole) {
        return false;
    }

    /**
     * New outward from Quarantine is not allowed for inspection-needed items.
     * Damaged / Scrap may leave on outward once stock has been returned there.
     */
    public static boolean blocksNewOutwardFromRole(String systemRole) {
        return isRole(systemRole, "QUARANTINE");
    }

    private static boolean isRole(String systemRole, String expected) {
        return systemRole != null && expected.equalsIgnoreCase(systemRole.trim());
    }
}
