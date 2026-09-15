package com.caits.security;

/**
 * Masking helpers for S3/S2 fields in list APIs.
 * Full values remain available on authorized detail endpoints when the UI must edit them.
 */
public final class SensitiveDataMask {

    private SensitiveDataMask() {}

    /** PAN: keep last 4, mask the rest. */
    public static String pan(String value) {
        if (value == null || value.isBlank()) {
            return value;
        }
        String v = value.trim().toUpperCase();
        if (v.length() <= 4) {
            return "XXXX";
        }
        return "X".repeat(v.length() - 4) + v.substring(v.length() - 4);
    }

    /** GSTIN: keep last 4. */
    public static String gstin(String value) {
        return pan(value);
    }

    /** Email: keep domain, mask local-part except first char. */
    public static String email(String value) {
        if (value == null || value.isBlank() || !value.contains("@")) {
            return value;
        }
        String[] parts = value.trim().split("@", 2);
        String local = parts[0];
        String domain = parts[1];
        if (local.isEmpty()) {
            return "***@" + domain;
        }
        String visible = local.substring(0, 1);
        return visible + "***@" + domain;
    }

    /** Phone: keep last 4 digits. */
    public static String phone(String value) {
        if (value == null || value.isBlank()) {
            return value;
        }
        String digits = value.replaceAll("\\D", "");
        if (digits.length() <= 4) {
            return "****";
        }
        return "******" + digits.substring(digits.length() - 4);
    }
}
