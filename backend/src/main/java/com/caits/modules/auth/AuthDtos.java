package com.caits.modules.auth;

import java.time.LocalDate;
import java.time.LocalDateTime;
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
            boolean export,
            Integer sortOrder,
            String menuGroup,
            Integer groupSortOrder
    ) {}

    public record MeResponse(
            Integer userId,
            String loginId,
            Integer employeeId,
            String employeeName,
            String role,
            Integer entityId,
            String buAccessScope,
            List<Integer> allowedBuIds,
            String locationAccessScope,
            List<Integer> allowedLocationIds,
            Integer defaultLocationId,
            List<MenuPermissionDto> menuPermissions,
            List<String> favouriteMenuCodes
    ) {}

    /**
     * Own-profile view: employee master fields for the logged-in user,
     * plus login identity. Read-only from the client.
     */
    public record ProfileResponse(
            Integer userId,
            String loginId,
            String role,
            LocalDateTime lastLoginOn,
            Integer employeeId,
            String employeeCode,
            String firstName,
            String lastName,
            String gender,
            LocalDate dob,
            LocalDate joiningDate,
            String employmentType,
            String designation,
            String department,
            String email,
            String phone,
            String altPhone,
            Integer baseLocationId,
            String baseLocationName,
            Integer reportingToEmpId,
            String reportingToName,
            Boolean isActive
    ) {}

    public record FavouritesResponse(List<String> menuCodes) {}

    public record FavouritesRequest(List<String> menuCodes) {}
}
