package com.caits.security;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class UploadOwnershipRegistryTest {

    @Test
    void onlyOwnerCanClaimFreshUpload() {
        UploadOwnershipRegistry reg = new UploadOwnershipRegistry();
        reg.register("2026/09/abc.pdf", 7);
        assertTrue(reg.isOwnedBy("2026/09/abc.pdf", 7));
        assertFalse(reg.isOwnedBy("2026/09/abc.pdf", 8));
        assertFalse(reg.isOwnedBy("missing", 7));
    }
}
