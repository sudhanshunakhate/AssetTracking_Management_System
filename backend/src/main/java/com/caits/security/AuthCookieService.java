package com.caits.security;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

import java.time.Duration;

/**
 * HttpOnly session cookie for JWTs — not readable by JavaScript.
 * Works with same-origin Vite proxy ({@code /api} → backend).
 */
@Component
public class AuthCookieService {

    public static final String COOKIE_NAME = "CAITS_SESSION";

    private final long expirationSeconds;
    private final boolean secure;
    private final String sameSite;

    public AuthCookieService(
            JwtProperties jwtProperties,
            @Value("${caits.security.cookie-secure:false}") boolean secure,
            @Value("${caits.security.cookie-same-site:Lax}") String sameSite) {
        this.expirationSeconds = jwtProperties.getJwtExpirationSeconds();
        this.secure = secure;
        this.sameSite = sameSite == null || sameSite.isBlank() ? "Lax" : sameSite;
    }

    public void writeSessionCookie(HttpServletResponse response, String token) {
        ResponseCookie cookie = baseBuilder(token)
                .maxAge(Duration.ofSeconds(Math.max(expirationSeconds, 60)))
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    public void clearSessionCookie(HttpServletResponse response) {
        ResponseCookie cookie = baseBuilder("")
                .maxAge(Duration.ZERO)
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    public String readToken(HttpServletRequest request) {
        if (request.getCookies() == null) {
            return null;
        }
        for (Cookie c : request.getCookies()) {
            if (COOKIE_NAME.equals(c.getName()) && c.getValue() != null && !c.getValue().isBlank()) {
                return c.getValue();
            }
        }
        return null;
    }

    private ResponseCookie.ResponseCookieBuilder baseBuilder(String value) {
        // Path=/ so the Vite-proxied SPA (localhost:5173/api/…) receives the cookie after refresh.
        // Secure stays false for local HTTP; enable via caits.security.cookie-secure in prod.
        return ResponseCookie.from(COOKIE_NAME, value == null ? "" : value)
                .httpOnly(true)
                .secure(secure)
                .path("/")
                .sameSite(sameSite);
    }
}
