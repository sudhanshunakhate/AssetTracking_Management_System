package com.caits.modules.transactions;

/**
 * Outward gatepass is required only for OU (cross operating-unit) material transfers.
 * Internal transfers complete immediately as {@link #TRANSFERRED} with no gatepass step.
 */
public final class TransferGatepassRules {

    public static final String PENDING_FOR_OUTWARD = "Pending for Outward";
    public static final String TRANSFERRED = "Transferred";

    private TransferGatepassRules() {}

    public static boolean needsGatepassOutward(
            String docSubtype,
            Integer fromLocationId,
            Integer toLocationId,
            String toSystemRole,
            String toLocationCode,
            String toLocationName
    ) {
        if (fromLocationId == null || toLocationId == null || fromLocationId.equals(toLocationId)) {
            return false;
        }
        // Destination role / name args kept for call-site compatibility; only OU subtype matters.
        String subtype = docSubtype == null ? "" : docSubtype.trim().toUpperCase();
        return "OU".equals(subtype) || "OPR".equals(subtype);
    }

    public static String transferStatusAfterSubmit(boolean needsGatepass) {
        return needsGatepass ? PENDING_FOR_OUTWARD : TRANSFERRED;
    }
}
