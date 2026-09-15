package com.caits.modules.auth;

import com.caits.common.MessageResponse;
import com.caits.modules.auth.AuthDtos.*;
import com.caits.security.AuthCookieService;
import com.caits.security.PayloadCryptoService;
import com.fasterxml.jackson.databind.JsonNode;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;
    private final AuthCookieService authCookieService;
    private final PayloadCryptoService payloadCrypto;

    public AuthController(
            AuthService authService,
            AuthCookieService authCookieService,
            PayloadCryptoService payloadCrypto) {
        this.authService = authService;
        this.authCookieService = authCookieService;
        this.payloadCrypto = payloadCrypto;
    }

    /** SPKI public key for RSA-OAEP-256 payload encryption (login / passwords). */
    @GetMapping("/public-key")
    public Map<String, Object> publicKey() {
        return payloadCrypto.publicKeyResponse();
    }

    /** Ensures the SPA receives an XSRF-TOKEN cookie before mutating calls. */
    @GetMapping("/csrf")
    public Map<String, String> csrf(CsrfToken token) {
        return Map.of(
                "headerName", token.getHeaderName(),
                "parameterName", token.getParameterName(),
                "token", token.getToken()
        );
    }

    @PostMapping("/login")
    public LoginResponse login(
            @RequestBody EncryptedPayloadRequest request,
            HttpServletResponse response) {
        JsonNode plain = payloadCrypto.decryptPayload(request == null ? null : request.cipher());
        LoginRequest decoded = new LoginRequest(
                payloadCrypto.requireText(plain, "loginId"),
                payloadCrypto.requireText(plain, "password")
        );
        LoginResponse body = authService.login(decoded);
        if (body.token() != null && !body.token().isBlank()) {
            authCookieService.writeSessionCookie(response, body.token());
        }
        return new LoginResponse(null, body.user(), body.expiresIn(), body.mustChangePassword());
    }

    /** Sliding session — extends HttpOnly cookie expiry while the user is active. */
    @PostMapping("/refresh")
    public LoginResponse refresh(HttpServletResponse response) {
        LoginResponse body = authService.refresh();
        if (body.token() != null && !body.token().isBlank()) {
            authCookieService.writeSessionCookie(response, body.token());
        }
        return new LoginResponse(null, body.user(), body.expiresIn(), body.mustChangePassword());
    }

    @PostMapping("/logout")
    public MessageResponse logout(HttpServletResponse response) {
        authCookieService.clearSessionCookie(response);
        return authService.logout();
    }

    @GetMapping("/me")
    public MeResponse me() {
        return authService.me();
    }

    @GetMapping("/profile")
    public ProfileResponse profile() {
        return authService.profile();
    }

    @GetMapping("/favourites")
    public FavouritesResponse getFavourites() {
        return authService.getFavourites();
    }

    @PutMapping("/favourites")
    public FavouritesResponse saveFavourites(@RequestBody FavouritesRequest request) {
        return authService.saveFavourites(request);
    }

    @PostMapping("/change-password")
    public MessageResponse changePassword(@RequestBody EncryptedPayloadRequest request) {
        JsonNode plain = payloadCrypto.decryptPayload(request == null ? null : request.cipher());
        ChangePasswordRequest decoded = new ChangePasswordRequest(
                payloadCrypto.requireText(plain, "oldPassword"),
                payloadCrypto.requireText(plain, "newPassword"),
                payloadCrypto.requireText(plain, "confirmPassword")
        );
        return authService.changePassword(decoded);
    }

    @PostMapping("/forgot-password")
    public MessageResponse forgotPassword(@RequestBody EncryptedPayloadRequest request) {
        JsonNode plain = payloadCrypto.decryptPayload(request == null ? null : request.cipher());
        ForgotPasswordRequest decoded = new ForgotPasswordRequest(
                payloadCrypto.requireText(plain, "loginId")
        );
        return authService.forgotPassword(decoded);
    }
}
