package com.naturgy.gas.controller;

import com.naturgy.gas.dto.LoginRequest;
import com.naturgy.gas.dto.LoginResponse;
import com.naturgy.gas.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/gas/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        Optional<String> token = authService.login(request.getUsername(), request.getPassword());
        if (token.isPresent()) {
            return ResponseEntity.ok(new LoginResponse(token.get(), request.getUsername()));
        }
        return ResponseEntity.status(401)
                .body(Map.of("message", "Invalid username or password"));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            authService.logout(authHeader.substring(7));
        }
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        }
        Optional<String> username = authService.validateToken(authHeader.substring(7));
        if (username.isPresent()) {
            return ResponseEntity.ok(Map.of("username", username.get()));
        }
        return ResponseEntity.status(401).body(Map.of("message", "Invalid or expired token"));
    }
}
