package com.caits.security;

public record CurrentUser(Integer userId, String loginId, String roleCode) {}
