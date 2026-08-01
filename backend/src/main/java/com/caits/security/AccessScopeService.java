package com.caits.security;

import com.caits.common.ApiException;
import com.caits.common.spec.SpecUtils;
import com.caits.domain.entity.SysmUserBuMappingDtl;
import com.caits.domain.entity.SysmUserLocationMappingDtl;
import com.caits.domain.entity.SysmUserloginMst;
import com.caits.domain.repository.SysmUserBuMappingDtlRepository;
import com.caits.domain.repository.SysmUserLocationMappingDtlRepository;
import com.caits.domain.repository.SysmUserloginMstRepository;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.Objects;

/**
 * Resolves the current user's Organization / OU / Location access and turns
 * it into JPA Specifications and write-time checks. Roles listed in
 * {@code caits.security.location-scope-exempt-roles} (default: ADMIN) bypass
 * every restriction.
 */
@Service
public class AccessScopeService {

    public record Scope(
            boolean unrestricted,
            Integer entityId,
            String buAccessScope,
            List<Integer> allowedBuIds,
            String locationAccessScope,
            List<Integer> allowedLocationIds,
            Integer defaultLocationId
    ) {
        public boolean buRestricted() {
            return !unrestricted && "SELECTED".equalsIgnoreCase(buAccessScope);
        }

        public boolean locationRestricted() {
            return !unrestricted && "SELECTED".equalsIgnoreCase(locationAccessScope);
        }

        public boolean entityRestricted() {
            return !unrestricted && entityId != null;
        }
    }

    private final SysmUserloginMstRepository userRepo;
    private final SysmUserBuMappingDtlRepository buMappingRepo;
    private final SysmUserLocationMappingDtlRepository locationMappingRepo;
    private final JwtProperties properties;

    public AccessScopeService(
            SysmUserloginMstRepository userRepo,
            SysmUserBuMappingDtlRepository buMappingRepo,
            SysmUserLocationMappingDtlRepository locationMappingRepo,
            JwtProperties properties) {
        this.userRepo = userRepo;
        this.buMappingRepo = buMappingRepo;
        this.locationMappingRepo = locationMappingRepo;
        this.properties = properties;
    }

    @Transactional(readOnly = true)
    public Scope current() {
        CurrentUser cu = SecurityUtils.requireCurrentUser();
        if (isExempt(cu.roleCode())) {
            return new Scope(true, null, "ALL", List.of(), "ALL", List.of(), null);
        }
        SysmUserloginMst user = userRepo.findById(cu.userId())
                .orElseThrow(() -> ApiException.unauthorized("User not found"));
        List<Integer> buIds = buMappingRepo.findByUboaUserIdUsr(user.getUsrUserId()).stream()
                .map(SysmUserBuMappingDtl::getUboaBuIdBu)
                .filter(Objects::nonNull)
                .toList();
        List<Integer> locIds = locationMappingRepo.findByUlocUserIdUsr(user.getUsrUserId()).stream()
                .map(SysmUserLocationMappingDtl::getUlocLocationIdLoc)
                .filter(Objects::nonNull)
                .toList();
        return new Scope(
                false,
                user.getUsrEntityIdEnt(),
                nullSafeScope(user.getUsrBuAccessScope()),
                buIds,
                nullSafeScope(user.getUsrLocationAccessScope()),
                locIds,
                user.getUsrLocationIdLoc());
    }

    /** Spec that limits a location-id column to the caller's allow-list. Null = unrestricted. */
    public <T> Specification<T> locationSpec(String field) {
        Scope s = current();
        if (!s.locationRestricted()) return null;
        return SpecUtils.in(field, s.allowedLocationIds());
    }

    /** Spec that limits a business-unit-id column. Null = unrestricted. */
    public <T> Specification<T> buSpec(String field) {
        Scope s = current();
        if (!s.buRestricted()) return null;
        return SpecUtils.in(field, s.allowedBuIds());
    }

    /** Spec that limits an entity-id column to the caller's Organization. Null = unrestricted. */
    public <T> Specification<T> entitySpec(String field) {
        Scope s = current();
        if (!s.entityRestricted()) return null;
        return SpecUtils.eq(field, s.entityId());
    }

    /**
     * Intersects a caller-supplied location filter with the allow-list.
     * Returns {@code null} when unrestricted and no filter was asked for.
     * Returns an empty list when the caller asked for a location they do not own
     * (so the query returns zero rows rather than leaking data).
     */
    public List<Integer> resolveLocationFilter(Integer requested) {
        Scope s = current();
        if (!s.locationRestricted()) {
            return requested == null ? null : List.of(requested);
        }
        List<Integer> allowed = s.allowedLocationIds();
        if (requested == null) return allowed;
        return allowed.contains(requested) ? List.of(requested) : List.of();
    }

    /** Rejects a write that targets a location outside the caller's allow-list. */
    public void requireLocationAllowed(Integer locationId) {
        if (locationId == null) return;
        Scope s = current();
        if (!s.locationRestricted()) return;
        if (!s.allowedLocationIds().contains(locationId)) {
            throw ApiException.forbidden("You do not have access to this location");
        }
    }

    public void requireBuAllowed(Integer buId) {
        if (buId == null) return;
        Scope s = current();
        if (!s.buRestricted()) return;
        if (!s.allowedBuIds().contains(buId)) {
            throw ApiException.forbidden("You do not have access to this Operating Unit");
        }
    }

    private boolean isExempt(String roleCode) {
        if (roleCode == null) return false;
        return properties.exemptRoleCodes().contains(roleCode.toUpperCase(Locale.ROOT));
    }

    private static String nullSafeScope(String scope) {
        return scope == null || scope.isBlank() ? "ALL" : scope.trim();
    }
}
