package com.caits.security;

import com.caits.common.ApiException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.spec.OAEPParameterSpec;
import javax.crypto.spec.PSource;
import java.nio.charset.StandardCharsets;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.interfaces.RSAPublicKey;
import java.security.spec.MGF1ParameterSpec;
import java.util.Base64;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * RSA-OAEP (SHA-256) for sensitive browser payloads (login / change-password).
 * Network tab shows only ciphertext; private key never leaves the server.
 */
@Service
public class PayloadCryptoService {

    private static final long MAX_AGE_MS = 120_000L;
    private static final OAEPParameterSpec OAEP = new OAEPParameterSpec(
            "SHA-256", "MGF1", MGF1ParameterSpec.SHA256, PSource.PSpecified.DEFAULT);

    private final ObjectMapper objectMapper;
    private KeyPair keyPair;
    private String publicKeySpkiBase64;
    private final ConcurrentHashMap<String, Long> usedNonces = new ConcurrentHashMap<>();

    public PayloadCryptoService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @PostConstruct
    void init() throws Exception {
        KeyPairGenerator gen = KeyPairGenerator.getInstance("RSA");
        gen.initialize(2048);
        keyPair = gen.generateKeyPair();
        publicKeySpkiBase64 = Base64.getEncoder().encodeToString(keyPair.getPublic().getEncoded());
    }

    public Map<String, Object> publicKeyResponse() {
        RSAPublicKey pub = (RSAPublicKey) keyPair.getPublic();
        return Map.of(
                "alg", "RSA-OAEP-256",
                "kty", "RSA",
                "publicKey", publicKeySpkiBase64,
                "keySize", pub.getModulus().bitLength()
        );
    }

    /** Decrypts base64 ciphertext to UTF-8 JSON and validates ts/nonce. */
    public JsonNode decryptPayload(String cipherBase64) {
        if (cipherBase64 == null || cipherBase64.isBlank()) {
            throw ApiException.badRequest("Encrypted payload is required");
        }
        try {
            byte[] cipherBytes = Base64.getDecoder().decode(cipherBase64.trim());
            Cipher cipher = Cipher.getInstance("RSA/ECB/OAEPWithSHA-256AndMGF1Padding");
            cipher.init(Cipher.DECRYPT_MODE, keyPair.getPrivate(), OAEP);
            byte[] plain = cipher.doFinal(cipherBytes);
            JsonNode node = objectMapper.readTree(new String(plain, StandardCharsets.UTF_8));
            validateFreshness(node);
            return node;
        } catch (ApiException e) {
            throw e;
        } catch (Exception e) {
            throw ApiException.badRequest("Unable to decrypt payload");
        }
    }

    public String requireText(JsonNode node, String field) {
        JsonNode v = node.get(field);
        if (v == null || v.isNull() || v.asText().isBlank()) {
            throw ApiException.badRequest("Missing field: " + field);
        }
        return v.asText();
    }

    private void validateFreshness(JsonNode node) {
        JsonNode tsNode = node.get("ts");
        if (tsNode == null || !tsNode.canConvertToLong()) {
            throw ApiException.badRequest("Encrypted payload missing timestamp");
        }
        long ts = tsNode.asLong();
        long now = System.currentTimeMillis();
        if (Math.abs(now - ts) > MAX_AGE_MS) {
            throw ApiException.badRequest("Encrypted payload expired — refresh and try again");
        }
        JsonNode nonceNode = node.get("nonce");
        if (nonceNode == null || nonceNode.asText().isBlank()) {
            throw ApiException.badRequest("Encrypted payload missing nonce");
        }
        String nonce = nonceNode.asText();
        Long prev = usedNonces.putIfAbsent(nonce, now);
        if (prev != null) {
            throw ApiException.badRequest("Encrypted payload already used");
        }
        // Opportunistic prune
        if (usedNonces.size() > 5_000) {
            long cutoff = now - MAX_AGE_MS * 2;
            usedNonces.entrySet().removeIf(e -> e.getValue() < cutoff);
        }
    }
}
