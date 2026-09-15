package com.caits.security;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * Phase G4 — audit when full S4 values (PAN/GSTIN) are returned to an authorized caller.
 * Logs identifiers only — never the sensitive value itself.
 */
@Component
public class SensitiveAccessAudit {

    private static final Logger log = LoggerFactory.getLogger("com.caits.security.s4");

    public void viewedFullS4(String resourceType, Object resourceId, String fields) {
        CurrentUser user = SecurityUtils.currentUserOrNull();
        String who = user == null ? "anonymous" : user.loginId() + "(#" + user.userId() + ")";
        log.info("S4_VIEW user={} resource={} id={} fields={}", who, resourceType, resourceId, fields);
    }
}
