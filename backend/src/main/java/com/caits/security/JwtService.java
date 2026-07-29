package com.caits.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Service
public class JwtService {
    private final JwtProperties properties;
    private final SecretKey key;

    public JwtService(JwtProperties properties) {
        this.properties = properties;
        this.key = Keys.hmacShaKeyFor(properties.getJwtSecret().getBytes(StandardCharsets.UTF_8));
    }

    public String createToken(String loginId, Integer userId, String roleCode) {
        long now = System.currentTimeMillis();
        long expMs = properties.getJwtExpirationSeconds() * 1000L;
        return Jwts.builder()
                .subject(loginId)
                .claim("userId", userId)
                .claim("roleCode", roleCode)
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

    public CurrentUser toCurrentUser(String token) {
        Claims claims = parse(token);
        Integer userId = claims.get("userId", Integer.class);
        String roleCode = claims.get("roleCode", String.class);
        return new CurrentUser(userId, claims.getSubject(), roleCode);
    }

    public long getExpirationSeconds() {
        return properties.getJwtExpirationSeconds();
    }
}
