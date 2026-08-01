package com.caits.modules.transactions;

/**
 * Discriminator values stored in txn_header_mst.txh_doc_type
 * and used by dedicated REST resources.
 */
public enum DocType {
    GRN("GRN", "GRN"),
    GATEPASS_INWARD("GATEPASS_INWARD", "GPI"),
    GATEPASS_OUTWARD("GATEPASS_OUTWARD", "GPO"),
    MATERIAL_REQUISITION("MATERIAL_REQUISITION", "MREQ"),
    MATERIAL_ISSUE("MATERIAL_ISSUE", "MISS"),
    OPENING_STOCK("OPENING_STOCK", "OST"),
    MATERIAL_TRANSFER("MATERIAL_TRANSFER", "MTRF"),
    MATERIAL_RETURN("MATERIAL_RETURN", "MRET");

    private final String code;
    private final String seriesPrefix;

    DocType(String code, String seriesPrefix) {
        this.code = code;
        this.seriesPrefix = seriesPrefix;
    }

    public String code() {
        return code;
    }

    public String seriesPrefix() {
        return seriesPrefix;
    }

    public static DocType fromCode(String code) {
        for (DocType d : values()) {
            if (d.code.equalsIgnoreCase(code)) {
                return d;
            }
        }
        throw new IllegalArgumentException("Unknown doc type: " + code);
    }
}
