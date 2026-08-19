package com.caits.modules.masters;

import com.caits.common.ApiException;
import com.caits.domain.entity.OrgBusinessunitMst;
import com.caits.domain.entity.OrgLocationMst;
import com.caits.domain.repository.OrgBusinessunitMstRepository;
import com.caits.domain.repository.OrgLocationMstRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class SystemLocationService {

    private final OrgBusinessunitMstRepository buRepo;
    private final OrgLocationMstRepository locationRepo;

    public SystemLocationService(
            OrgBusinessunitMstRepository buRepo,
            OrgLocationMstRepository locationRepo
    ) {
        this.buRepo = buRepo;
        this.locationRepo = locationRepo;
    }

    /** Creates the five global system locations for an Organization when missing. */
    @Transactional
    public void ensureForEntity(Integer entityId) {
        if (entityId == null) {
            return;
        }
        for (SystemLocationRole role : SystemLocationRole.values()) {
            if (locationRepo.existsByLocEntityIdEntAndLocSystemRoleAndLocIsSystemLocationTrueAndLocBuIdBuIsNull(
                    entityId, role.code())) {
                continue;
            }
            createSystemLocationForEntity(entityId, role);
        }
    }

  /** @deprecated Prefer {@link #ensureForEntity}; kept for compatibility. */
    @Transactional
    public void ensureForBu(Integer buId) {
        OrgBusinessunitMst bu = buRepo.findById(buId)
                .orElseThrow(() -> ApiException.notFound("Operating Unit not found"));
        ensureForEntity(bu.getBuEntityIdEnt());
    }

    @Transactional(readOnly = true)
    public OrgLocationMst requireSystemLocation(Integer buId, SystemLocationRole role) {
        Integer entityId = resolveEntityIdFromBu(buId);
        if (entityId == null) {
            throw ApiException.badRequest("Organization could not be resolved for system location lookup");
        }
        return requireSystemLocationForEntity(entityId, role);
    }

    @Transactional(readOnly = true)
    public OrgLocationMst requireSystemLocationForEntity(Integer entityId, SystemLocationRole role) {
        return locationRepo.findByLocEntityIdEntAndLocSystemRoleAndLocIsSystemLocationTrueAndLocIsactiveTrue(
                        entityId, role.code())
                .orElseThrow(() -> ApiException.badRequest(
                        "System location \"" + role.defaultName() + "\" is not configured for this Organization"));
    }

    @Transactional(readOnly = true)
    public OrgLocationMst requireSystemLocationForStore(Integer locationId, SystemLocationRole role) {
        Integer entityId = resolveEntityId(null, locationId);
        if (entityId == null) {
            throw ApiException.badRequest("Organization could not be resolved from the selected store");
        }
        return requireSystemLocationForEntity(entityId, role);
    }

    @Transactional(readOnly = true)
    public Integer resolveBuId(Integer locationId) {
        if (locationId == null) {
            return null;
        }
        OrgLocationMst loc = locationRepo.findById(locationId).orElse(null);
        if (loc == null) {
            return null;
        }
        if (loc.getLocBuIdBu() != null) {
            return loc.getLocBuIdBu();
        }
        return firstActiveBuIdForEntity(loc.getLocEntityIdEnt());
    }

    @Transactional(readOnly = true)
    public Integer resolveEntityId(Integer headerEntityId, Integer locationId) {
        if (headerEntityId != null) {
            return headerEntityId;
        }
        if (locationId == null) {
            return null;
        }
        return locationRepo.findById(locationId)
                .map(OrgLocationMst::getLocEntityIdEnt)
                .orElse(null);
    }

    private Integer resolveEntityIdFromBu(Integer buId) {
        if (buId == null) {
            return null;
        }
        return buRepo.findById(buId).map(OrgBusinessunitMst::getBuEntityIdEnt).orElse(null);
    }

    private Integer firstActiveBuIdForEntity(Integer entityId) {
        if (entityId == null) {
            return null;
        }
        List<OrgBusinessunitMst> list = buRepo.findByBuEntityIdEntAndBuIsactiveTrue(entityId);
        return list.isEmpty() ? null : list.get(0).getBuBuId();
    }

    private void createSystemLocationForEntity(Integer entityId, SystemLocationRole role) {
        String baseCode = "SYS-ENT-" + entityId + "-" + roleSuffix(role);
        String code = baseCode;
        if (locationRepo.existsByLocLocationCodeIgnoreCase(code)) {
            code = baseCode + "-G";
        }
        OrgLocationMst loc = new OrgLocationMst();
        loc.setLocLocationCode(code);
        loc.setLocLocationName(role.defaultName());
        loc.setLocLocationType("System");
        loc.setLocEntityIdEnt(entityId);
        loc.setLocBuIdBu(null);
        loc.setLocIsactive(true);
        loc.setLocIsSystemLocation(true);
        loc.setLocSystemRole(role.code());
        loc.setLocPrintLocationName(role.defaultName());
        loc.setLocCreatedBy("system");
        loc.setLocCreatedOn(LocalDateTime.now());
        locationRepo.save(loc);
    }

    private static String roleSuffix(SystemLocationRole role) {
        return switch (role) {
            case MAIN_STORE -> "MAIN";
            case REJECTED -> "REJ";
            case QUARANTINE -> "QRT";
            case DAMAGED -> "DMG";
            case SCRAP -> "SCR";
        };
    }
}
