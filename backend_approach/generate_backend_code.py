#!/usr/bin/env python3
"""Generate CAITS Spring Boot security, auth, masters, and seed code."""
from pathlib import Path

BASE = Path(r"D:\AssetTracking_Management_System\backend\src\main\java\com\caits")

def w(rel: str, content: str):
    path = BASE / rel
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content.strip() + "\n", encoding="utf-8")
    print(f"Wrote {path.relative_to(BASE.parent.parent.parent.parent.parent)}")

# ---------------------------------------------------------------------------
# Common specs helper
# ---------------------------------------------------------------------------
w("common/spec/SpecUtils.java", r'''
package com.caits.common.spec;

import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.Path;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

public final class SpecUtils {
    private SpecUtils() {}

    public static <T> Specification<T> andAll(List<Specification<T>> specs) {
        Specification<T> result = null;
        for (Specification<T> s : specs) {
            if (s == null) continue;
            result = result == null ? s : result.and(s);
        }
        return result == null ? (root, q, cb) -> cb.conjunction() : result;
    }

    public static <T> Specification<T> activeEquals(String field, Boolean isActive) {
        if (isActive == null) return null;
        return (root, q, cb) -> cb.equal(root.get(field), isActive);
    }

    public static <T> Specification<T> searchContains(String search, String... fields) {
        if (search == null || search.isBlank()) return null;
        String pattern = "%" + search.trim().toLowerCase() + "%";
        return (root, q, cb) -> {
            List<Predicate> ors = new ArrayList<>();
            for (String f : fields) {
                Path<String> path = root.get(f);
                ors.add(cb.like(cb.lower(path), pattern));
            }
            return cb.or(ors.toArray(new Predicate[0]));
        };
    }

    public static <T> Specification<T> eq(String field, Object value) {
        if (value == null) return null;
        return (root, q, cb) -> cb.equal(root.get(field), value);
    }

    @SafeVarargs
    public static <T> Specification<T> combine(Specification<T>... specs) {
        List<Specification<T>> list = new ArrayList<>();
        for (Specification<T> s : specs) {
            if (s != null) list.add(s);
        }
        return andAll(list);
    }
}
''')

# ---------------------------------------------------------------------------
# Security package
# ---------------------------------------------------------------------------
w("security/JwtProperties.java", r'''
package com.caits.security;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "caits.security")
public class JwtProperties {
    private String jwtSecret;
    private long jwtExpirationSeconds = 3600;

    public String getJwtSecret() { return jwtSecret; }
    public void setJwtSecret(String jwtSecret) { this.jwtSecret = jwtSecret; }
    public long getJwtExpirationSeconds() { return jwtExpirationSeconds; }
    public void setJwtExpirationSeconds(long jwtExpirationSeconds) { this.jwtExpirationSeconds = jwtExpirationSeconds; }
}
''')

w("security/CurrentUser.java", r'''
package com.caits.security;

public record CurrentUser(Integer userId, String loginId, String roleCode) {}
''')

w("security/SecurityUtils.java", r'''
package com.caits.security;

import com.caits.common.ApiException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

public final class SecurityUtils {
    private SecurityUtils() {}

    public static CurrentUser requireCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof CurrentUser cu)) {
            throw ApiException.unauthorized("Not authenticated");
        }
        return cu;
    }

    public static String requireLoginId() {
        return requireCurrentUser().loginId();
    }

    public static String loginIdOrSystem() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof CurrentUser cu) {
            return cu.loginId();
        }
        return "system";
    }
}
''')

w("security/JwtService.java", r'''
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
''')

w("security/JwtAuthFilter.java", r'''
package com.caits.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {
    private final JwtService jwtService;

    public JwtAuthFilter(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String header = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7);
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
''')

w("security/SecurityConfig.java", r'''
package com.caits.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableConfigurationProperties(JwtProperties.class)
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    @Value("${caits.cors.allowed-origins}")
    private String allowedOrigins;

    public SecurityConfig(JwtAuthFilter jwtAuthFilter) {
        this.jwtAuthFilter = jwtAuthFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(Customizer.withDefaults())
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.POST, "/api/v1/auth/login", "/api/v1/auth/forgot-password").permitAll()
                        .requestMatchers("/api/**").authenticated()
                        .anyRequest().permitAll()
                )
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(Arrays.stream(allowedOrigins.split(",")).map(String::trim).toList());
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
''')

print("Security done")
print("Generator part 1 complete")
