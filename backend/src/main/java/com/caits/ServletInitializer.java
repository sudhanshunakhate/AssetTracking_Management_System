package com.caits;

import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.boot.web.servlet.support.SpringBootServletInitializer;

/**
 * Entry point when the app is deployed as a WAR on external Tomcat.
 * Standalone {@link CaitsApplication#main} remains for {@code mvn spring-boot:run}.
 */
public class ServletInitializer extends SpringBootServletInitializer {

    @Override
    protected SpringApplicationBuilder configure(SpringApplicationBuilder builder) {
        return builder.sources(CaitsApplication.class);
    }
}
