package com.caits.modules.auth;

import com.caits.common.ApiException;
import com.caits.common.MessageResponse;
import com.caits.domain.entity.*;
import com.caits.domain.repository.*;
import com.caits.modules.auth.AuthDtos.*;
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
    private final SysmUserBuMappingDtlRepository buMappingRepo;
    private final SysmMenutreeMstRepository menuRepo;
    private final SysmRolepermissionDtlRepository rolePermRepo;
    private final SysmUseraccessExceptionDtlRepository exceptionRepo;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(
            SysmUserloginMstRepository userRepo,
            HrcEmployeeMstRepository employeeRepo,
            SysmRolesMstRepository roleRepo,
            SysmUserBuMappingDtlRepository buMappingRepo,
            SysmMenutreeMstRepository menuRepo,
            SysmRolepermissionDtlRepository rolePermRepo,
            SysmUseraccessExceptionDtlRepository exceptionRepo,
            PasswordEncoder passwordEncoder,
            JwtService jwtService) {
        this.userRepo = userRepo;
        this.employeeRepo = employeeRepo;
        this.roleRepo = roleRepo;
        this.buMappingRepo = buMappingRepo;
        this.menuRepo = menuRepo;
        this.rolePermRepo = rolePermRepo;
        this.exceptionRepo = exceptionRepo;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
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
                user.getUsrEntityIdEnt(), user.getUsrBuAccessScope());

        Boolean mustChange = Boolean.TRUE.equals(user.getUsrForcePasswordReset()) ? true : null;
        return new LoginResponse(token, userDto, jwtService.getExpirationSeconds(), mustChange);
    }

    public MessageResponse logout() {
        return MessageResponse.of("Logged out successfully");
    }

    @Transactional(readOnly = true)
    public MeResponse me() {
        CurrentUser cu = SecurityUtils.requireCurrentUser();
        SysmUserloginMst user = userRepo.findById(cu.userId())
                .orElseThrow(() -> ApiException.unauthorized("User not found"));
        SysmRolesMst role = roleRepo.findById(user.getUsrRoleIdRol())
                .orElseThrow(() -> ApiException.notFound("Role not found"));
        HrcEmployeeMst emp = employeeRepo.findById(user.getUsrEmployeeIdEmp()).orElse(null);
        String employeeName = emp == null ? user.getUsrLoginId()
                : (emp.getEmpFirstName() + (emp.getEmpLastName() == null ? "" : " " + emp.getEmpLastName())).trim();

        List<Integer> allowedBuIds = buMappingRepo.findAll().stream()
                .filter(m -> Objects.equals(m.getUboaUserIdUsr(), user.getUsrUserId()))
                .map(SysmUserBuMappingDtl::getUboaBuIdBu)
                .toList();

        List<MenuPermissionDto> menus = buildMenuPermissions(user, role);
        return new MeResponse(user.getUsrUserId(), employeeName, role.getRolRoleCode(),
                user.getUsrBuAccessScope(), allowedBuIds, menus);
    }

    private List<MenuPermissionDto> buildMenuPermissions(SysmUserloginMst user, SysmRolesMst role) {
        Map<String, SysmRolepermissionDtl> byModule = rolePermRepo.findAll().stream()
                .filter(p -> Objects.equals(p.getRlpmRoleIdRol(), role.getRolRoleId()))
                .collect(Collectors.toMap(SysmRolepermissionDtl::getRlpmModuleName, p -> p, (a, b) -> a));

        LocalDate today = LocalDate.now();
        Set<String> granted = new HashSet<>();
        Set<String> revoked = new HashSet<>();
        for (SysmUseraccessExceptionDtl ex : exceptionRepo.findAll()) {
            if (!Objects.equals(ex.getUexcEmployeeIdEmp(), user.getUsrEmployeeIdEmp())) continue;
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
        for (SysmMenutreeMst menu : menuRepo.findAll()) {
            if (!Boolean.TRUE.equals(menu.getMtreeIsactive())) continue;
            String code = menu.getMtreeMenuCode();
            if (revoked.contains(code)) continue;
            SysmRolepermissionDtl perm = byModule.get(code);
            boolean view = perm != null && Boolean.TRUE.equals(perm.getRlpmCanView());
            boolean create = perm != null && Boolean.TRUE.equals(perm.getRlpmCanCreate());
            boolean approve = perm != null && Boolean.TRUE.equals(perm.getRlpmCanApprove());
            if (granted.contains(code)) {
                view = true;
            }
            if (view || create || approve || granted.contains(code)) {
                result.add(new MenuPermissionDto(code, view, create, approve));
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
