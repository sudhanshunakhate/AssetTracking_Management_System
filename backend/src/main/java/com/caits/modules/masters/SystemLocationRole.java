package com.caits.modules.masters;

/**
 * Built-in location roles seeded per organization. Stored in org_location_mst.loc_system_role.
 */
public enum SystemLocationRole {
    MAIN_STORE("Main Store"),
    REJECTED("Rejected"),
    QUARANTINE("Quarantine"),
    DAMAGED("Damaged"),
    SCRAP("Scrap");

    private final String defaultName;

    SystemLocationRole(String defaultName) {
        this.defaultName = defaultName;
    }

    public String code() {
        return name();
    }

    public String defaultName() {
        return defaultName;
    }

    public static SystemLocationRole fromCode(String code) {
        for (SystemLocationRole role : values()) {
            if (role.name().equalsIgnoreCase(code)) {
                return role;
            }
        }
        throw new IllegalArgumentException("Unknown system location role: " + code);
    }
}
