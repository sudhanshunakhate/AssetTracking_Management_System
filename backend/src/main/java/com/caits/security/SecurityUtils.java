package com.caits.security;

import com.caits.common.ApiException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

public final class SecurityUtils {
    private SecurityUtils() {}

    public static CurrentUser requireCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof CurrentUser cu)) {
            throw ApiException.unauthorized("Not authenticated");
        }
        return cu;
    }

    public static String requireLoginId() {
        return requireCurrentUser().loginId();
    }

    public static String loginIdOrSystem() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof CurrentUser cu) {
            return cu.loginId();
        }
        return "system";
    }
}
