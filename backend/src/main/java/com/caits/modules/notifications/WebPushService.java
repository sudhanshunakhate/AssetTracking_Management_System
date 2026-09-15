package com.caits.modules.notifications;

import com.caits.domain.entity.NtfPushSubscriptionDtl;
import com.caits.domain.repository.NtfPushSubscriptionDtlRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import nl.martijndwars.webpush.Encoding;
import nl.martijndwars.webpush.Notification;
import nl.martijndwars.webpush.PushService;
import nl.martijndwars.webpush.Utils;
import org.bouncycastle.jce.ECNamedCurveTable;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.bouncycastle.jce.spec.ECNamedCurveParameterSpec;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.Security;
import java.util.Base64;
import java.util.List;
import java.util.Map;

@Service
public class WebPushService {
    private static final Logger log = LoggerFactory.getLogger(WebPushService.class);
    private static final String VAPID_SUBJECT = "mailto:caits-notifications@localhost";

    private final NtfPushSubscriptionDtlRepository subscriptionRepo;
    private final ObjectMapper objectMapper;
    private final Path keyFile;
    private volatile PushService pushService;
    private volatile String publicKey;

    public WebPushService(
            NtfPushSubscriptionDtlRepository subscriptionRepo,
            ObjectMapper objectMapper,
            @Value("${caits.storage.upload-dir:./uploads}") String uploadDir) {
        this.subscriptionRepo = subscriptionRepo;
        this.objectMapper = objectMapper;
        this.keyFile = Paths.get(uploadDir).toAbsolutePath().normalize().resolve("vapid-keys.json");
        ensureProvider();
        loadOrCreateKeys();
    }

    public String publicKey() {
        return publicKey;
    }

    public boolean isReady() {
        return pushService != null && publicKey != null && !publicKey.isBlank();
    }

    /** Sends a test Windows/browser push to every subscription for the user. */
    @Async
    public void sendTestAsync(Integer userId) {
        sendToUser(userId, "CAITS notifications enabled",
                "You will receive alerts here even when CAITS is closed or you are logged out.", "/dashboard", 0);
    }

    @Async
    public void sendAsync(Integer userId, NotificationDto dto) {
        sendToUser(userId, dto.title(), dto.body(),
                dto.linkUrl() == null ? "/" : dto.linkUrl(),
                dto.id() == null ? 0 : dto.id());
    }

    private void sendToUser(Integer userId, String title, String body, String url, int id) {
        if (!isReady()) {
            log.warn("Web Push not ready — VAPID keys missing for user {}", userId);
            return;
        }
        List<NtfPushSubscriptionDtl> subs = subscriptionRepo.findByNpsUserIdUsr(userId);
        if (subs.isEmpty()) {
            log.info("Web Push skipped for user {}: no browser subscription saved", userId);
            return;
        }
        byte[] payload;
        try {
            payload = objectMapper.writeValueAsBytes(Map.of(
                    "title", title,
                    "body", body,
                    "url", url,
                    "id", id
            ));
        } catch (Exception e) {
            log.warn("Could not serialize push payload: {}", e.getMessage());
            return;
        }
        for (NtfPushSubscriptionDtl sub : subs) {
            deliverOne(userId, sub, payload);
        }
    }

    private void deliverOne(Integer userId, NtfPushSubscriptionDtl sub, byte[] payload) {
        try {
            Notification notification = new Notification(
                    sub.getNpsEndpoint(),
                    sub.getNpsP256dh(),
                    sub.getNpsAuth(),
                    payload,
                    86400
            );
            // Chrome/Edge on Windows use FCM; Windows native uses WNS — both need aes128gcm.
            var response = pushService.send(notification, Encoding.AES128GCM);
            int status = response.getStatusLine().getStatusCode();
            log.info("Web Push to user {} endpoint {}… returned HTTP {}",
                    userId, abbrevEndpoint(sub.getNpsEndpoint()), status);
            if (status == 404 || status == 410) {
                removeSubscription(sub);
            } else if (status >= 400) {
                log.warn("Web Push rejected for user {}: HTTP {} — {}",
                        userId, status, response.getStatusLine().getReasonPhrase());
            }
        } catch (Exception e) {
            log.warn("Web Push failed for user {}: {}", userId, e.getMessage(), e);
        }
    }

    @Transactional
    protected void removeSubscription(NtfPushSubscriptionDtl sub) {
        subscriptionRepo.delete(sub);
    }

    private static String abbrevEndpoint(String endpoint) {
        if (endpoint == null) return "?";
        int slash = endpoint.lastIndexOf('/');
        return slash > 20 ? endpoint.substring(0, Math.min(48, slash)) + "…" : endpoint;
    }

    private static void ensureProvider() {
        if (Security.getProvider(BouncyCastleProvider.PROVIDER_NAME) == null) {
            Security.addProvider(new BouncyCastleProvider());
        }
    }

    private void loadOrCreateKeys() {
        try {
            Files.createDirectories(keyFile.getParent());
            String pub;
            String priv;
            if (Files.exists(keyFile)) {
                Map<?, ?> json = objectMapper.readValue(keyFile.toFile(), Map.class);
                pub = String.valueOf(json.get("publicKey"));
                priv = String.valueOf(json.get("privateKey"));
                log.info("Loaded Web Push VAPID keys from {}", keyFile);
            } else {
                KeyPair pair = generateVapidKeyPair();
                pub = Base64.getUrlEncoder().withoutPadding().encodeToString(
                        Utils.encode((org.bouncycastle.jce.interfaces.ECPublicKey) pair.getPublic()));
                priv = Base64.getUrlEncoder().withoutPadding().encodeToString(
                        Utils.encode((org.bouncycastle.jce.interfaces.ECPrivateKey) pair.getPrivate()));
                objectMapper.writeValue(keyFile.toFile(), Map.of(
                        "publicKey", pub,
                        "privateKey", priv,
                        "subject", VAPID_SUBJECT
                ));
                log.info("Created Web Push VAPID keys at {}", keyFile);
            }
            this.publicKey = pub;
            this.pushService = new PushService(pub, priv, VAPID_SUBJECT);
        } catch (Exception e) {
            log.error("Web Push VAPID keys could not be initialized: {}", e.getMessage(), e);
        }
    }

    private static KeyPair generateVapidKeyPair() throws Exception {
        ECNamedCurveParameterSpec spec = ECNamedCurveTable.getParameterSpec("prime256v1");
        KeyPairGenerator generator = KeyPairGenerator.getInstance("ECDSA", BouncyCastleProvider.PROVIDER_NAME);
        generator.initialize(spec);
        return generator.generateKeyPair();
    }
}
