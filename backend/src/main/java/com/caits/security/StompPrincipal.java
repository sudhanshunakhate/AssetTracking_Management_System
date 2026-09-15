package com.caits.security;

import java.security.Principal;

public record StompPrincipal(Integer userId, String loginId, String roleCode) implements Principal {
    @Override
    public String getName() {
        return String.valueOf(userId);
    }
}
