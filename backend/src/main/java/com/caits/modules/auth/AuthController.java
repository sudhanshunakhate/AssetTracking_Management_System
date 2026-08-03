package com.caits.modules.auth;

import com.caits.common.MessageResponse;
import com.caits.modules.auth.AuthDtos.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public LoginResponse login(@RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @PostMapping("/logout")
    public MessageResponse logout() {
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
    public MessageResponse changePassword(@RequestBody ChangePasswordRequest request) {
        return authService.changePassword(request);
    }

    @PostMapping("/forgot-password")
    public MessageResponse forgotPassword(@RequestBody ForgotPasswordRequest request) {
        return authService.forgotPassword(request);
    }
}
