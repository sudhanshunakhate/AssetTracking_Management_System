package com.caits.config;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/**
 * SPA deep-link fallback for React Router (Tomcat / production WAR).
 * Must not match {@code index.html} itself or {@code forward:/index.html} loops forever.
 */
@Controller
public class SpaForwardController {

    private static final String EXCLUDE =
            "api|ws|assets|sw\\.js|favicon\\.ico|favicon\\.png|manifest\\.webmanifest|logo|vite\\.svg|icons|index\\.html";

    @GetMapping("/")
    public String root() {
        return "forward:/index.html";
    }

    @GetMapping("/{path:^(?!" + EXCLUDE + ").*$}")
    public String oneLevel() {
        return "forward:/index.html";
    }

    @GetMapping("/{path:^(?!" + EXCLUDE + ").*$}/**")
    public String nested() {
        return "forward:/index.html";
    }
}
