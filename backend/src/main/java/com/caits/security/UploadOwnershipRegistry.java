package com.caits.security;

import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Tracks freshly uploaded file keys until they are linked to a txn.
 * Prevents IDOR downloads of unattached UUID paths by other users.
 */
@Component
public class UploadOwnershipRegistry {

    private static final long TTL_MS = 24L * 60L * 60L * 1000L;

    private final Map<String, Ownership> byKey = new ConcurrentHashMap<>();

    public void register(String relativeKey, Integer userId) {
        if (relativeKey == null || relativeKey.isBlank() || userId == null) {
            return;
        }
        byKey.put(relativeKey, new Ownership(userId, Instant.now().toEpochMilli()));
        purgeExpired();
    }

    public boolean isOwnedBy(String relativeKey, Integer userId) {
        if (relativeKey == null || userId == null) {
            return false;
        }
        Ownership o = byKey.get(relativeKey);
        if (o == null) {
            return false;
        }
        if (Instant.now().toEpochMilli() - o.createdAtMs() > TTL_MS) {
            byKey.remove(relativeKey);
            return false;
        }
        return userId.equals(o.userId());
    }

    public void release(String relativeKey) {
        if (relativeKey != null) {
            byKey.remove(relativeKey);
        }
    }

    private void purgeExpired() {
        long now = Instant.now().toEpochMilli();
        byKey.entrySet().removeIf(e -> now - e.getValue().createdAtMs() > TTL_MS);
    }

    private record Ownership(Integer userId, long createdAtMs) {}
}
