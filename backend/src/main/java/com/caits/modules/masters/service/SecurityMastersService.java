package com.caits.modules.masters.service;

import com.caits.common.ApiException;
import com.caits.common.MessageResponse;
import com.caits.common.PageResponse;
import com.caits.common.spec.SpecUtils;
import com.caits.domain.entity.*;
import com.caits.domain.repository.*;
import com.caits.modules.masters.dto.MasterDtos.*;
import com.caits.security.AccessScopeService;
import com.caits.security.SecurityUtils;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class SecurityMastersService {

    private final SysmMenutreeMstRepository menuRepo;
    private final SysmRolesMstRepository roleRepo;
    private final SysmRolepermissionDtlRepository rolePermRepo;
    private final HrcEmployeeMstRepository employeeRepo;
    private final SysmUserloginMstRepository userRepo;
    private final SysmUserBuMappingDtlRepository buMappingRepo;
    private final SysmUserLocationMappingDtlRepository locationMappingRepo;
    private final SysmUseraccessExceptionDtlRepository exceptionRepo;
    private final OrgEntityMstRepository entityRepo;
    private final PasswordEncoder passwordEncoder;
    private final AccessScopeService accessScope;

    public SecurityMastersService(SysmMenutreeMstRepository menuRepo, SysmRolesMstRepository roleRepo,
                                  SysmRolepermissionDtlRepository rolePermRepo, HrcEmployeeMstRepository employeeRepo,
                                  SysmUserloginMstRepository userRepo, SysmUserBuMappingDtlRepository buMappingRepo,
                                  SysmUserLocationMappingDtlRepository locationMappingRepo,
                                  SysmUseraccessExceptionDtlRepository exceptionRepo, OrgEntityMstRepository entityRepo,
                                  PasswordEncoder passwordEncoder, AccessScopeService accessScope) {
        this.menuRepo = menuRepo;
        this.roleRepo = roleRepo;
        this.rolePermRepo = rolePermRepo;
        this.employeeRepo = employeeRepo;
        this.userRepo = userRepo;
        this.buMappingRepo = buMappingRepo;
        this.locationMappingRepo = locationMappingRepo;
        this.exceptionRepo = exceptionRepo;
        this.entityRepo = entityRepo;
        this.passwordEncoder = passwordEncoder;
        this.accessScope = accessScope;
    }

    // ---- Menus ----
    @Transactional(readOnly = true)
    public List<MenuDto> listMenus() {
        return menuRepo.findByMtreeIsactiveTrueOrderByMtreeSortOrderAsc().stream()
                .map(m -> new MenuDto(m.getMtreeMenuId(), m.getMtreeMenuCode(), m.getMtreeMenuLabel(),
                        m.getMtreeMenuGroup(), m.getMtreeSortOrder(), m.getMtreeGroupSortOrder(), m.getMtreeDocType(),
                        m.getMtreeSupportsView(), m.getMtreeSupportsCreate(), m.getMtreeSupportsEdit(),
                        m.getMtreeSupportsDelete(), m.getMtreeSupportsApprove(), m.getMtreeSupportsReject(),
                        m.getMtreeSupportsPrint(), m.getMtreeSupportsExport()))
                .toList();
    }

    // ---- Roles ----
    @Transactional(readOnly = true)
    public PageResponse<RoleDto> listRoles(int page, int pageSize, String search, Boolean isActive) {
        Specification<SysmRolesMst> spec = SpecUtils.combine(
                SpecUtils.activeEquals("rolIsactive", isActive),
                SpecUtils.searchContains(search, "rolRoleCode", "rolRoleName"));
        Page<SysmRolesMst> result = roleRepo.findAll(spec, PageRequest.of(Math.max(page - 1, 0), pageSize));
        return PageResponse.of(page, pageSize, result.getTotalElements(),
                result.getContent().stream().map(e -> toRoleDto(e, null)).toList());
    }

    @Transactional(readOnly = true)
    public RoleDto getRole(Integer id) {
        return toRoleDto(findRole(id), null);
    }

    @Transactional
    public RoleDto createRole(RoleRequest req) {
        require(req.roleCode(), "roleCode");
        if (req.roleLevel() == null) throw ApiException.badRequest("roleLevel is required");
        if (roleRepo.existsByRolRoleCodeIgnoreCase(req.roleCode())) {
            throw ApiException.conflict("Role code already exists");
        }
        SysmRolesMst e = new SysmRolesMst();
        applyRole(e, req);
        e.setRolCreatedBy(SecurityUtils.requireLoginId());
        e.setRolCreatedOn(LocalDateTime.now());
        return toRoleDto(roleRepo.save(e), "Role created successfully");
    }

    @Transactional
    public RoleDto updateRole(Integer id, RoleRequest req) {
        SysmRolesMst e = findRole(id);
        if (Boolean.TRUE.equals(e.getRolIsSystemRole()) && req.roleCode() != null
                && !req.roleCode().equalsIgnoreCase(e.getRolRoleCode())) {
            throw ApiException.badRequest("Cannot change system role code");
        }
        if (req.roleCode() != null && !req.roleCode().equalsIgnoreCase(e.getRolRoleCode())
                && roleRepo.existsByRolRoleCodeIgnoreCase(req.roleCode())) {
            throw ApiException.conflict("Role code already exists");
        }
        applyRole(e, req);
        e.setRolModifiedBy(SecurityUtils.requireLoginId());
        e.setRolModifiedOn(LocalDateTime.now());
        return toRoleDto(roleRepo.save(e), "Role updated successfully");
    }

    @Transactional
    public MessageResponse deleteRole(Integer id) {
        SysmRolesMst e = findRole(id);
        if (Boolean.TRUE.equals(e.getRolIsSystemRole())) {
            throw ApiException.conflict("Cannot deactivate a system role");
        }
        e.setRolIsactive(false);
        e.setRolModifiedBy(SecurityUtils.requireLoginId());
        e.setRolModifiedOn(LocalDateTime.now());
        roleRepo.save(e);
        return MessageResponse.of("Role deactivated successfully");
    }

    @Transactional(readOnly = true)
    public List<PermissionDto> getPermissions(Integer roleId) {
        findRole(roleId);
        Map<Integer, SysmMenutreeMst> menuById = menuRepo.findAll().stream()
                .collect(Collectors.toMap(SysmMenutreeMst::getMtreeMenuId, m -> m, (a, b) -> a));
        return rolePermRepo.findByRlpmRoleIdRol(roleId).stream()
                .map(p -> {
                    SysmMenutreeMst menu = menuById.get(p.getRlpmMenuIdMtree());
                    return new PermissionDto(
                            p.getRlpmMenuIdMtree(),
                            menu != null ? menu.getMtreeMenuCode() : null,
                            p.getRlpmCanView(), p.getRlpmCanCreate(), p.getRlpmCanEdit(), p.getRlpmCanDelete(),
                            p.getRlpmCanApprove(), p.getRlpmCanReject(), p.getRlpmCanPrint(), p.getRlpmCanExport(),
                            menu != null ? menu.getMtreeSortOrder() : null,
                            menu != null ? menu.getMtreeGroupSortOrder() : null);
                })
                .sorted(Comparator.comparing(d -> d.sortOrder() == null ? Integer.MAX_VALUE : d.sortOrder()))
                .toList();
    }

    @Transactional
    public MessageResponse putPermissions(Integer roleId, List<PermissionDto> permissions) {
        findRole(roleId);
        rolePermRepo.deleteByRlpmRoleIdRol(roleId);
        // Hibernate orders inserts before deletes, so the rewritten rows would collide with
        // the old ones on (role, menu). Force the delete out first.
        rolePermRepo.flush();
        if (permissions != null) {
            List<SysmMenutreeMst> allMenus = menuRepo.findAll();
            Map<String, SysmMenutreeMst> menuByCode = allMenus.stream()
                    .collect(Collectors.toMap(
                            m -> m.getMtreeMenuCode() == null ? "" : m.getMtreeMenuCode().toUpperCase(),
                            m -> m,
                            (a, b) -> a));
            String loginId = SecurityUtils.requireLoginId();
            LocalDateTime now = LocalDateTime.now();

            // Section sequence is stored on every menu in the group — apply once per group.
            Map<String, Integer> groupSortByName = new java.util.LinkedHashMap<>();
            for (PermissionDto dto : permissions) {
                if (dto.groupSortOrder() == null) continue;
                SysmMenutreeMst probe = null;
                if (dto.menuId() != null) probe = menuRepo.findById(dto.menuId()).orElse(null);
                if (probe == null && dto.module() != null && !dto.module().isBlank()) {
                    probe = menuByCode.get(dto.module().trim().toUpperCase());
                }
                if (probe != null && probe.getMtreeMenuGroup() != null) {
                    groupSortByName.put(probe.getMtreeMenuGroup(), dto.groupSortOrder());
                }
            }
            for (Map.Entry<String, Integer> entry : groupSortByName.entrySet()) {
                for (SysmMenutreeMst m : allMenus) {
                    if (!Objects.equals(entry.getKey(), m.getMtreeMenuGroup())) continue;
                    if (Objects.equals(m.getMtreeGroupSortOrder(), entry.getValue())) continue;
                    m.setMtreeGroupSortOrder(entry.getValue());
                    m.setMtreeModifiedBy(loginId);
                    m.setMtreeModifiedOn(now);
                    menuRepo.save(m);
                }
            }

            for (PermissionDto dto : permissions) {
                SysmMenutreeMst menu = null;
                if (dto.menuId() != null) {
                    menu = menuRepo.findById(dto.menuId()).orElse(null);
                }
                if (menu == null && dto.module() != null && !dto.module().isBlank()) {
                    menu = menuByCode.get(dto.module().trim().toUpperCase());
                }
                if (menu == null) {
                    throw ApiException.badRequest("Unknown menu for permission: "
                            + (dto.module() != null ? dto.module() : String.valueOf(dto.menuId())));
                }
                Integer menuId = menu.getMtreeMenuId();
                if (dto.sortOrder() != null && !Objects.equals(menu.getMtreeSortOrder(), dto.sortOrder())) {
                    menu.setMtreeSortOrder(dto.sortOrder());
                    menu.setMtreeModifiedBy(loginId);
                    menu.setMtreeModifiedOn(now);
                    menuRepo.save(menu);
                }
                SysmRolepermissionDtl p = new SysmRolepermissionDtl();
                p.setRlpmRoleIdRol(roleId);
                p.setRlpmMenuIdMtree(menuId);
                p.setRlpmCanView(bool(dto.canView()));
                p.setRlpmCanCreate(bool(dto.canCreate()));
                p.setRlpmCanEdit(bool(dto.canEdit()));
                p.setRlpmCanDelete(bool(dto.canDelete()));
                p.setRlpmCanApprove(bool(dto.canApprove()));
                p.setRlpmCanReject(bool(dto.canReject()));
                p.setRlpmCanPrint(bool(dto.canPrint()));
                p.setRlpmCanExport(bool(dto.canExport()));
                rolePermRepo.save(p);
            }
        }
        return MessageResponse.of("Permissions updated successfully");
    }

    private SysmRolesMst findRole(Integer id) {
        return roleRepo.findById(id).orElseThrow(() -> ApiException.notFound("Role not found"));
    }

    private void applyRole(SysmRolesMst e, RoleRequest req) {
        e.setRolRoleCode(req.roleCode());
        e.setRolRoleName(req.roleName());
        if (req.roleLevel() != null) e.setRolRoleLevel(req.roleLevel());
        e.setRolDesc(req.desc());
        e.setRolIsSystemRole(req.isSystemRole() != null && req.isSystemRole());
        e.setRolIsactive(req.isActive() == null || req.isActive());
    }

    private RoleDto toRoleDto(SysmRolesMst e, String message) {
        return new RoleDto(e.getRolRoleId(), e.getRolRoleCode(), e.getRolRoleName(), e.getRolRoleLevel(), e.getRolDesc(),
                e.getRolIsSystemRole(), e.getRolIsactive(), e.getRolCreatedBy(), e.getRolCreatedOn(),
                e.getRolModifiedBy(), e.getRolModifiedOn(), message);
    }

    // ---- Employees ----
    @Transactional(readOnly = true)
    public PageResponse<EmployeeDto> listEmployees(int page, int pageSize, String search, Boolean isActive) {
        Specification<HrcEmployeeMst> spec = SpecUtils.combine(
                SpecUtils.activeEquals("empIsactive", isActive),
                SpecUtils.searchContains(search, "empEmployeeCode", "empFirstName", "empLastName", "empEmail"));
        Page<HrcEmployeeMst> result = employeeRepo.findAll(spec, PageRequest.of(Math.max(page - 1, 0), pageSize));
        return PageResponse.of(page, pageSize, result.getTotalElements(),
                result.getContent().stream().map(e -> toEmpDto(e, null)).toList());
    }

    @Transactional(readOnly = true)
    public EmployeeDto getEmployee(Integer id) {
        return toEmpDto(findEmployee(id), null);
    }

    @Transactional(readOnly = true)
    public List<SubordinateDto> subordinates(Integer employeeId) {
        findEmployee(employeeId);
        return employeeRepo.findByEmpReportingToEmpIdEmp(employeeId).stream()
                .map(e -> new SubordinateDto(e.getEmpEmployeeId(), e.getEmpEmployeeCode(), e.getEmpFirstName(), e.getEmpDesignation()))
                .toList();
    }

    @Transactional
    public EmployeeDto createEmployee(EmployeeRequest req) {
        require(req.employeeCode(), "employeeCode");
        require(req.firstName(), "firstName");
        require(req.email(), "email");
        if (req.roleId() == null) throw ApiException.badRequest("roleId is required");
        findRole(req.roleId());
        if (employeeRepo.existsByEmpEmployeeCodeIgnoreCase(req.employeeCode())) {
            throw ApiException.conflict("Employee code already exists");
        }
        if (employeeRepo.existsByEmpEmailIgnoreCase(req.email())) {
            throw ApiException.conflict("This email is already used by another employee");
        }
        HrcEmployeeMst e = new HrcEmployeeMst();
        applyEmp(e, req);
        e.setEmpCreatedBy(SecurityUtils.requireLoginId());
        e.setEmpCreatedOn(LocalDateTime.now());
        e = employeeRepo.save(e);

        String message = "Employee created successfully";
        if (Boolean.TRUE.equals(req.createLogin())) {
            provisionLogin(e, req);
            message = "Employee created successfully. User login was created automatically.";
        }
        return toEmpDto(e, message);
    }

    @Transactional
    public EmployeeDto updateEmployee(Integer id, EmployeeRequest req) {
        HrcEmployeeMst e = findEmployee(id);
        if (req.employeeCode() != null && !req.employeeCode().equalsIgnoreCase(e.getEmpEmployeeCode())
                && employeeRepo.existsByEmpEmployeeCodeIgnoreCase(req.employeeCode())) {
            throw ApiException.conflict("Employee code already exists");
        }
        if (req.email() != null && !req.email().equalsIgnoreCase(e.getEmpEmail())
                && employeeRepo.existsByEmpEmailIgnoreCase(req.email())) {
            throw ApiException.conflict("This email is already used by another employee");
        }
        if (req.roleId() != null) findRole(req.roleId());
        applyEmp(e, req);
        e.setEmpModifiedBy(SecurityUtils.requireLoginId());
        e.setEmpModifiedOn(LocalDateTime.now());
        e = employeeRepo.save(e);

        String message = "Employee updated successfully";
        if (Boolean.TRUE.equals(req.createLogin()) && !userRepo.existsByUsrEmployeeIdEmp(e.getEmpEmployeeId())) {
            provisionLogin(e, req);
            message = "Employee updated successfully. User login was created automatically.";
        }
        return toEmpDto(e, message);
    }

    @Transactional
    public MessageResponse deleteEmployee(Integer id) {
        HrcEmployeeMst e = findEmployee(id);
        e.setEmpIsactive(false);
        e.setEmpModifiedBy(SecurityUtils.requireLoginId());
        e.setEmpModifiedOn(LocalDateTime.now());
        employeeRepo.save(e);
        return MessageResponse.of("Employee deactivated successfully");
    }

    private HrcEmployeeMst findEmployee(Integer id) {
        return employeeRepo.findById(id).orElseThrow(() -> ApiException.notFound("Employee not found"));
    }

    private void applyEmp(HrcEmployeeMst e, EmployeeRequest req) {
        if (req.employeeCode() != null) e.setEmpEmployeeCode(req.employeeCode().trim().toUpperCase());
        if (req.firstName() != null) e.setEmpFirstName(req.firstName().trim());
        e.setEmpLastName(blankToNull(req.lastName()));
        e.setEmpGender(normalizeGender(req.gender()));
        e.setEmpDob(req.dob());
        e.setEmpJoiningDate(req.joiningDate());
        e.setEmpEmploymentType(blankToNull(req.employmentType()));
        if (req.email() != null) e.setEmpEmail(req.email().trim());
        e.setEmpPhone(blankToNull(req.phone()));
        e.setEmpAltPhone(blankToNull(req.altPhone()));
        e.setEmpDesignation(blankToNull(req.designation()));
        e.setEmpDepartment(blankToNull(req.department()));
        if (req.roleId() != null) e.setEmpRoleIdRol(req.roleId());
        e.setEmpBaseLocationIdLoc(req.baseLocationId());
        e.setEmpReportingToEmpIdEmp(req.reportingToEmpId());
        e.setEmpIsactive(req.isActive() == null || req.isActive());
    }

    private void provisionLogin(HrcEmployeeMst emp, EmployeeRequest req) {
        require(req.password(), "password");
        if (req.confirmPassword() == null || !req.confirmPassword().equals(req.password())) {
            throw ApiException.badRequest("Password and Confirm Password do not match");
        }
        if (req.password().length() < 8) {
            throw ApiException.badRequest("Password must be at least 8 characters");
        }
        String loginId = req.loginId();
        if (loginId == null || loginId.isBlank()) {
            String first = emp.getEmpFirstName() == null ? "" : emp.getEmpFirstName().trim().toLowerCase();
            String last = emp.getEmpLastName() == null ? "" : emp.getEmpLastName().trim().toLowerCase();
            loginId = (first + (last.isEmpty() ? "" : "." + last)).replaceAll("\\s+", "");
        } else {
            loginId = loginId.trim().toLowerCase();
        }
        if (loginId.isBlank()) {
            throw ApiException.badRequest("loginId is required to create a user login");
        }
        if (userRepo.existsByUsrLoginIdIgnoreCase(loginId)) {
            throw ApiException.conflict("Login ID already exists");
        }
        Integer entityId = req.entityId();
        if (entityId == null) {
            entityId = entityRepo.findAll().stream()
                    .filter(ent -> Boolean.TRUE.equals(ent.getEntIsactive()))
                    .map(OrgEntityMst::getEntEntityId)
                    .findFirst()
                    .orElseThrow(() -> ApiException.badRequest("entityId is required to create a user login (no active organization found)"));
        }

        SysmUserloginMst user = new SysmUserloginMst();
        user.setUsrEmployeeIdEmp(emp.getEmpEmployeeId());
        user.setUsrLoginId(loginId);
        user.setUsrPasswordHash(passwordEncoder.encode(req.password()));
        user.setUsrRoleIdRol(emp.getEmpRoleIdRol());
        user.setUsrAccountStatus("Active");
        user.setUsrEntityIdEnt(entityId);
        user.setUsrBuAccessScope("ALL");
        user.setUsrLocationIdLoc(emp.getEmpBaseLocationIdLoc());
        user.setUsrForcePasswordReset(false);
        user.setUsrIsactive(true);
        user.setUsrFailedAttempts(0);
        user.setUsrCreatedBy(SecurityUtils.requireLoginId());
        user.setUsrCreatedOn(LocalDateTime.now());
        userRepo.save(user);
    }

    private EmployeeDto toEmpDto(HrcEmployeeMst e, String message) {
        boolean hasLogin = userRepo.existsByUsrEmployeeIdEmp(e.getEmpEmployeeId());
        return new EmployeeDto(
                e.getEmpEmployeeId(), e.getEmpEmployeeCode(), e.getEmpFirstName(), e.getEmpLastName(),
                e.getEmpGender(), e.getEmpDob(), e.getEmpJoiningDate(), e.getEmpEmploymentType(),
                e.getEmpEmail(), e.getEmpPhone(), e.getEmpAltPhone(), e.getEmpDesignation(), e.getEmpDepartment(),
                e.getEmpRoleIdRol(), e.getEmpBaseLocationIdLoc(), e.getEmpReportingToEmpIdEmp(), e.getEmpIsactive(),
                hasLogin, e.getEmpCreatedBy(), e.getEmpCreatedOn(), e.getEmpModifiedBy(), e.getEmpModifiedOn(), message);
    }

    private static String blankToNull(String v) {
        if (v == null) return null;
        String t = v.trim();
        return t.isEmpty() ? null : t;
    }

    private static String normalizeGender(String gender) {
        if (gender == null || gender.isBlank()) return null;
        String g = gender.trim();
        if (g.length() == 1) return g.toUpperCase();
        return switch (g.toLowerCase()) {
            case "male" -> "M";
            case "female" -> "F";
            case "other" -> "O";
            default -> g.substring(0, 1).toUpperCase();
        };
    }

    // ---- Users ----
    @Transactional(readOnly = true)
    public PageResponse<UserDto> listUsers(int page, int pageSize, String search, Boolean isActive) {
        Specification<SysmUserloginMst> spec = SpecUtils.combine(
                SpecUtils.activeEquals("usrIsactive", isActive),
                SpecUtils.searchContains(search, "usrLoginId"));
        Page<SysmUserloginMst> result = userRepo.findAll(spec, PageRequest.of(Math.max(page - 1, 0), pageSize));
        return PageResponse.of(page, pageSize, result.getTotalElements(),
                result.getContent().stream().map(e -> toUserDto(e, null)).toList());
    }

    @Transactional(readOnly = true)
    public UserDto getUser(Integer id) {
        return toUserDto(findUser(id), null);
    }

    @Transactional
    public UserDto createUser(UserRequest req) {
        if (req.employeeId() == null) throw ApiException.badRequest("employeeId is required");
        require(req.loginId(), "loginId");
        require(req.password(), "password");
        if (req.roleId() == null) throw ApiException.badRequest("roleId is required");
        if (req.entityId() == null) throw ApiException.badRequest("entityId is required");
        if (req.password().length() < 8) {
            throw ApiException.badRequest("Password must be at least 8 characters");
        }
        HrcEmployeeMst emp = findEmployee(req.employeeId());
        if (userRepo.existsByUsrEmployeeIdEmp(emp.getEmpEmployeeId())) {
            throw ApiException.conflict("A login already exists for this employee");
        }
        String loginId = req.loginId().trim().toLowerCase();
        if (userRepo.existsByUsrLoginIdIgnoreCase(loginId)) {
            throw ApiException.conflict("Login ID already exists");
        }
        findRole(req.roleId());

        SysmUserloginMst e = new SysmUserloginMst();
        e.setUsrEmployeeIdEmp(emp.getEmpEmployeeId());
        e.setUsrLoginId(loginId);
        e.setUsrPasswordHash(passwordEncoder.encode(req.password()));
        e.setUsrRoleIdRol(req.roleId());
        e.setUsrAccountStatus(req.accountStatus() == null || req.accountStatus().isBlank() ? "Active" : req.accountStatus());
        e.setUsrEntityIdEnt(req.entityId());
        e.setUsrBuAccessScope(req.buAccessScope() == null || req.buAccessScope().isBlank() ? "ALL" : req.buAccessScope());
        e.setUsrLocationIdLoc(req.locationId());
        e.setUsrLocationAccessScope("ALL");
        e.setUsrForcePasswordReset(Boolean.TRUE.equals(req.forcePasswordReset()));
        e.setUsrIsactive(req.isActive() == null || req.isActive());
        e.setUsrFailedAttempts(0);
        e.setUsrCreatedBy(SecurityUtils.requireLoginId());
        e.setUsrCreatedOn(LocalDateTime.now());
        return toUserDto(userRepo.save(e), "User access mapping created successfully");
    }

    @Transactional
    public UserDto updateUser(Integer id, UserRequest req) {
        SysmUserloginMst e = findUser(id);
        if (req.loginId() != null && !req.loginId().equalsIgnoreCase(e.getUsrLoginId())
                && userRepo.existsByUsrLoginIdIgnoreCase(req.loginId())) {
            throw ApiException.conflict("Login ID already exists");
        }
        if (req.employeeId() != null) findEmployee(req.employeeId());
        if (req.roleId() != null) findRole(req.roleId());
        applyUser(e, req);
        if (req.password() != null && !req.password().isBlank()) {
            if (req.password().length() < 8) {
                throw ApiException.badRequest("Password must be at least 8 characters");
            }
            e.setUsrPasswordHash(passwordEncoder.encode(req.password()));
            e.setUsrForcePasswordReset(false);
            e.setUsrFailedAttempts(0);
        }
        e.setUsrModifiedBy(SecurityUtils.requireLoginId());
        e.setUsrModifiedOn(LocalDateTime.now());
        return toUserDto(userRepo.save(e), "User updated successfully");
    }

    @Transactional
    public MessageResponse deleteUser(Integer id) {
        SysmUserloginMst e = findUser(id);
        e.setUsrIsactive(false);
        e.setUsrAccountStatus("Disabled");
        e.setUsrModifiedBy(SecurityUtils.requireLoginId());
        e.setUsrModifiedOn(LocalDateTime.now());
        userRepo.save(e);
        return MessageResponse.of("User deactivated successfully");
    }

    @Transactional
    public MessageResponse resetPassword(Integer userId) {
        SysmUserloginMst e = findUser(userId);
        String temp = "Temp@" + UUID.randomUUID().toString().substring(0, 8);
        e.setUsrPasswordHash(passwordEncoder.encode(temp));
        e.setUsrForcePasswordReset(true);
        e.setUsrFailedAttempts(0);
        e.setUsrModifiedBy(SecurityUtils.requireLoginId());
        e.setUsrModifiedOn(LocalDateTime.now());
        userRepo.save(e);
        return MessageResponse.of("Password reset successfully");
    }

    @Transactional
    public LockStatusResponse lockStatus(Integer userId, LockStatusRequest req) {
        SysmUserloginMst e = findUser(userId);
        if (req == null || req.action() == null) throw ApiException.badRequest("action is required");
        String action = req.action().trim().toLowerCase();
        if ("lock".equals(action)) {
            e.setUsrAccountStatus("Locked");
        } else if ("unlock".equals(action)) {
            e.setUsrAccountStatus("Active");
            e.setUsrFailedAttempts(0);
        } else {
            throw ApiException.badRequest("action must be lock or unlock");
        }
        e.setUsrModifiedBy(SecurityUtils.requireLoginId());
        e.setUsrModifiedOn(LocalDateTime.now());
        userRepo.save(e);
        return new LockStatusResponse(e.getUsrUserId(), e.getUsrAccountStatus(), "Lock status updated successfully");
    }

    @Transactional(readOnly = true)
    public OuAccessDto getOuAccess(Integer userId) {
        SysmUserloginMst e = findUser(userId);
        List<Integer> buIds = buMappingRepo.findByUboaUserIdUsr(userId).stream()
                .map(SysmUserBuMappingDtl::getUboaBuIdBu).toList();
        List<Integer> locationIds = locationMappingRepo.findByUlocUserIdUsr(userId).stream()
                .map(SysmUserLocationMappingDtl::getUlocLocationIdLoc).toList();
        String locScope = e.getUsrLocationAccessScope() == null || e.getUsrLocationAccessScope().isBlank()
                ? "ALL" : e.getUsrLocationAccessScope();
        return new OuAccessDto(userId, e.getUsrBuAccessScope(), buIds, locScope, locationIds);
    }

    @Transactional
    public OuAccessDto putOuAccess(Integer userId, OuAccessRequest req) {
        SysmUserloginMst e = findUser(userId);
        // A scoped administrator must not be able to hand out access they do not hold themselves.
        if (req.buIds() != null) req.buIds().forEach(accessScope::requireBuAllowed);
        if (req.locationIds() != null) req.locationIds().forEach(accessScope::requireLocationAllowed);
        if (req.buAccessScope() != null) {
            e.setUsrBuAccessScope(req.buAccessScope());
        }
        if (req.locationAccessScope() != null && !req.locationAccessScope().isBlank()) {
            e.setUsrLocationAccessScope(req.locationAccessScope());
        }
        // Keep default location as first selected location when SELECTED
        if ("SELECTED".equalsIgnoreCase(e.getUsrLocationAccessScope())
                && req.locationIds() != null && !req.locationIds().isEmpty()) {
            Integer current = e.getUsrLocationIdLoc();
            if (current == null || !req.locationIds().contains(current)) {
                e.setUsrLocationIdLoc(req.locationIds().get(0));
            }
        }
        e.setUsrModifiedBy(SecurityUtils.requireLoginId());
        e.setUsrModifiedOn(LocalDateTime.now());
        userRepo.save(e);

        // Flush each delete before re-inserting: Hibernate runs inserts ahead of deletes,
        // which would clash with the rows being replaced.
        buMappingRepo.deleteByUboaUserIdUsr(userId);
        buMappingRepo.flush();
        if (req.buIds() != null) {
            for (Integer buId : req.buIds().stream().distinct().toList()) {
                SysmUserBuMappingDtl m = new SysmUserBuMappingDtl();
                m.setUboaUserIdUsr(userId);
                m.setUboaBuIdBu(buId);
                buMappingRepo.save(m);
            }
        }

        locationMappingRepo.deleteByUlocUserIdUsr(userId);
        locationMappingRepo.flush();
        if (req.locationIds() != null) {
            for (Integer locId : req.locationIds().stream().distinct().toList()) {
                SysmUserLocationMappingDtl m = new SysmUserLocationMappingDtl();
                m.setUlocUserIdUsr(userId);
                m.setUlocLocationIdLoc(locId);
                locationMappingRepo.save(m);
            }
        }

        List<Integer> buIds = buMappingRepo.findByUboaUserIdUsr(userId).stream()
                .map(SysmUserBuMappingDtl::getUboaBuIdBu).toList();
        List<Integer> locationIds = locationMappingRepo.findByUlocUserIdUsr(userId).stream()
                .map(SysmUserLocationMappingDtl::getUlocLocationIdLoc).toList();
        String locScope = e.getUsrLocationAccessScope() == null || e.getUsrLocationAccessScope().isBlank()
                ? "ALL" : e.getUsrLocationAccessScope();
        return new OuAccessDto(userId, e.getUsrBuAccessScope(), buIds, locScope, locationIds);
    }

    private SysmUserloginMst findUser(Integer id) {
        return userRepo.findById(id).orElseThrow(() -> ApiException.notFound("User not found"));
    }

    private void applyUser(SysmUserloginMst e, UserRequest req) {
        if (req.employeeId() != null) e.setUsrEmployeeIdEmp(req.employeeId());
        if (req.loginId() != null) e.setUsrLoginId(req.loginId());
        if (req.roleId() != null) e.setUsrRoleIdRol(req.roleId());
        e.setUsrAccountStatus(req.accountStatus() == null ? "Active" : req.accountStatus());
        if (req.entityId() != null) e.setUsrEntityIdEnt(req.entityId());
        e.setUsrBuAccessScope(req.buAccessScope() == null ? "ALL" : req.buAccessScope());
        e.setUsrLocationIdLoc(req.locationId());
        if (req.forcePasswordReset() != null) e.setUsrForcePasswordReset(req.forcePasswordReset());
        e.setUsrIsactive(req.isActive() == null || req.isActive());
    }

    private UserDto toUserDto(SysmUserloginMst e, String message) {
        List<Integer> buIds = buMappingRepo.findByUboaUserIdUsr(e.getUsrUserId()).stream()
                .map(SysmUserBuMappingDtl::getUboaBuIdBu).toList();
        List<Integer> locationIds = locationMappingRepo.findByUlocUserIdUsr(e.getUsrUserId()).stream()
                .map(SysmUserLocationMappingDtl::getUlocLocationIdLoc).toList();
        String locScope = e.getUsrLocationAccessScope() == null || e.getUsrLocationAccessScope().isBlank()
                ? "ALL" : e.getUsrLocationAccessScope();
        return new UserDto(e.getUsrUserId(), e.getUsrEmployeeIdEmp(), e.getUsrLoginId(), e.getUsrRoleIdRol(),
                e.getUsrAccountStatus(), e.getUsrEntityIdEnt(), e.getUsrBuAccessScope(), e.getUsrLocationIdLoc(),
                buIds, locScope, locationIds, e.getUsrForcePasswordReset(), e.getUsrIsactive(),
                e.getUsrCreatedBy(), e.getUsrCreatedOn(), e.getUsrModifiedBy(), e.getUsrModifiedOn(), message);
    }

    // ---- Access Exceptions ----
    @Transactional(readOnly = true)
    public PageResponse<AccessExceptionDto> listExceptions(int page, int pageSize, String search, Boolean isActive, Integer employeeId) {
        Specification<SysmUseraccessExceptionDtl> spec = SpecUtils.combine(
                SpecUtils.activeEquals("uexcIsactive", isActive),
                SpecUtils.searchContains(search, "uexcMenuCodeMtree", "uexcReason"),
                SpecUtils.eq("uexcEmployeeIdEmp", employeeId));
        Page<SysmUseraccessExceptionDtl> result = exceptionRepo.findAll(spec, PageRequest.of(Math.max(page - 1, 0), pageSize));
        return PageResponse.of(page, pageSize, result.getTotalElements(),
                result.getContent().stream().map(e -> toExDto(e, null)).toList());
    }

    @Transactional(readOnly = true)
    public AccessExceptionDto getException(Integer id) {
        return toExDto(findException(id), null);
    }

    @Transactional
    public AccessExceptionDto createException(AccessExceptionRequest req) {
        if (req.employeeId() == null) throw ApiException.badRequest("employeeId is required");
        require(req.exceptionType(), "exceptionType");
        require(req.menuCode(), "menuCode");
        require(req.reason(), "reason");
        findEmployee(req.employeeId());
        validateException(req.employeeId(), req.menuCode(), req.exceptionType(),
                req.validFrom(), req.validUntil(), null);
        SysmUseraccessExceptionDtl e = new SysmUseraccessExceptionDtl();
        applyEx(e, req);
        e.setUexcCreatedBy(SecurityUtils.requireLoginId());
        e.setUexcCreatedOn(LocalDateTime.now());
        return toExDto(exceptionRepo.save(e), "Access exception created successfully");
    }

    @Transactional
    public AccessExceptionDto updateException(Integer id, AccessExceptionRequest req) {
        SysmUseraccessExceptionDtl e = findException(id);
        if (req.employeeId() != null) findEmployee(req.employeeId());
        validateException(
                req.employeeId() != null ? req.employeeId() : e.getUexcEmployeeIdEmp(),
                req.menuCode() != null ? req.menuCode() : e.getUexcMenuCodeMtree(),
                req.exceptionType() != null ? req.exceptionType() : e.getUexcExceptionType(),
                req.validFrom(), req.validUntil(), id);
        applyEx(e, req);
        e.setUexcModifiedBy(SecurityUtils.requireLoginId());
        e.setUexcModifiedOn(LocalDateTime.now());
        return toExDto(exceptionRepo.save(e), "Access exception updated successfully");
    }

    @Transactional
    public MessageResponse deleteException(Integer id) {
        SysmUseraccessExceptionDtl e = findException(id);
        e.setUexcIsactive(false);
        e.setUexcModifiedBy(SecurityUtils.requireLoginId());
        e.setUexcModifiedOn(LocalDateTime.now());
        exceptionRepo.save(e);
        return MessageResponse.of("Access exception deactivated successfully");
    }

    private SysmUseraccessExceptionDtl findException(Integer id) {
        return exceptionRepo.findById(id).orElseThrow(() -> ApiException.notFound("Access exception not found"));
    }

    private void validateException(Integer employeeId, String menuCode, String exceptionType,
                                   LocalDate validFrom, LocalDate validUntil, Integer selfId) {
        if (menuCode != null && !menuCode.isBlank()
                && menuRepo.findByMtreeMenuCodeIgnoreCase(menuCode).isEmpty()) {
            throw ApiException.badRequest("Unknown menu code: " + menuCode);
        }
        if (validFrom != null && validUntil != null && validUntil.isBefore(validFrom)) {
            throw ApiException.badRequest("Valid Until must be on or after Valid From");
        }
        if (employeeId == null || menuCode == null || exceptionType == null) return;
        boolean clash = selfId == null
                ? exceptionRepo.existsByUexcEmployeeIdEmpAndUexcMenuCodeMtreeIgnoreCaseAndUexcExceptionTypeIgnoreCase(
                        employeeId, menuCode, exceptionType)
                : exceptionRepo.existsByUexcEmployeeIdEmpAndUexcMenuCodeMtreeIgnoreCaseAndUexcExceptionTypeIgnoreCaseAndUexcExceptionIdNot(
                        employeeId, menuCode, exceptionType, selfId);
        if (clash) {
            throw ApiException.conflict(
                    "A \"" + exceptionType + "\" exception on " + menuCode + " already exists for this employee");
        }
    }

    private void applyEx(SysmUseraccessExceptionDtl e, AccessExceptionRequest req) {
        if (req.employeeId() != null) e.setUexcEmployeeIdEmp(req.employeeId());
        if (req.exceptionType() != null) e.setUexcExceptionType(req.exceptionType());
        if (req.menuCode() != null) e.setUexcMenuCodeMtree(req.menuCode());
        if (req.reason() != null) e.setUexcReason(req.reason());
        e.setUexcValidFrom(req.validFrom());
        e.setUexcValidUntil(req.validUntil());
        e.setUexcIsactive(req.isActive() == null || req.isActive());
    }

    private AccessExceptionDto toExDto(SysmUseraccessExceptionDtl e, String message) {
        return new AccessExceptionDto(e.getUexcExceptionId(), e.getUexcEmployeeIdEmp(), e.getUexcExceptionType(),
                e.getUexcMenuCodeMtree(), e.getUexcReason(), e.getUexcValidFrom(), e.getUexcValidUntil(),
                e.getUexcIsactive(), e.getUexcCreatedBy(), e.getUexcCreatedOn(), e.getUexcModifiedBy(),
                e.getUexcModifiedOn(), message);
    }

    private static boolean bool(Boolean b) {
        return Boolean.TRUE.equals(b);
    }

    private static void require(String v, String field) {
        if (v == null || v.isBlank()) throw ApiException.badRequest(field + " is required");
    }
}
