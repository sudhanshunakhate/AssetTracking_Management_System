package com.caits.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * Resolves the current user from the HttpOnly {@code CAITS_SESSION} cookie only.
 * Authorization headers are ignored so tokens cannot be exfiltrated via XSS and reused.
 */
@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final AuthCookieService authCookieService;

    public JwtAuthFilter(JwtService jwtService, AuthCookieService authCookieService) {
        this.jwtService = jwtService;
        this.authCookieService = authCookieService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String token = authCookieService.readToken(request);
        if (token != null && !token.isBlank()) {
            try {
                CurrentUser user = jwtService.toCurrentUser(token);
                var auth = new UsernamePasswordAuthenticationToken(
                        user, null, List.of(new SimpleGrantedAuthority("ROLE_" + user.roleCode())));
                SecurityContextHolder.getContext().setAuthentication(auth);
            } catch (Exception ignored) {
                SecurityContextHolder.clearContext();
            }
        }
        filterChain.doFilter(request, response);
    }
}
