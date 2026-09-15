package com.caits.common;

import java.util.Map;

public record MessageResponse(String message) {
    public static MessageResponse of(String message) {
        return new MessageResponse(message);
    }

    public Map<String, Object> with(String key, Object value) {
        return Map.of("message", message, key, value);
    }
}
