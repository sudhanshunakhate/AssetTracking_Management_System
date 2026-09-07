package com.caits.modules.transactions;

/**
 * Inspection-needed items must pass Quarantine / Inspection Approval before
 * Damaged, Scrap, or New Outward from those holds.
 */
public final class InspectionRoutingRules {

    private InspectionRoutingRules() {}

    public static boolean inspectionRequired(Boolean inspectionNeeded) {
        return Boolean.TRUE.equals(inspectionNeeded);
    }

    /** Transfer destination Damaged / Scrap is not allowed. Send to Quarantine instead. */
    public static boolean blocksTransferToRole(String systemRole) {
        return isDamagedOrScrap(systemRole);
    }

    /**
     * New outward from Damaged, Scrap, or Quarantine is not allowed.
     * Inspect first (Quarantine → Inspection Approval); failed units may leave from Rejected.
     */
    public static boolean blocksNewOutwardFromRole(String systemRole) {
        return isDamagedOrScrap(systemRole) || isRole(systemRole, "QUARANTINE");
    }

    private static boolean isDamagedOrScrap(String systemRole) {
        return isRole(systemRole, "DAMAGED") || isRole(systemRole, "SCRAP");
    }

    private static boolean isRole(String systemRole, String expected) {
        return systemRole != null && expected.equalsIgnoreCase(systemRole.trim());
    }
}
