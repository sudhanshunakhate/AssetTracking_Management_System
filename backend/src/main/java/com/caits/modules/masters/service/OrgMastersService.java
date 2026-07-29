package com.caits.modules.masters.service;

import com.caits.common.ApiException;
import com.caits.common.MessageResponse;
import com.caits.common.PageResponse;
import com.caits.common.spec.SpecUtils;
import com.caits.domain.entity.*;
import com.caits.domain.repository.*;
import com.caits.modules.masters.dto.MasterDtos.*;
import com.caits.security.SecurityUtils;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class OrgMastersService {

    private final OrgEntityMstRepository entityRepo;
    private final OrgBusinessunitMstRepository buRepo;
    private final OrgLocationMstRepository locationRepo;

    public OrgMastersService(OrgEntityMstRepository entityRepo, OrgBusinessunitMstRepository buRepo,
                             OrgLocationMstRepository locationRepo) {
        this.entityRepo = entityRepo;
        this.buRepo = buRepo;
        this.locationRepo = locationRepo;
    }

    // ---- Entities ----
    @Transactional(readOnly = true)
    public PageResponse<EntityDto> listEntities(int page, int pageSize, String search, Boolean isActive) {
        Specification<OrgEntityMst> spec = SpecUtils.combine(
                SpecUtils.activeEquals("entIsactive", isActive),
                SpecUtils.searchContains(search, "entEntityCode", "entEntityName"));
        Page<OrgEntityMst> result = entityRepo.findAll(spec, PageRequest.of(Math.max(page - 1, 0), pageSize));
        return PageResponse.of(page, pageSize, result.getTotalElements(),
                result.getContent().stream().map(e -> toEntityDto(e, null)).toList());
    }

    @Transactional(readOnly = true)
    public EntityDto getEntity(Integer id) {
        return toEntityDto(findEntity(id), null);
    }

    @Transactional
    public EntityDto createEntity(EntityRequest req) {
        require(req.entityCode(), "entityCode");
        if (entityRepo.existsByEntEntityCodeIgnoreCase(req.entityCode())) {
            throw ApiException.conflict("Entity code already exists");
        }
        OrgEntityMst e = new OrgEntityMst();
        applyEntity(e, req);
        e.setEntCreatedBy(SecurityUtils.requireLoginId());
        e.setEntCreatedOn(LocalDateTime.now());
        return toEntityDto(entityRepo.save(e), "Entity created successfully");
    }

    @Transactional
    public EntityDto updateEntity(Integer id, EntityRequest req) {
        OrgEntityMst e = findEntity(id);
        if (req.entityCode() != null && !req.entityCode().equalsIgnoreCase(e.getEntEntityCode())
                && entityRepo.existsByEntEntityCodeIgnoreCase(req.entityCode())) {
            throw ApiException.conflict("Entity code already exists");
        }
        applyEntity(e, req);
        e.setEntModifiedBy(SecurityUtils.requireLoginId());
        e.setEntModifiedOn(LocalDateTime.now());
        return toEntityDto(entityRepo.save(e), "Entity updated successfully");
    }

    @Transactional
    public MessageResponse deleteEntity(Integer id) {
        OrgEntityMst e = findEntity(id);
        e.setEntIsactive(false);
        e.setEntModifiedBy(SecurityUtils.requireLoginId());
        e.setEntModifiedOn(LocalDateTime.now());
        entityRepo.save(e);
        return MessageResponse.of("Entity deactivated successfully");
    }

    private OrgEntityMst findEntity(Integer id) {
        return entityRepo.findById(id).orElseThrow(() -> ApiException.notFound("Entity not found"));
    }

    private void applyEntity(OrgEntityMst e, EntityRequest req) {
        e.setEntEntityCode(req.entityCode());
        e.setEntEntityName(req.entityName());
        e.setEntShortName(req.shortName());
        e.setEntGstin(req.gstin());
        e.setEntPanNo(req.panNo());
        e.setEntCity(req.city());
        e.setEntState(req.state());
        e.setEntIsactive(req.isActive() == null || req.isActive());
    }

    private EntityDto toEntityDto(OrgEntityMst e, String message) {
        return new EntityDto(e.getEntEntityId(), e.getEntEntityCode(), e.getEntEntityName(), e.getEntShortName(),
                e.getEntGstin(), e.getEntPanNo(), e.getEntCity(), e.getEntState(), e.getEntIsactive(),
                e.getEntCreatedBy(), e.getEntCreatedOn(), e.getEntModifiedBy(), e.getEntModifiedOn(), message);
    }

    // ---- Business Units ----
    @Transactional(readOnly = true)
    public PageResponse<BusinessUnitDto> listBus(int page, int pageSize, String search, Boolean isActive, Integer entityId) {
        Specification<OrgBusinessunitMst> spec = SpecUtils.combine(
                SpecUtils.activeEquals("buIsactive", isActive),
                SpecUtils.searchContains(search, "buBuCode", "buBuName"),
                SpecUtils.eq("buEntityIdEnt", entityId));
        Page<OrgBusinessunitMst> result = buRepo.findAll(spec, PageRequest.of(Math.max(page - 1, 0), pageSize));
        return PageResponse.of(page, pageSize, result.getTotalElements(),
                result.getContent().stream().map(e -> toBuDto(e, null)).toList());
    }

    @Transactional(readOnly = true)
    public BusinessUnitDto getBu(Integer id) {
        return toBuDto(findBu(id), null);
    }

    @Transactional
    public BusinessUnitDto createBu(BusinessUnitRequest req) {
        require(req.buCode(), "buCode");
        if (req.entityId() == null) throw ApiException.badRequest("entityId is required");
        findEntity(req.entityId());
        if (buRepo.existsByBuBuCodeIgnoreCase(req.buCode())) {
            throw ApiException.conflict("Business unit code already exists");
        }
        OrgBusinessunitMst e = new OrgBusinessunitMst();
        applyBu(e, req);
        e.setBuCreatedBy(SecurityUtils.requireLoginId());
        e.setBuCreatedOn(LocalDateTime.now());
        return toBuDto(buRepo.save(e), "Business Unit created successfully");
    }

    @Transactional
    public BusinessUnitDto updateBu(Integer id, BusinessUnitRequest req) {
        OrgBusinessunitMst e = findBu(id);
        if (req.buCode() != null && !req.buCode().equalsIgnoreCase(e.getBuBuCode())
                && buRepo.existsByBuBuCodeIgnoreCase(req.buCode())) {
            throw ApiException.conflict("Business unit code already exists");
        }
        if (req.entityId() != null) findEntity(req.entityId());
        applyBu(e, req);
        e.setBuModifiedBy(SecurityUtils.requireLoginId());
        e.setBuModifiedOn(LocalDateTime.now());
        return toBuDto(buRepo.save(e), "Business Unit updated successfully");
    }

    @Transactional
    public MessageResponse deleteBu(Integer id) {
        OrgBusinessunitMst e = findBu(id);
        e.setBuIsactive(false);
        e.setBuModifiedBy(SecurityUtils.requireLoginId());
        e.setBuModifiedOn(LocalDateTime.now());
        buRepo.save(e);
        return MessageResponse.of("Business Unit deactivated successfully");
    }

    private OrgBusinessunitMst findBu(Integer id) {
        return buRepo.findById(id).orElseThrow(() -> ApiException.notFound("Business unit not found"));
    }

    private void applyBu(OrgBusinessunitMst e, BusinessUnitRequest req) {
        e.setBuBuCode(req.buCode());
        e.setBuBuName(req.buName());
        if (req.entityId() != null) e.setBuEntityIdEnt(req.entityId());
        e.setBuBuType(req.buType());
        e.setBuManagerEmpIdEmp(req.managerEmpId());
        e.setBuCity(req.city());
        e.setBuState(req.state());
        e.setBuIsactive(req.isActive() == null || req.isActive());
    }

    private BusinessUnitDto toBuDto(OrgBusinessunitMst e, String message) {
        return new BusinessUnitDto(e.getBuBuId(), e.getBuBuCode(), e.getBuBuName(), e.getBuEntityIdEnt(), e.getBuBuType(),
                e.getBuManagerEmpIdEmp(), e.getBuCity(), e.getBuState(), e.getBuIsactive(),
                e.getBuCreatedBy(), e.getBuCreatedOn(), e.getBuModifiedBy(), e.getBuModifiedOn(), message);
    }

    // ---- Locations ----
    @Transactional(readOnly = true)
    public PageResponse<LocationDto> listLocations(int page, int pageSize, String search, Boolean isActive,
                                                   Integer entityId, Integer buId) {
        Specification<OrgLocationMst> spec = SpecUtils.combine(
                SpecUtils.activeEquals("locIsactive", isActive),
                SpecUtils.searchContains(search, "locLocationCode", "locLocationName"),
                SpecUtils.eq("locEntityIdEnt", entityId),
                SpecUtils.eq("locBuIdBu", buId));
        Page<OrgLocationMst> result = locationRepo.findAll(spec, PageRequest.of(Math.max(page - 1, 0), pageSize));
        return PageResponse.of(page, pageSize, result.getTotalElements(),
                result.getContent().stream().map(e -> toLocDto(e, null)).toList());
    }

    @Transactional(readOnly = true)
    public LocationDto getLocation(Integer id) {
        return toLocDto(findLocation(id), null);
    }

    @Transactional
    public LocationDto createLocation(LocationRequest req) {
        require(req.locationCode(), "locationCode");
        if (req.entityId() == null || req.buId() == null) {
            throw ApiException.badRequest("entityId and buId are required");
        }
        findEntity(req.entityId());
        findBu(req.buId());
        if (locationRepo.existsByLocLocationCodeIgnoreCase(req.locationCode())) {
            throw ApiException.conflict("Location code already exists");
        }
        OrgLocationMst e = new OrgLocationMst();
        applyLoc(e, req);
        e.setLocCreatedBy(SecurityUtils.requireLoginId());
        e.setLocCreatedOn(LocalDateTime.now());
        return toLocDto(locationRepo.save(e), "Location created successfully");
    }

    @Transactional
    public LocationDto updateLocation(Integer id, LocationRequest req) {
        OrgLocationMst e = findLocation(id);
        if (req.locationCode() != null && !req.locationCode().equalsIgnoreCase(e.getLocLocationCode())
                && locationRepo.existsByLocLocationCodeIgnoreCase(req.locationCode())) {
            throw ApiException.conflict("Location code already exists");
        }
        if (req.entityId() != null) findEntity(req.entityId());
        if (req.buId() != null) findBu(req.buId());
        applyLoc(e, req);
        e.setLocModifiedBy(SecurityUtils.requireLoginId());
        e.setLocModifiedOn(LocalDateTime.now());
        return toLocDto(locationRepo.save(e), "Location updated successfully");
    }

    @Transactional
    public MessageResponse deleteLocation(Integer id) {
        OrgLocationMst e = findLocation(id);
        e.setLocIsactive(false);
        e.setLocModifiedBy(SecurityUtils.requireLoginId());
        e.setLocModifiedOn(LocalDateTime.now());
        locationRepo.save(e);
        return MessageResponse.of("Location deactivated successfully");
    }

    private OrgLocationMst findLocation(Integer id) {
        return locationRepo.findById(id).orElseThrow(() -> ApiException.notFound("Location not found"));
    }

    private void applyLoc(OrgLocationMst e, LocationRequest req) {
        e.setLocLocationCode(req.locationCode());
        e.setLocLocationName(req.locationName());
        e.setLocLocationType(req.locationType());
        if (req.entityId() != null) e.setLocEntityIdEnt(req.entityId());
        if (req.buId() != null) e.setLocBuIdBu(req.buId());
        e.setLocManagerEmpIdEmp(req.managerEmpId());
        e.setLocCity(req.city());
        e.setLocIsactive(req.isActive() == null || req.isActive());
    }

    private LocationDto toLocDto(OrgLocationMst e, String message) {
        return new LocationDto(e.getLocLocationId(), e.getLocLocationCode(), e.getLocLocationName(), e.getLocLocationType(),
                e.getLocEntityIdEnt(), e.getLocBuIdBu(), e.getLocManagerEmpIdEmp(), e.getLocCity(), e.getLocIsactive(),
                e.getLocCreatedBy(), e.getLocCreatedOn(), e.getLocModifiedBy(), e.getLocModifiedOn(), message);
    }

    private static void require(String v, String field) {
        if (v == null || v.isBlank()) throw ApiException.badRequest(field + " is required");
    }
}
