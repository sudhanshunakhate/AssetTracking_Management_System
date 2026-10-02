package com.caits.config;

import org.bouncycastle.asn1.x500.X500Name;
import org.bouncycastle.asn1.x509.Extension;
import org.bouncycastle.asn1.x509.GeneralName;
import org.bouncycastle.asn1.x509.GeneralNames;
import org.bouncycastle.cert.X509CertificateHolder;
import org.bouncycastle.cert.jcajce.JcaX509CertificateConverter;
import org.bouncycastle.cert.jcajce.JcaX509v3CertificateBuilder;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.bouncycastle.operator.ContentSigner;
import org.bouncycastle.operator.jcajce.JcaContentSignerBuilder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.OutputStream;
import java.math.BigInteger;
import java.net.InetAddress;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.KeyStore;
import java.security.SecureRandom;
import java.security.Security;
import java.security.cert.X509Certificate;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

/**
 * Creates a reusable PKCS12 keystore with a self-signed certificate so LAN / internal
 * servers can run HTTPS (and therefore browser OS push) without buying a public cert.
 */
public final class SelfSignedTlsSupport {
    private static final Logger log = LoggerFactory.getLogger(SelfSignedTlsSupport.class);
    public static final String KEY_ALIAS = "caits";
    public static final String KEYSTORE_PASSWORD = "caits-tls";

    private SelfSignedTlsSupport() {}

    public static Path ensureKeystore(Path keystorePath, String commonName) {
        try {
            if (Files.isRegularFile(keystorePath)) {
                return keystorePath;
            }
            Files.createDirectories(keystorePath.getParent());
            if (Security.getProvider(BouncyCastleProvider.PROVIDER_NAME) == null) {
                Security.addProvider(new BouncyCastleProvider());
            }

            KeyPairGenerator kpg = KeyPairGenerator.getInstance("RSA");
            kpg.initialize(2048);
            KeyPair keyPair = kpg.generateKeyPair();

            String cn = (commonName == null || commonName.isBlank()) ? "localhost" : commonName.trim();
            X500Name subject = new X500Name("CN=" + cn + ",O=CAITS,OU=Internal");
            Instant now = Instant.now();
            BigInteger serial = new BigInteger(64, new SecureRandom());

            JcaX509v3CertificateBuilder builder = new JcaX509v3CertificateBuilder(
                    subject,
                    serial,
                    Date.from(now.minus(1, ChronoUnit.DAYS)),
                    Date.from(now.plus(825, ChronoUnit.DAYS)),
                    subject,
                    keyPair.getPublic());

            List<GeneralName> names = new ArrayList<>();
            names.add(new GeneralName(GeneralName.dNSName, "localhost"));
            names.add(new GeneralName(GeneralName.iPAddress, "127.0.0.1"));
            if (!"localhost".equalsIgnoreCase(cn)) {
                if (cn.matches("\\d+\\.\\d+\\.\\d+\\.\\d+")) {
                    names.add(new GeneralName(GeneralName.iPAddress, cn));
                } else {
                    names.add(new GeneralName(GeneralName.dNSName, cn));
                }
            }
            try {
                InetAddress local = InetAddress.getLocalHost();
                String hostName = local.getHostName();
                String hostAddress = local.getHostAddress();
                if (hostName != null && !hostName.isBlank()) {
                    names.add(new GeneralName(GeneralName.dNSName, hostName));
                }
                if (hostAddress != null && hostAddress.matches("\\d+\\.\\d+\\.\\d+\\.\\d+")) {
                    names.add(new GeneralName(GeneralName.iPAddress, hostAddress));
                }
            } catch (Exception ignored) {
                /* best-effort SANs */
            }
            builder.addExtension(Extension.subjectAlternativeName, false, new GeneralNames(names.toArray(GeneralName[]::new)));

            ContentSigner signer = new JcaContentSignerBuilder("SHA256WithRSA").setProvider("BC").build(keyPair.getPrivate());
            X509CertificateHolder holder = builder.build(signer);
            X509Certificate cert = new JcaX509CertificateConverter().setProvider("BC").getCertificate(holder);

            KeyStore store = KeyStore.getInstance("PKCS12");
            store.load(null, null);
            char[] password = KEYSTORE_PASSWORD.toCharArray();
            store.setKeyEntry(KEY_ALIAS, keyPair.getPrivate(), password, new X509Certificate[]{cert});
            try (OutputStream out = Files.newOutputStream(keystorePath)) {
                store.store(out, password);
            }

            log.warn(
                    "Created self-signed TLS keystore at {} (password '{}'). "
                            + "Browsers will warn once — accept/continue, then Windows notifications can enable. "
                            + "For external Tomcat, point the HTTPS connector at this PKCS12 file.",
                    keystorePath.toAbsolutePath(),
                    KEYSTORE_PASSWORD);
            return keystorePath;
        } catch (Exception e) {
            throw new IllegalStateException("Failed to create self-signed TLS keystore: " + e.getMessage(), e);
        }
    }
}
