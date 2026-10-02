package com.caits.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.web.embedded.tomcat.TomcatServletWebServerFactory;
import org.springframework.boot.web.server.Ssl;
import org.springframework.boot.web.server.WebServerFactoryCustomizer;
import org.springframework.stereotype.Component;

import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * Enables HTTPS on the embedded Tomcat used by {@code mvn spring-boot:run} / executable WAR,
 * using an auto-generated self-signed certificate (no purchased cert required).
 * <p>
 * Set {@code CAITS_TLS_ENABLED=true}. Optional: {@code CAITS_TLS_HOST} (server IP/DNS for the cert CN).
 * External Tomcat WAR deploys should configure the connector to the same PKCS12 under upload-dir.
 */
@Component
@ConditionalOnProperty(prefix = "caits.security.tls", name = "enabled", havingValue = "true")
public class SelfSignedTlsCustomizer implements WebServerFactoryCustomizer<TomcatServletWebServerFactory> {
    private static final Logger log = LoggerFactory.getLogger(SelfSignedTlsCustomizer.class);

    private final Path keystorePath;
    private final String commonName;
    private final Integer httpsPort;

    public SelfSignedTlsCustomizer(
            @Value("${caits.storage.upload-dir:./uploads}") String uploadDir,
            @Value("${caits.security.tls.keystore:}") String keystoreOverride,
            @Value("${caits.security.tls.host:localhost}") String host,
            @Value("${caits.security.tls.port:0}") int httpsPort) {
        Path base = Paths.get(uploadDir).toAbsolutePath().normalize();
        this.keystorePath = (keystoreOverride == null || keystoreOverride.isBlank())
                ? base.resolve("caits-tls.p12")
                : Paths.get(keystoreOverride).toAbsolutePath().normalize();
        this.commonName = host;
        this.httpsPort = httpsPort > 0 ? httpsPort : null;
    }

    @Override
    public void customize(TomcatServletWebServerFactory factory) {
        Path store = SelfSignedTlsSupport.ensureKeystore(keystorePath, commonName);
        Ssl ssl = new Ssl();
        ssl.setEnabled(true);
        ssl.setKeyStore(store.toString());
        ssl.setKeyStoreType("PKCS12");
        ssl.setKeyStorePassword(SelfSignedTlsSupport.KEYSTORE_PASSWORD);
        ssl.setKeyAlias(SelfSignedTlsSupport.KEY_ALIAS);
        ssl.setKeyPassword(SelfSignedTlsSupport.KEYSTORE_PASSWORD);
        factory.setSsl(ssl);
        if (httpsPort != null) {
            factory.setPort(httpsPort);
        }
        log.info(
                "CAITS TLS enabled (self-signed). Open https://{}:{} — accept the browser warning once, then enable Windows notifications.",
                commonName,
                httpsPort != null ? httpsPort : factory.getPort());
    }
}
