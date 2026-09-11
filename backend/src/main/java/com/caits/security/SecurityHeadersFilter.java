package com.caits.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/** Baseline browser hardening headers for all responses. */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 20)
public class SecurityHeadersFilter extends OncePerRequestFilter {

    private final boolean cookieSecure;

    public SecurityHeadersFilter(@Value("${caits.security.cookie-secure:false}") boolean cookieSecure) {
        this.cookieSecure = cookieSecure;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        boolean https = cookieSecure
                || "https".equalsIgnoreCase(request.getHeader("X-Forwarded-Proto"))
                || request.isSecure();

        response.setHeader("X-Content-Type-Options", "nosniff");
        response.setHeader("X-Frame-Options", "DENY");
        response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
        response.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

        // COOP is ignored by browsers on non-HTTPS IP hosts — only set on trustworthy origins.
        if (https || isLocalhost(request)) {
            response.setHeader("Cross-Origin-Opener-Policy", "same-origin");
        }

        // Allow self-hosted assets + Google Fonts used by the SPA, and React inline styles.
        response.setHeader(
                "Content-Security-Policy",
                String.join("; ",
                        "default-src 'self'",
                        "base-uri 'self'",
                        "form-action 'self'",
                        "frame-ancestors 'none'",
                        "object-src 'none'",
                        "img-src 'self' data: blob:",
                        "font-src 'self' https://fonts.gstatic.com data:",
                        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
                        "script-src 'self'",
                        "connect-src 'self' ws: wss:",
                        "worker-src 'self'",
                        "manifest-src 'self'"
                )
        );

        if (https) {
            response.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
        }
        filterChain.doFilter(request, response);
    }

    private static boolean isLocalhost(HttpServletRequest request) {
        String host = request.getServerName();
        return "localhost".equalsIgnoreCase(host) || "127.0.0.1".equals(host) || "::1".equals(host);
    }
}
