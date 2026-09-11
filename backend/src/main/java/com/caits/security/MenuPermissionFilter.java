package com.caits.security;

import com.caits.domain.entity.SysmMenutreeMst;
import com.caits.domain.entity.SysmRolepermissionDtl;
import com.caits.domain.repository.SysmMenutreeMstRepository;
import com.caits.domain.repository.SysmRolepermissionDtlRepository;
import com.caits.domain.repository.SysmRolesMstRepository;
import com.caits.domain.repository.SysmUserloginMstRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Predicate;

/**
 * Server-side menu permission gate.
 * Mutations require the matching CRUD/approve flag; GETs are gated only for
 * sensitive masters and file downloads so shared lookups keep working.
 */
@Component
public class MenuPermissionFilter extends OncePerRequestFilter {

    private static final Map<String, String> MUTATING_PATHS = new LinkedHashMap<>();
    private static final Map<String, String> SENSITIVE_READ_PATHS = new LinkedHashMap<>();
    private static final List<String> TXN_MENU_CODES = List.of(
            "GRN", "GP", "SR", "ISS", "OPN", "TRF", "RTN");

    static {
        // Longer prefixes first where siblings share a stem.
        MUTATING_PATHS.put("/api/v1/gatepass/inward", "GP");
        MUTATING_PATHS.put("/api/v1/gatepass/outward", "GP");
        MUTATING_PATHS.put("/api/v1/gatepass", "GP");
        MUTATING_PATHS.put("/api/v1/requisitions", "SR");
        MUTATING_PATHS.put("/api/v1/material-issues", "ISS");
        MUTATING_PATHS.put("/api/v1/opening-stock", "OPN");
        MUTATING_PATHS.put("/api/v1/transfers", "TRF");
        MUTATING_PATHS.put("/api/v1/returns", "RTN");
        MUTATING_PATHS.put("/api/v1/inspection-approvals", "GRN");
        MUTATING_PATHS.put("/api/v1/grn", "GRN");

        MUTATING_PATHS.put("/api/v1/vendors", "VPM");
        MUTATING_PATHS.put("/api/v1/items", "AIM");
        MUTATING_PATHS.put("/api/v1/employees", "EMP");
        MUTATING_PATHS.put("/api/v1/users", "USR");
        MUTATING_PATHS.put("/api/v1/roles", "ARM");
        MUTATING_PATHS.put("/api/v1/menus", "MNU");
        MUTATING_PATHS.put("/api/v1/entities", "ORG");
        MUTATING_PATHS.put("/api/v1/business-units", "OU");
        MUTATING_PATHS.put("/api/v1/locations", "STR");
        MUTATING_PATHS.put("/api/v1/departments", "EMP");
        MUTATING_PATHS.put("/api/v1/categories", "ICM");
        MUTATING_PATHS.put("/api/v1/subcategories", "ISC");
        MUTATING_PATHS.put("/api/v1/units", "UOM");
        MUTATING_PATHS.put("/api/v1/general-types", "GTY");
        MUTATING_PATHS.put("/api/v1/general-masters", "GNM");
        MUTATING_PATHS.put("/api/v1/access-exceptions", "UAE");
        MUTATING_PATHS.put("/api/v1/files", "GRN");

        SENSITIVE_READ_PATHS.put("/api/v1/vendors", "VPM");
        SENSITIVE_READ_PATHS.put("/api/v1/entities", "ORG");
        SENSITIVE_READ_PATHS.put("/api/v1/employees", "EMP");
        SENSITIVE_READ_PATHS.put("/api/v1/users", "USR");
        SENSITIVE_READ_PATHS.put("/api/v1/files", "GRN");
    }

    private final SysmUserloginMstRepository userRepo;
    private final SysmRolesMstRepository roleRepo;
    private final SysmRolepermissionDtlRepository rolePermRepo;
    private final SysmMenutreeMstRepository menuRepo;
    private final JwtProperties jwtProperties;

