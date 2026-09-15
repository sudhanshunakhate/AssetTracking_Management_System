package com.caits.config;

import com.caits.security.NoStoreCacheInterceptor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebMvcSecurityConfig implements WebMvcConfigurer {

    private final NoStoreCacheInterceptor noStoreCacheInterceptor;

    public WebMvcSecurityConfig(NoStoreCacheInterceptor noStoreCacheInterceptor) {
        this.noStoreCacheInterceptor = noStoreCacheInterceptor;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(noStoreCacheInterceptor).addPathPatterns("/api/**");
    }
}
