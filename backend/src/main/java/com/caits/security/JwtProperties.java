package com.caits.security;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.Arrays;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

@ConfigurationProperties(prefix = "caits.security")
public class JwtProperties {
    private String jwtSecret;
    private long jwtExpirationSeconds = 3600;
    /** Comma-separated role codes that see every location / OU. */
    private String locationScopeExemptRoles = "ADMIN";

    public String getJwtSecret() { return jwtSecret; }
    public void setJwtSecret(String jwtSecret) { this.jwtSecret = jwtSecret; }
    public long getJwtExpirationSeconds() { return jwtExpirationSeconds; }
    public void setJwtExpirationSeconds(long jwtExpirationSeconds) { this.jwtExpirationSeconds = jwtExpirationSeconds; }
    public String getLocationScopeExemptRoles() { return locationScopeExemptRoles; }
    public void setLocationScopeExemptRoles(String locationScopeExemptRoles) {
        this.locationScopeExemptRoles = locationScopeExemptRoles;
    }

    public Set<String> exemptRoleCodes() {
        if (locationScopeExemptRoles == null || locationScopeExemptRoles.isBlank()) return Set.of();
        return Arrays.stream(locationScopeExemptRoles.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .map(s -> s.toUpperCase(Locale.ROOT))
                .collect(Collectors.toUnmodifiableSet());
    }
}
