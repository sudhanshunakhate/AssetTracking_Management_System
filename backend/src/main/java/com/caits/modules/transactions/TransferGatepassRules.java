package com.caits.modules.transactions;

import java.util.Set;

/**
 * When a material transfer needs an outward gatepass at the source store, it stays
 * {@link #PENDING_FOR_OUTWARD} until that gatepass is submitted against the transfer.
 */
public final class TransferGatepassRules {

    public static final String PENDING_FOR_OUTWARD = "Pending for Outward";
    public static final String TRANSFERRED = "Transferred";

    private static final Set<String> SPECIAL_TO_ROLES = Set.of(
            "DAMAGED", "REJECTED", "QUARANTINE", "SCRAP"
    );

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
        String subtype = docSubtype == null ? "" : docSubtype.trim().toUpperCase();
        if ("OU".equals(subtype) || "OPR".equals(subtype)) {
            return true;
        }
        String role = toSystemRole == null ? "" : toSystemRole.trim().toUpperCase();
        if (SPECIAL_TO_ROLES.contains(role)) {
            return true;
        }
        String blob = ((toLocationCode == null ? "" : toLocationCode) + " " + (toLocationName == null ? "" : toLocationName))
                .toLowerCase();
        return blob.contains("damaged")
                || blob.contains("reject")
                || blob.contains("quarantine")
                || blob.contains("scrap");
    }

    public static String transferStatusAfterSubmit(boolean needsGatepass) {
        return needsGatepass ? PENDING_FOR_OUTWARD : TRANSFERRED;
    }
}
