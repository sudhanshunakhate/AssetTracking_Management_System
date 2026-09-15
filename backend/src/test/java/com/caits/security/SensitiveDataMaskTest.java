package com.caits.security;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class SensitiveDataMaskTest {

    @Test
    void masksPanKeepingLast4() {
        assertEquals("XXXXXX234A", SensitiveDataMask.pan("ABCDE1234A"));
    }

    @Test
    void masksEmail() {
        assertEquals("j***@example.com", SensitiveDataMask.email("john@example.com"));
    }

    @Test
    void masksPhone() {
        assertEquals("******3210", SensitiveDataMask.phone("+91-98765-43210"));
    }

    @Test
    void roundTripsEncryptedConverter() {
        EncryptedStringConverter.KeyHolder.configure("unit-test-key");
        EncryptedStringConverter conv = new EncryptedStringConverter();
        String cipher = conv.convertToDatabaseColumn("SECRET-PAN");
        assertTrue(cipher.startsWith("enc:v1:"));
        assertEquals("SECRET-PAN", conv.convertToEntityAttribute(cipher));
        assertEquals("legacy", conv.convertToEntityAttribute("legacy"));
    }
}
