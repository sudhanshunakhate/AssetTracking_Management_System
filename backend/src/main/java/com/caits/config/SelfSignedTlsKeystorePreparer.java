package com.caits.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * Ensures {@code caits-tls.p12} exists when TLS prepare/enable is on — useful for external
 * Tomcat WAR deploys that cannot use {@link SelfSignedTlsCustomizer}.
 */
@Component
@ConditionalOnProperty(prefix = "caits.security.tls", name = "prepare-keystore", havingValue = "true")
public class SelfSignedTlsKeystorePreparer implements ApplicationRunner {
    private static final Logger log = LoggerFactory.getLogger(SelfSignedTlsKeystorePreparer.class);

    private final Path keystorePath;
    private final String host;

    public SelfSignedTlsKeystorePreparer(
            @Value("${caits.storage.upload-dir:./uploads}") String uploadDir,
            @Value("${caits.security.tls.keystore:}") String keystoreOverride,
            @Value("${caits.security.tls.host:localhost}") String host) {
        Path base = Paths.get(uploadDir).toAbsolutePath().normalize();
        this.keystorePath = (keystoreOverride == null || keystoreOverride.isBlank())
                ? base.resolve("caits-tls.p12")
                : Paths.get(keystoreOverride).toAbsolutePath().normalize();
        this.host = host;
    }

    @Override
    public void run(ApplicationArguments args) {
        Path store = SelfSignedTlsSupport.ensureKeystore(keystorePath, host);
        log.info(
                "TLS keystore ready at {} (alias '{}', password '{}'). Configure Tomcat HTTPS connector to use it.",
                store.toAbsolutePath(),
                SelfSignedTlsSupport.KEY_ALIAS,
                SelfSignedTlsSupport.KEYSTORE_PASSWORD);
    }
}
