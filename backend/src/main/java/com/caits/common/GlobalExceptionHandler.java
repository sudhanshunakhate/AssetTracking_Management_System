package com.caits.common;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<Map<String, Object>> handleApi(ApiException ex) {
        return ResponseEntity.status(ex.getStatus()).body(Map.of(
                "status", ex.getStatus().value(),
                "message", sanitizeClientMessage(ex.getMessage(), ex.getStatus().value())
        ));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException ex) {
        String details = ex.getBindingResult().getFieldErrors().stream()
                .map(FieldError::getDefaultMessage)
                .collect(Collectors.joining("; "));
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("status", HttpStatus.BAD_REQUEST.value());
        body.put("message", details.isBlank() ? "Validation failed" : details);
        return ResponseEntity.badRequest().body(body);
    }

    /**
     * A unique / foreign key constraint that slipped past the service-level checks.
     * Without this the raw Hibernate + Postgres text reaches the user as a 500.
     */
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, Object>> handleIntegrity(DataIntegrityViolationException ex) {
        log.warn("Data integrity violation: {}", rootMessage(ex));
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("status", HttpStatus.CONFLICT.value());
        body.put("message", ConstraintMessages.describe(rootMessage(ex)));
        return ResponseEntity.status(HttpStatus.CONFLICT).body(body);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleOther(Exception ex) {
        // Log full detail server-side; never leak stack traces / SQL to the browser.
        log.error("Unhandled exception", ex);
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("status", HttpStatus.INTERNAL_SERVER_ERROR.value());
        body.put("message", "Unexpected error");
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(body);
    }

    private static String sanitizeClientMessage(String message, int status) {
        if (message == null || message.isBlank()) {
            return status >= 500 ? "Unexpected error" : "Request failed";
        }
        String lower = message.toLowerCase();
        if (lower.contains("sql") || lower.contains("exception") || lower.contains("stack")
                || lower.contains("jdbc") || lower.contains("hibernate")) {
            return status >= 500 ? "Unexpected error" : "Request failed";
        }
        return message;
    }

    private static String rootMessage(Throwable ex) {
        Throwable cause = ex;
        while (cause.getCause() != null && cause.getCause() != cause) {
            cause = cause.getCause();
        }
        return cause.getMessage() == null ? "" : cause.getMessage();
    }
}