    public MenuPermissionFilter(
            SysmUserloginMstRepository userRepo,
            SysmRolesMstRepository roleRepo,
            SysmRolepermissionDtlRepository rolePermRepo,
            SysmMenutreeMstRepository menuRepo,
            JwtProperties jwtProperties) {
        this.userRepo = userRepo;
        this.roleRepo = roleRepo;
        this.rolePermRepo = rolePermRepo;
        this.menuRepo = menuRepo;
        this.jwtProperties = jwtProperties;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        if ("OPTIONS".equalsIgnoreCase(request.getMethod()) || "HEAD".equalsIgnoreCase(request.getMethod())) {
            return true;
        }
        String path = request.getRequestURI();
        if (path == null || !path.startsWith("/api/v1/")) {
            return true;
        }
        if (path.contains("/lookup")) {
            return true;
        }
        String method = request.getMethod();
        if ("GET".equalsIgnoreCase(method)) {
            return resolveMenu(path, SENSITIVE_READ_PATHS) == null;
        }
        return resolveMenu(path, MUTATING_PATHS) == null;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof CurrentUser user)) {
            filterChain.doFilter(request, response);
            return;
        }

        boolean isGet = "GET".equalsIgnoreCase(request.getMethod());
        String path = request.getRequestURI();
        String menuCode = resolveMenu(path, isGet ? SENSITIVE_READ_PATHS : MUTATING_PATHS);
        if (menuCode == null || isExempt(user)) {
            filterChain.doFilter(request, response);
            return;
        }

        Integer roleId = roleRepo.findByRolRoleCodeIgnoreCase(user.roleCode())
                .map(r -> r.getRolRoleId())
                .orElse(null);
        if (roleId == null) {
            forbid(response, "Role not found");
            return;
        }

        List<SysmRolepermissionDtl> perms = rolePermRepo.findByRlpmRoleIdRol(roleId);
        RequiredAction action = resolveAction(request.getMethod(), path);

        if ("GRN".equals(menuCode) && path.startsWith("/api/v1/files")) {
            if (hasTxnPermission(perms, action.predicate())) {
                filterChain.doFilter(request, response);
                return;
            }
            forbid(response, "You do not have permission for this module");
            return;
        }

        Integer menuId = menuRepo.findByMtreeMenuCodeIgnoreCase(menuCode)
                .map(SysmMenutreeMst::getMtreeMenuId)
                .orElse(null);
        if (menuId == null) {
            filterChain.doFilter(request, response);
            return;
        }

        boolean allowed = perms.stream()
                .filter(p -> menuId.equals(p.getRlpmMenuIdMtree()))
                .anyMatch(action.predicate());

        if (!allowed) {
            forbid(response, "You do not have permission for this action");
            return;
        }

        filterChain.doFilter(request, response);
    }

    private boolean hasTxnPermission(List<SysmRolepermissionDtl> perms, Predicate<SysmRolepermissionDtl> flag) {
        for (String code : TXN_MENU_CODES) {
            Integer id = menuRepo.findByMtreeMenuCodeIgnoreCase(code)
                    .map(SysmMenutreeMst::getMtreeMenuId)
                    .orElse(null);
            if (id == null) {
                continue;
            }
            boolean ok = perms.stream()
                    .filter(p -> id.equals(p.getRlpmMenuIdMtree()))
                    .anyMatch(flag);
            if (ok) {
                return true;
            }
        }
        return false;
    }

    private static RequiredAction resolveAction(String method, String path) {
        String lower = path == null ? "" : path.toLowerCase();
        if (lower.endsWith("/approve") || lower.contains("/approve/")) {
            return RequiredAction.APPROVE;
        }
        if (lower.endsWith("/reject") || lower.contains("/reject/")) {
            return RequiredAction.REJECT;
        }
        if (lower.contains("/print")) {
            return RequiredAction.PRINT;
        }
        if ("GET".equalsIgnoreCase(method)) {
            return RequiredAction.VIEW;
        }
        if ("POST".equalsIgnoreCase(method)) {
            return RequiredAction.CREATE;
        }
        if ("PUT".equalsIgnoreCase(method) || "PATCH".equalsIgnoreCase(method)) {
            return RequiredAction.EDIT;
        }
        if ("DELETE".equalsIgnoreCase(method)) {
            return RequiredAction.DELETE;
        }
        return RequiredAction.VIEW;
    }

    private boolean isExempt(CurrentUser user) {
        String exempt = jwtProperties.getLocationScopeExemptRoles();
        if (exempt != null) {
            for (String role : exempt.split(",")) {
                if (role.trim().equalsIgnoreCase(user.roleCode())) {
                    return true;
                }
            }
        }
        return userRepo.findById(user.userId())
                .map(u -> Boolean.TRUE.equals(u.getUsrIsSystemUser()))
                .orElse(false);
    }

    private static String resolveMenu(String path, Map<String, String> map) {
        for (Map.Entry<String, String> e : map.entrySet()) {
            if (path.equals(e.getKey()) || path.startsWith(e.getKey() + "/")) {
                return e.getValue();
            }
        }
        return null;
    }

    private static void forbid(HttpServletResponse response, String message) throws IOException {
        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        String safe = message.replace("\"", "'");
        response.getWriter().write("{\"message\":\"" + safe + "\"}");
    }

    private enum RequiredAction {
        VIEW(p -> Boolean.TRUE.equals(p.getRlpmCanView())),
        CREATE(p -> Boolean.TRUE.equals(p.getRlpmCanCreate())),
        EDIT(p -> Boolean.TRUE.equals(p.getRlpmCanEdit())),
        DELETE(p -> Boolean.TRUE.equals(p.getRlpmCanDelete())),
        APPROVE(p -> Boolean.TRUE.equals(p.getRlpmCanApprove())),
        REJECT(p -> Boolean.TRUE.equals(p.getRlpmCanReject())),
        PRINT(p -> Boolean.TRUE.equals(p.getRlpmCanPrint()) || Boolean.TRUE.equals(p.getRlpmCanView()));

        private final Predicate<SysmRolepermissionDtl> predicate;

        RequiredAction(Predicate<SysmRolepermissionDtl> predicate) {
            this.predicate = predicate;
        }

        Predicate<SysmRolepermissionDtl> predicate() {
            return predicate;
        }
    }
}
