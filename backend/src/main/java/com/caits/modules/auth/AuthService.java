package com.caits.modules.auth;

import com.caits.common.ApiException;
import com.caits.common.MessageResponse;
import com.caits.domain.entity.*;
import com.caits.domain.repository.*;
import com.caits.modules.auth.AuthDtos.*;
import com.caits.security.AccessScopeService;
import com.caits.security.CurrentUser;
import com.caits.security.JwtService;
import com.caits.security.SecurityUtils;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AuthService {

    private static final int MAX_FAILED = 5;
    private static final String GENERIC_INVALID = "Invalid login credentials";

    private final SysmUserloginMstRepository userRepo;
    private final HrcEmployeeMstRepository employeeRepo;
    private final SysmRolesMstRepository roleRepo;
    private final SysmMenutreeMstRepository menuRepo;
    private final SysmRolepermissionDtlRepository rolePermRepo;
    private final SysmUseraccessExceptionDtlRepository exceptionRepo;
    private final SysmUserFavouriteMenuDtlRepository favouriteRepo;
    private final OrgLocationMstRepository locationRepo;
    private final HrcDepartmentMstRepository departmentRepo;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AccessScopeService accessScope;

    public AuthService(
            SysmUserloginMstRepository userRepo,
            HrcEmployeeMstRepository employeeRepo,
            SysmRolesMstRepository roleRepo,
            SysmMenutreeMstRepository menuRepo,
            SysmRolepermissionDtlRepository rolePermRepo,
            SysmUseraccessExceptionDtlRepository exceptionRepo,
            SysmUserFavouriteMenuDtlRepository favouriteRepo,
            OrgLocationMstRepository locationRepo,
            HrcDepartmentMstRepository departmentRepo,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            AccessScopeService accessScope) {
        this.userRepo = userRepo;
        this.employeeRepo = employeeRepo;
        this.roleRepo = roleRepo;
        this.menuRepo = menuRepo;
        this.rolePermRepo = rolePermRepo;
        this.exceptionRepo = exceptionRepo;
        this.favouriteRepo = favouriteRepo;
        this.locationRepo = locationRepo;
        this.departmentRepo = departmentRepo;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.accessScope = accessScope;
    }

    @Transactional
    public LoginResponse login(LoginRequest req) {
        if (req == null || req.loginId() == null || req.loginId().isBlank() || req.password() == null) {
            throw ApiException.unauthorized(GENERIC_INVALID);
        }
        Optional<SysmUserloginMst> opt = userRepo.findByUsrLoginIdIgnoreCase(req.loginId().trim());
        if (opt.isEmpty()) {
            throw ApiException.unauthorized(GENERIC_INVALID);
        }
        SysmUserloginMst user = opt.get();

        if ("Locked".equalsIgnoreCase(nullSafe(user.getUsrAccountStatus()))
                || (user.getUsrFailedAttempts() != null && user.getUsrFailedAttempts() >= MAX_FAILED)) {
            user.setUsrAccountStatus("Locked");
            userRepo.save(user);
            throw ApiException.locked("Account is locked due to too many failed login attempts");
        }
        if ("Disabled".equalsIgnoreCase(nullSafe(user.getUsrAccountStatus()))
                || Boolean.FALSE.equals(user.getUsrIsactive())) {
            throw ApiException.forbidden("Account is disabled");
        }

        if (!passwordEncoder.matches(req.password(), user.getUsrPasswordHash())) {
            int fails = user.getUsrFailedAttempts() == null ? 0 : user.getUsrFailedAttempts();
            fails++;
            user.setUsrFailedAttempts(fails);
            if (fails >= MAX_FAILED) {
                user.setUsrAccountStatus("Locked");
                userRepo.save(user);
                throw ApiException.locked("Account is locked due to too many failed login attempts");
            }
            userRepo.save(user);
            throw ApiException.unauthorized(GENERIC_INVALID);
        }

        user.setUsrFailedAttempts(0);
        user.setUsrLastLoginOn(LocalDateTime.now());
        userRepo.save(user);

        SysmRolesMst role = roleRepo.findById(user.getUsrRoleIdRol())
                .orElseThrow(() -> ApiException.unauthorized(GENERIC_INVALID));
        HrcEmployeeMst emp = employeeRepo.findById(user.getUsrEmployeeIdEmp()).orElse(null);
        String employeeName = emp == null ? user.getUsrLoginId()
                : (emp.getEmpFirstName() + (emp.getEmpLastName() == null ? "" : " " + emp.getEmpLastName())).trim();

        String token = jwtService.createToken(user.getUsrLoginId(), user.getUsrUserId(), role.getRolRoleCode());
        LoginUserDto userDto = new LoginUserDto(
                user.getUsrUserId(), employeeName, role.getRolRoleCode(),
                user.getUsrEntityIdEnt(), user.getUsrBuAccessScope(),
                user.getUsrLocationAccessScope(), user.getUsrLocationIdLoc());

        Boolean mustChange = Boolean.TRUE.equals(user.getUsrForcePasswordReset()) ? true : null;
        return new LoginResponse(token, userDto, jwtService.getExpirationSeconds(), mustChange);
    }

    /**
     * Issues a fresh JWT for the currently authenticated user (sliding session).
     * Rejects disabled / locked accounts so a long-lived tab cannot keep extending access.
     */
    @Transactional(readOnly = true)
    public LoginResponse refresh() {
        CurrentUser cu = SecurityUtils.requireCurrentUser();
        SysmUserloginMst user = userRepo.findById(cu.userId())
                .orElseThrow(() -> ApiException.unauthorized("Session expired"));
        if (Boolean.FALSE.equals(user.getUsrIsactive()) || "Disabled".equalsIgnoreCase(user.getUsrAccountStatus())) {
            throw ApiException.forbidden("Account is disabled");
        }
        if ("Locked".equalsIgnoreCase(user.getUsrAccountStatus())) {
            throw ApiException.locked("Account is locked");
        }
        SysmRolesMst role = roleRepo.findById(user.getUsrRoleIdRol())
                .orElseThrow(() -> ApiException.unauthorized("Session expired"));
        HrcEmployeeMst emp = employeeRepo.findById(user.getUsrEmployeeIdEmp()).orElse(null);
        String employeeName = emp == null ? user.getUsrLoginId()
                : (emp.getEmpFirstName() + (emp.getEmpLastName() == null ? "" : " " + emp.getEmpLastName())).trim();
        String token = jwtService.createToken(user.getUsrLoginId(), user.getUsrUserId(), role.getRolRoleCode());
        LoginUserDto userDto = new LoginUserDto(
                user.getUsrUserId(), employeeName, role.getRolRoleCode(),
                user.getUsrEntityIdEnt(), user.getUsrBuAccessScope(),
                user.getUsrLocationAccessScope(), user.getUsrLocationIdLoc());
        Boolean mustChange = Boolean.TRUE.equals(user.getUsrForcePasswordReset()) ? true : null;
        return new LoginResponse(token, userDto, jwtService.getExpirationSeconds(), mustChange);
    }

    public MessageResponse logout() {
        return MessageResponse.of("Logged out successfully");
    }

    @Transactional(readOnly = true)
    public MeResponse me() {
        AccessScopeService.Scope scope = accessScope.current();
        CurrentUser cu = SecurityUtils.requireCurrentUser();
        SysmUserloginMst user = userRepo.findById(cu.userId())
                .orElseThrow(() -> ApiException.unauthorized("User not found"));
        SysmRolesMst role = roleRepo.findById(user.getUsrRoleIdRol())
                .orElseThrow(() -> ApiException.notFound("Role not found"));
        HrcEmployeeMst emp = employeeRepo.findById(user.getUsrEmployeeIdEmp()).orElse(null);
        String employeeName = emp == null ? user.getUsrLoginId()
                : (emp.getEmpFirstName() + (emp.getEmpLastName() == null ? "" : " " + emp.getEmpLastName())).trim();

        // Exempt roles see everything — report ALL so the UI does not try to filter.
        // Everyone else gets their stored scope and mapped ids.
        List<Integer> allowedBuIds = scope.unrestricted()
                ? List.of()
                : scope.allowedBuIds();
        List<Integer> allowedLocIds = scope.unrestricted()
                ? List.of()
                : scope.allowedLocationIds();

        List<MenuPermissionDto> menus = buildMenuPermissions(user, role);
        return new MeResponse(
                user.getUsrUserId(),
                user.getUsrLoginId(),
                user.getUsrEmployeeIdEmp(),
                employeeName,
                role.getRolRoleCode(),
                scope.unrestricted() ? user.getUsrEntityIdEnt() : scope.entityId(),
                scope.unrestricted() ? "ALL" : scope.buAccessScope(),
                allowedBuIds,
                scope.unrestricted() ? "ALL" : scope.locationAccessScope(),
                allowedLocIds,
                scope.unrestricted() ? user.getUsrLocationIdLoc() : scope.defaultLocationId(),
                menus,
                listFavouriteCodes(user.getUsrUserId()));
    }

    @Transactional(readOnly = true)
    public ProfileResponse profile() {
        CurrentUser cu = SecurityUtils.requireCurrentUser();
        SysmUserloginMst user = userRepo.findById(cu.userId())
                .orElseThrow(() -> ApiException.unauthorized("User not found"));
        SysmRolesMst role = roleRepo.findById(user.getUsrRoleIdRol())
                .orElseThrow(() -> ApiException.notFound("Role not found"));
        HrcEmployeeMst emp = employeeRepo.findById(user.getUsrEmployeeIdEmp())
                .orElseThrow(() -> ApiException.notFound("Employee record not found for this login"));

        String locationName = null;
        if (emp.getEmpBaseLocationIdLoc() != null) {
            locationName = locationRepo.findById(emp.getEmpBaseLocationIdLoc())
                    .map(OrgLocationMst::getLocLocationName)
                    .orElse(null);
        }

        String reportingToName = null;
        if (emp.getEmpReportingToEmpIdEmp() != null) {
            reportingToName = employeeRepo.findById(emp.getEmpReportingToEmpIdEmp())
                    .map(m -> (m.getEmpFirstName()
                            + (m.getEmpLastName() == null ? "" : " " + m.getEmpLastName())).trim())
                    .orElse(null);
        }

        String departmentName = null;
        if (emp.getEmpDepartmentIdDept() != null) {
            departmentName = departmentRepo.findById(emp.getEmpDepartmentIdDept())
                    .map(HrcDepartmentMst::getDeptDepartmentName)
                    .orElse(null);
        }

        return new ProfileResponse(
                user.getUsrUserId(),
                user.getUsrLoginId(),
                role.getRolRoleCode(),
                user.getUsrLastLoginOn(),
                emp.getEmpEmployeeId(),
                emp.getEmpEmployeeCode(),
                emp.getEmpFirstName(),
                emp.getEmpLastName(),
                emp.getEmpGender(),
                emp.getEmpDob(),
                emp.getEmpJoiningDate(),
                emp.getEmpEmploymentType(),
                emp.getEmpDesignation(),
                departmentName,
                emp.getEmpEmail(),
                emp.getEmpPhone(),
                emp.getEmpAltPhone(),
                emp.getEmpBaseLocationIdLoc(),
                locationName,
                emp.getEmpReportingToEmpIdEmp(),
                reportingToName,
                emp.getEmpIsactive());
    }

    @Transactional(readOnly = true)
    public FavouritesResponse getFavourites() {
        CurrentUser cu = SecurityUtils.requireCurrentUser();
        return new FavouritesResponse(listFavouriteCodes(cu.userId()));
    }

    /**
     * Replaces the user's favourite menu list. Only menu codes the user can
     * actually view are kept, and duplicates are dropped while preserving order.
     */
    @Transactional
    public FavouritesResponse saveFavourites(FavouritesRequest req) {
        CurrentUser cu = SecurityUtils.requireCurrentUser();
        SysmUserloginMst user = userRepo.findById(cu.userId())
                .orElseThrow(() -> ApiException.unauthorized("User not found"));
        SysmRolesMst role = roleRepo.findById(user.getUsrRoleIdRol())
                .orElseThrow(() -> ApiException.notFound("Role not found"));

        Set<String> allowed = buildMenuPermissions(user, role).stream()
                .filter(MenuPermissionDto::view)
                .map(MenuPermissionDto::menuCode)
                .collect(Collectors.toCollection(HashSet::new));

        List<String> incoming = req == null || req.menuCodes() == null ? List.of() : req.menuCodes();
        LinkedHashSet<String> cleaned = new LinkedHashSet<>();
        for (String code : incoming) {
            if (code == null || code.isBlank()) continue;
            String trimmed = code.trim();
            if (!allowed.contains(trimmed)) {
                throw ApiException.badRequest("Menu '" + trimmed + "' is not available to pin as a favourite");
            }
            cleaned.add(trimmed);
        }
        if (cleaned.size() > 12) {
            throw ApiException.badRequest("You can pin at most 12 favourite menus");
        }

        favouriteRepo.deleteByUfavUserIdUsr(user.getUsrUserId());
        favouriteRepo.flush();
        int order = 0;
        LocalDateTime now = LocalDateTime.now();
        for (String code : cleaned) {
            SysmUserFavouriteMenuDtl row = new SysmUserFavouriteMenuDtl();
            row.setUfavUserIdUsr(user.getUsrUserId());
            row.setUfavMenuCodeMtree(code);
            row.setUfavSortOrder(order++);
            row.setUfavCreatedOn(now);
            favouriteRepo.save(row);
        }
        return new FavouritesResponse(List.copyOf(cleaned));
    }

    private List<String> listFavouriteCodes(Integer userId) {
        return favouriteRepo.findByUfavUserIdUsrOrderByUfavSortOrderAscUfavFavouriteIdAsc(userId).stream()
                .map(SysmUserFavouriteMenuDtl::getUfavMenuCodeMtree)
                .toList();
    }

    private List<MenuPermissionDto> buildMenuPermissions(SysmUserloginMst user, SysmRolesMst role) {
        Map<Integer, SysmRolepermissionDtl> byMenuId = rolePermRepo.findByRlpmRoleIdRol(role.getRolRoleId()).stream()
                .collect(Collectors.toMap(SysmRolepermissionDtl::getRlpmMenuIdMtree, p -> p, (a, b) -> a));

        LocalDate today = LocalDate.now();
        Set<String> granted = new HashSet<>();
        Set<String> revoked = new HashSet<>();
        for (SysmUseraccessExceptionDtl ex : exceptionRepo.findByUexcEmployeeIdEmp(user.getUsrEmployeeIdEmp())) {
            if (!Boolean.TRUE.equals(ex.getUexcIsactive())) continue;
            if (ex.getUexcValidFrom() != null && today.isBefore(ex.getUexcValidFrom())) continue;
            if (ex.getUexcValidUntil() != null && today.isAfter(ex.getUexcValidUntil())) continue;
            if ("Grant".equalsIgnoreCase(ex.getUexcExceptionType())) {
                granted.add(ex.getUexcMenuCodeMtree());
            } else if ("Revoke".equalsIgnoreCase(ex.getUexcExceptionType())) {
                revoked.add(ex.getUexcMenuCodeMtree());
            }
        }

        List<MenuPermissionDto> result = new ArrayList<>();
        for (SysmMenutreeMst menu : menuRepo.findByMtreeIsactiveTrueOrderByMtreeSortOrderAsc()) {
            String code = menu.getMtreeMenuCode();
            if (revoked.contains(code)) continue;
            SysmRolepermissionDtl perm = byMenuId.get(menu.getMtreeMenuId());
            boolean view = perm != null && Boolean.TRUE.equals(perm.getRlpmCanView());
            boolean create = perm != null && Boolean.TRUE.equals(perm.getRlpmCanCreate());
            boolean edit = perm != null && Boolean.TRUE.equals(perm.getRlpmCanEdit());
            boolean delete = perm != null && Boolean.TRUE.equals(perm.getRlpmCanDelete());
            boolean approve = perm != null && Boolean.TRUE.equals(perm.getRlpmCanApprove());
            boolean reject = perm != null && Boolean.TRUE.equals(perm.getRlpmCanReject());
            boolean print = perm != null && Boolean.TRUE.equals(perm.getRlpmCanPrint());
            boolean export = perm != null && Boolean.TRUE.equals(perm.getRlpmCanExport());
            if (granted.contains(code)) {
                view = true;
            }
            if (view || create || edit || delete || approve || reject || print || export || granted.contains(code)) {
                result.add(new MenuPermissionDto(
                        code, view, create, edit, delete, approve, reject, print, export,
                        menu.getMtreeSortOrder(),
                        menu.getMtreeMenuGroup(),
                        menu.getMtreeGroupSortOrder()));
            }
        }
        return result;
    }

    @Transactional
    public MessageResponse changePassword(ChangePasswordRequest req) {
        if (req == null || req.oldPassword() == null || req.newPassword() == null || req.confirmPassword() == null) {
            throw ApiException.badRequest("All password fields are required");
        }
        if (!Objects.equals(req.newPassword(), req.confirmPassword())) {
            throw ApiException.badRequest("New password and confirm password do not match");
        }
        if (req.newPassword().length() < 8) {
            throw ApiException.badRequest("New password must be at least 8 characters");
        }
        CurrentUser cu = SecurityUtils.requireCurrentUser();
        SysmUserloginMst user = userRepo.findById(cu.userId())
                .orElseThrow(() -> ApiException.notFound("User not found"));
        if (!passwordEncoder.matches(req.oldPassword(), user.getUsrPasswordHash())) {
            throw ApiException.badRequest("Incorrect old password");
        }
        user.setUsrPasswordHash(passwordEncoder.encode(req.newPassword()));
        user.setUsrForcePasswordReset(false);
        user.setUsrModifiedBy(cu.loginId());
        user.setUsrModifiedOn(LocalDateTime.now());
        userRepo.save(user);
        return MessageResponse.of("Password changed successfully");
    }

    public MessageResponse forgotPassword(ForgotPasswordRequest req) {
        return MessageResponse.of("Password reset link sent to registered email");
    }

    private static String nullSafe(String s) {
        return s == null ? "" : s;
    }
}
