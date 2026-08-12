package com.caits.modules.masters;

import com.caits.common.ApiException;
import com.caits.domain.entity.OrgBusinessunitMst;
import com.caits.domain.entity.OrgLocationMst;
import com.caits.domain.repository.OrgBusinessunitMstRepository;
import com.caits.domain.repository.OrgLocationMstRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

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

    /** Creates the five system locations for one Operating Unit when missing. */
    @Transactional
    public void ensureForBu(Integer buId) {
        OrgBusinessunitMst bu = buRepo.findById(buId)
                .orElseThrow(() -> ApiException.notFound("Operating Unit not found"));
        for (SystemLocationRole role : SystemLocationRole.values()) {
            if (locationRepo.existsByLocBuIdBuAndLocSystemRole(buId, role.code())) {
                continue;
            }
            createSystemLocation(bu, role);
        }
    }

    @Transactional(readOnly = true)
    public OrgLocationMst requireSystemLocation(Integer buId, SystemLocationRole role) {
        return locationRepo.findByLocBuIdBuAndLocSystemRoleAndLocIsactiveTrue(buId, role.code())
                .orElseThrow(() -> ApiException.badRequest(
                        "System location \"" + role.defaultName() + "\" is not configured for this Operating Unit"));
    }

    @Transactional(readOnly = true)
    public Integer resolveBuId(Integer locationId) {
        if (locationId == null) {
            return null;
        }
        return locationRepo.findById(locationId)
                .map(OrgLocationMst::getLocBuIdBu)
                .orElse(null);
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

    private void createSystemLocation(OrgBusinessunitMst bu, SystemLocationRole role) {
        String baseCode = "SYS-" + bu.getBuBuId() + "-" + roleSuffix(role);
        String code = baseCode;
        if (locationRepo.existsByLocLocationCodeIgnoreCase(code)) {
            code = baseCode + "-OU";
        }
        OrgLocationMst loc = new OrgLocationMst();
        loc.setLocLocationCode(code);
        loc.setLocLocationName(role.defaultName());
        loc.setLocLocationType("System");
        loc.setLocEntityIdEnt(bu.getBuEntityIdEnt());
        loc.setLocBuIdBu(bu.getBuBuId());
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
