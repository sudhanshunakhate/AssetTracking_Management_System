package com.caits.security;

import com.caits.common.ApiException;
import com.caits.domain.entity.SysmRolesMst;
import com.caits.domain.entity.SysmUserloginMst;
import com.caits.domain.repository.SysmRolesMstRepository;
import com.caits.domain.repository.SysmUserloginMstRepository;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

/**
 * Issues minimal JWTs ({@code sub} + {@code exp} only). Role and user id are always
 * loaded from the database so a stolen/altered claim cannot escalate privileges.
 */
@Service
public class JwtService {
    private final JwtProperties properties;
    private final SecretKey key;
    private final SysmUserloginMstRepository userRepo;
    private final SysmRolesMstRepository roleRepo;

    public JwtService(
            JwtProperties properties,
            SysmUserloginMstRepository userRepo,
            SysmRolesMstRepository roleRepo) {
        this.properties = properties;
        this.key = Keys.hmacShaKeyFor(properties.getJwtSecret().getBytes(StandardCharsets.UTF_8));
        this.userRepo = userRepo;
        this.roleRepo = roleRepo;
    }

    public String createToken(String loginId) {
        long now = System.currentTimeMillis();
        long expMs = properties.getJwtExpirationSeconds() * 1000L;
        return Jwts.builder()
                .subject(loginId)
                .issuedAt(new Date(now))
                .expiration(new Date(now + expMs))
                .signWith(key)
                .compact();
    }

    public Claims parse(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    @Transactional(readOnly = true)
    public CurrentUser toCurrentUser(String token) {
        Claims claims = parse(token);
        String loginId = claims.getSubject();
        if (loginId == null || loginId.isBlank()) {
            throw ApiException.unauthorized("Invalid session");
        }
        SysmUserloginMst user = userRepo.findByUsrLoginIdIgnoreCase(loginId)
                .orElseThrow(() -> ApiException.unauthorized("Invalid session"));
        if (Boolean.FALSE.equals(user.getUsrIsactive())
                || "Disabled".equalsIgnoreCase(nullSafe(user.getUsrAccountStatus()))
                || "Locked".equalsIgnoreCase(nullSafe(user.getUsrAccountStatus()))) {
            throw ApiException.unauthorized("Invalid session");
        }
        SysmRolesMst role = roleRepo.findById(user.getUsrRoleIdRol())
                .orElseThrow(() -> ApiException.unauthorized("Invalid session"));
        return new CurrentUser(user.getUsrUserId(), user.getUsrLoginId(), role.getRolRoleCode());
    }

    public long getExpirationSeconds() {
        return properties.getJwtExpirationSeconds();
    }

    private static String nullSafe(String v) {
        return v == null ? "" : v;
    }
}
