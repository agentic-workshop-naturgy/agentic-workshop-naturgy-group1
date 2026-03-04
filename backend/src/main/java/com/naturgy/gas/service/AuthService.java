package com.naturgy.gas.service;

import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class AuthService {

    /** username -> SHA-256 hex hash of password */
    private final Map<String, String> users = new ConcurrentHashMap<>();

    /** active tokens -> username */
    private final Map<String, String> activeSessions = new ConcurrentHashMap<>();

    private final SecureRandom secureRandom = new SecureRandom();

    @PostConstruct
    void init() {
        // Default user: admin / admin99admin
        users.put("admin", sha256("admin99admin"));
    }

    /**
     * Validate credentials and return a session token if valid.
     */
    public Optional<String> login(String username, String password) {
        String storedHash = users.get(username);
        if (storedHash == null) {
            return Optional.empty();
        }
        String inputHash = sha256(password);
        if (!storedHash.equals(inputHash)) {
            return Optional.empty();
        }
        // Generate a random token
        byte[] tokenBytes = new byte[32];
        secureRandom.nextBytes(tokenBytes);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(tokenBytes);
        activeSessions.put(token, username);
        return Optional.of(token);
    }

    /**
     * Validate a session token.
     */
    public Optional<String> validateToken(String token) {
        return Optional.ofNullable(activeSessions.get(token));
    }

    /**
     * Logout – invalidate token.
     */
    public void logout(String token) {
        activeSessions.remove(token);
    }

    private static String sha256(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder();
            for (byte b : hash) {
                hex.append(String.format("%02x", b));
            }
            return hex.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 not available", e);
        }
    }
}
