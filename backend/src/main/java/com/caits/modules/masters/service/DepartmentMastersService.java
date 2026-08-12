package com.caits.modules.masters.service;

import com.caits.common.ApiException;
import com.caits.common.MessageResponse;
import com.caits.common.PageResponse;
import com.caits.common.spec.SpecUtils;
import com.caits.domain.entity.HrcDepartmentMst;
import com.caits.domain.entity.HrcEmployeeMst;
import com.caits.domain.entity.OrgEntityMst;
import com.caits.domain.repository.HrcDepartmentMstRepository;
import com.caits.domain.repository.HrcEmployeeMstRepository;
import com.caits.domain.repository.OrgEntityMstRepository;
import com.caits.modules.masters.dto.MasterDtos.DepartmentDto;
import com.caits.modules.masters.dto.MasterDtos.DepartmentRequest;
import com.caits.security.AccessScopeService;
import com.caits.security.SecurityUtils;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class DepartmentMastersService {

    private final HrcDepartmentMstRepository departmentRepo;
    private final OrgEntityMstRepository entityRepo;
    private final HrcEmployeeMstRepository employeeRepo;
    private final AccessScopeService accessScope;

    public DepartmentMastersService(
            HrcDepartmentMstRepository departmentRepo,
            OrgEntityMstRepository entityRepo,
            HrcEmployeeMstRepository employeeRepo,
            AccessScopeService accessScope
    ) {
        this.departmentRepo = departmentRepo;
        this.entityRepo = entityRepo;
        this.employeeRepo = employeeRepo;
        this.accessScope = accessScope;
    }

    @Transactional(readOnly = true)
    public PageResponse<DepartmentDto> list(int page, int pageSize, String search, Boolean isActive, Integer entityId) {
        Specification<HrcDepartmentMst> spec = SpecUtils.combine(
                SpecUtils.activeEquals("deptIsactive", isActive),
                SpecUtils.searchContains(search, "deptDepartmentCode", "deptDepartmentName"),
                SpecUtils.eq("deptEntityIdEnt", entityId),
                accessScope.entitySpec("deptEntityIdEnt"));
        Page<HrcDepartmentMst> result = departmentRepo.findAll(spec, PageRequest.of(Math.max(page - 1, 0), pageSize));
        return PageResponse.of(page, pageSize, result.getTotalElements(),
                result.getContent().stream().map(e -> toDto(e, null)).toList());
    }

    @Transactional(readOnly = true)
    public DepartmentDto get(Integer id) {
        return toDto(find(id), null);
    }

    @Transactional
    public DepartmentDto create(DepartmentRequest req) {
        require(req.departmentCode(), "departmentCode");
        require(req.departmentName(), "departmentName");
        if (req.entityId() == null) throw ApiException.badRequest("entityId is required");
        findEntity(req.entityId());
        validateHead(req.headEmpId());
        if (departmentRepo.existsByDeptDepartmentCodeIgnoreCase(req.departmentCode())) {
            throw ApiException.conflict("Department code already exists");
        }
        HrcDepartmentMst e = new HrcDepartmentMst();
        apply(e, req);
        e.setDeptCreatedBy(SecurityUtils.requireLoginId());
        e.setDeptCreatedOn(LocalDateTime.now());
        return toDto(departmentRepo.save(e), "Department created successfully");
    }

    @Transactional
    public DepartmentDto update(Integer id, DepartmentRequest req) {
        HrcDepartmentMst e = find(id);
        if (req.departmentCode() != null && !req.departmentCode().equalsIgnoreCase(e.getDeptDepartmentCode())
                && departmentRepo.existsByDeptDepartmentCodeIgnoreCase(req.departmentCode())) {
            throw ApiException.conflict("Department code already exists");
        }
        if (req.entityId() != null) findEntity(req.entityId());
        validateHead(req.headEmpId());
        apply(e, req);
        e.setDeptModifiedBy(SecurityUtils.requireLoginId());
        e.setDeptModifiedOn(LocalDateTime.now());
        return toDto(departmentRepo.save(e), "Department updated successfully");
    }

    @Transactional
    public MessageResponse delete(Integer id) {
        HrcDepartmentMst e = find(id);
        e.setDeptIsactive(false);
        e.setDeptModifiedBy(SecurityUtils.requireLoginId());
        e.setDeptModifiedOn(LocalDateTime.now());
        departmentRepo.save(e);
        return MessageResponse.of("Department deactivated successfully");
    }

    @Transactional(readOnly = true)
    public String resolveName(Integer departmentId) {
        if (departmentId == null) return null;
        return departmentRepo.findById(departmentId)
                .map(HrcDepartmentMst::getDeptDepartmentName)
                .orElse(null);
    }

    private HrcDepartmentMst find(Integer id) {
        return departmentRepo.findById(id).orElseThrow(() -> ApiException.notFound("Department not found"));
    }

    private OrgEntityMst findEntity(Integer id) {
        return entityRepo.findById(id).orElseThrow(() -> ApiException.notFound("Entity not found"));
    }

    private void validateHead(Integer headEmpId) {
        if (headEmpId == null) return;
        employeeRepo.findById(headEmpId)
                .orElseThrow(() -> ApiException.badRequest("Head of Department employee not found"));
    }

    private void apply(HrcDepartmentMst e, DepartmentRequest req) {
        if (req.departmentCode() != null) e.setDeptDepartmentCode(req.departmentCode().trim().toUpperCase());
        if (req.departmentName() != null) e.setDeptDepartmentName(req.departmentName().trim());
        if (req.entityId() != null) e.setDeptEntityIdEnt(req.entityId());
        e.setDeptHeadEmpIdEmp(req.headEmpId());
        e.setDeptDesc(req.desc());
        if (req.isActive() != null) e.setDeptIsactive(req.isActive());
        else if (e.getDeptDepartmentId() == null) e.setDeptIsactive(true);
    }

    private DepartmentDto toDto(HrcDepartmentMst e, String message) {
        String headName = null;
        if (e.getDeptHeadEmpIdEmp() != null) {
            headName = employeeRepo.findById(e.getDeptHeadEmpIdEmp())
                    .map(emp -> formatEmpName(emp))
                    .orElse(null);
        }
        return new DepartmentDto(
                e.getDeptDepartmentId(), e.getDeptDepartmentCode(), e.getDeptDepartmentName(),
                e.getDeptEntityIdEnt(), e.getDeptHeadEmpIdEmp(), headName, e.getDeptDesc(), e.getDeptIsactive(),
                e.getDeptCreatedBy(), e.getDeptCreatedOn(), e.getDeptModifiedBy(), e.getDeptModifiedOn(), message);
    }

    private static String formatEmpName(HrcEmployeeMst emp) {
        String first = emp.getEmpFirstName() != null ? emp.getEmpFirstName().trim() : "";
        String last = emp.getEmpLastName() != null ? emp.getEmpLastName().trim() : "";
        return (first + (last.isEmpty() ? "" : " " + last)).trim();
    }

    private static void require(String v, String field) {
        if (v == null || v.isBlank()) throw ApiException.badRequest(field + " is required");
    }
}
