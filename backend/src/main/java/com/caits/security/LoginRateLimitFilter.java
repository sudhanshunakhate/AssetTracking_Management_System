package com.caits.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Iterator;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Simple per-IP rate limit for login and forgot-password to slow credential stuffing.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 15)
public class LoginRateLimitFilter extends OncePerRequestFilter {

    private static final int MAX_ATTEMPTS = 30;
    private static final long WINDOW_MS = 60_000L;

    private final ConcurrentHashMap<String, Window> windows = new ConcurrentHashMap<>();

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        if (path == null) return true;
        return !path.equals("/api/v1/auth/login") && !path.equals("/api/v1/auth/forgot-password");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String key = clientKey(request);
        long now = System.currentTimeMillis();
        prune(now);
        Window window = windows.compute(key, (k, existing) -> {
            if (existing == null || now - existing.startedAt > WINDOW_MS) {
                return new Window(now);
            }
            return existing;
        });
        if (window.count.incrementAndGet() > MAX_ATTEMPTS) {
            response.setStatus(429);
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.getWriter().write("{\"message\":\"Too many attempts. Try again shortly.\"}");
            return;
        }
        filterChain.doFilter(request, response);
    }

    private static String clientKey(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",", 2)[0].trim();
        }
        return request.getRemoteAddr() == null ? "unknown" : request.getRemoteAddr();
    }

    private void prune(long now) {
        if (windows.size() < 500) return;
        Iterator<Map.Entry<String, Window>> it = windows.entrySet().iterator();
        while (it.hasNext()) {
            Map.Entry<String, Window> e = it.next();
            if (now - e.getValue().startedAt > WINDOW_MS) {
                it.remove();
            }
        }
    }

    private static final class Window {
        final long startedAt;
        final AtomicInteger count = new AtomicInteger(0);

        Window(long startedAt) {
            this.startedAt = startedAt;
        }
    }
}
