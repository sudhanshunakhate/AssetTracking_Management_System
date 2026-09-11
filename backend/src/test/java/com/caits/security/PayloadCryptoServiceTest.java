package com.caits.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import javax.crypto.Cipher;
import javax.crypto.spec.OAEPParameterSpec;
import javax.crypto.spec.PSource;
import java.nio.charset.StandardCharsets;
import java.security.KeyFactory;
import java.security.PublicKey;
import java.security.spec.MGF1ParameterSpec;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class PayloadCryptoServiceTest {

    private PayloadCryptoService crypto;

    @BeforeEach
    void setUp() throws Exception {
        crypto = new PayloadCryptoService(new ObjectMapper());
        crypto.init();
    }

    @Test
    void decryptsRsaOaepLoginPayload() throws Exception {
        Map<String, Object> pub = crypto.publicKeyResponse();
        String spki = (String) pub.get("publicKey");
        PublicKey publicKey = KeyFactory.getInstance("RSA")
                .generatePublic(new X509EncodedKeySpec(Base64.getDecoder().decode(spki)));

        String plaintext = "{\"loginId\":\"admin\",\"password\":\"secret\",\"ts\":"
                + System.currentTimeMillis() + ",\"nonce\":\"" + UUID.randomUUID() + "\"}";
        Cipher cipher = Cipher.getInstance("RSA/ECB/OAEPWithSHA-256AndMGF1Padding");
        cipher.init(Cipher.ENCRYPT_MODE, publicKey, new OAEPParameterSpec(
                "SHA-256", "MGF1", MGF1ParameterSpec.SHA256, PSource.PSpecified.DEFAULT));
        String wire = Base64.getEncoder().encodeToString(cipher.doFinal(plaintext.getBytes(StandardCharsets.UTF_8)));

        var node = crypto.decryptPayload(wire);
        assertEquals("admin", node.get("loginId").asText());
        assertEquals("secret", node.get("password").asText());
    }
}
