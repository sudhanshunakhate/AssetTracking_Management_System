package com.caits.security;

import jakarta.annotation.PostConstruct;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;

/**
 * Transparent AES-GCM for selected String columns ({@code enc:v1:<base64>}).
 * JPA may instantiate via no-arg ctor — key is supplied through {@link KeyHolder}.
 */
@Converter
public class EncryptedStringConverter implements AttributeConverter<String, String> {

    private static final String PREFIX = "enc:v1:";
    private static final int GCM_IV_LENGTH = 12;
    private static final int GCM_TAG_LENGTH = 128;

    @Override
    public String convertToDatabaseColumn(String attribute) {
        if (attribute == null || attribute.isBlank()) {
            return attribute;
        }
        if (attribute.startsWith(PREFIX)) {
            return attribute;
        }
        try {
            byte[] iv = new byte[GCM_IV_LENGTH];
            new SecureRandom().nextBytes(iv);
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.ENCRYPT_MODE, KeyHolder.key(), new GCMParameterSpec(GCM_TAG_LENGTH, iv));
            byte[] cipherBytes = cipher.doFinal(attribute.getBytes(StandardCharsets.UTF_8));
            ByteBuffer buf = ByteBuffer.allocate(iv.length + cipherBytes.length);
            buf.put(iv);
            buf.put(cipherBytes);
            return PREFIX + Base64.getEncoder().encodeToString(buf.array());
        } catch (Exception e) {
            throw new IllegalStateException("Field encryption failed", e);
        }
    }

    @Override
    public String convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.isBlank() || !dbData.startsWith(PREFIX)) {
            return dbData;
        }
        try {
            byte[] raw = Base64.getDecoder().decode(dbData.substring(PREFIX.length()));
            ByteBuffer buf = ByteBuffer.wrap(raw);
            byte[] iv = new byte[GCM_IV_LENGTH];
            buf.get(iv);
            byte[] cipherBytes = new byte[buf.remaining()];
            buf.get(cipherBytes);
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.DECRYPT_MODE, KeyHolder.key(), new GCMParameterSpec(GCM_TAG_LENGTH, iv));
            return new String(cipher.doFinal(cipherBytes), StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new IllegalStateException("Field decryption failed", e);
        }
    }

    /** Loads encryption secret from Spring config into the static holder. */
    @Component
    static class KeyBootstrap {
        private final String secret;

        KeyBootstrap(@Value("${caits.security.field-encryption-key:CAITS_DEV_FIELD_KEY_CHANGE_ME_32+}") String secret) {
            this.secret = secret;
        }

        @PostConstruct
        void init() {
            KeyHolder.configure(secret);
        }
    }

    static final class KeyHolder {
        private static volatile SecretKey key;

        private KeyHolder() {}

        static void configure(String secret) {
            try {
                byte[] hash = MessageDigest.getInstance("SHA-256")
                        .digest(secret.getBytes(StandardCharsets.UTF_8));
                key = new SecretKeySpec(hash, "AES");
            } catch (Exception e) {
                throw new IllegalStateException("Cannot derive field encryption key", e);
            }
        }

        static SecretKey key() {
            SecretKey local = key;
            if (local == null) {
                configure("CAITS_DEV_FIELD_KEY_CHANGE_ME_32+");
                local = key;
            }
            return local;
        }
    }
}
