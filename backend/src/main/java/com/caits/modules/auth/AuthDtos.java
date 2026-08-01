package com.caits.modules.auth;

import java.util.List;

public final class AuthDtos {
    private AuthDtos() {}

    public record LoginRequest(String loginId, String password) {}

    public record LoginUserDto(
            Integer userId,
            String employeeName,
            String roleCode,
            Integer entityId,
            String buAccessScope,
            String locationAccessScope,
            Integer defaultLocationId
    ) {}

    public record LoginResponse(String token, LoginUserDto user, long expiresIn, Boolean mustChangePassword) {}

    public record ChangePasswordRequest(String oldPassword, String newPassword, String confirmPassword) {}

    public record ForgotPasswordRequest(String loginId) {}

    public record MenuPermissionDto(
            String menuCode,
            boolean view,
            boolean create,
            boolean edit,
            boolean delete,
            boolean approve,
            boolean reject,
            boolean print,
            boolean export
    ) {}

    public record MeResponse(
            Integer userId,
            String employeeName,
            String role,
            Integer entityId,
            String buAccessScope,
            List<Integer> allowedBuIds,
            String locationAccessScope,
            List<Integer> allowedLocationIds,
            Integer defaultLocationId,
            List<MenuPermissionDto> menuPermissions
    ) {}
}
