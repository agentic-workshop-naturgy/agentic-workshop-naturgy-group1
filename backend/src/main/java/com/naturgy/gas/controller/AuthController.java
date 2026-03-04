package com.naturgy.gas.controller;

import com.naturgy.gas.dto.AuthResponse;
import com.naturgy.gas.dto.LoginRequest;
import com.naturgy.gas.dto.RegisterRequest;
import com.naturgy.gas.entity.Usuario;
import com.naturgy.gas.repository.UsuarioRepository;
import com.naturgy.gas.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest req) {
        var user = usuarioRepository.findByUsername(req.username());
        if (user.isEmpty() || !passwordEncoder.matches(req.password(), user.get().getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Usuario o contraseña incorrectos"));
        }
        Usuario u = user.get();
        String token = jwtUtil.generateToken(u.getUsername(), u.getRol().name());
        return ResponseEntity.ok(new AuthResponse(token, u.getUsername(), u.getRol().name(), u.getNombre()));
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest req) {
        if (usuarioRepository.existsByUsername(req.username())) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", "El usuario ya existe"));
        }
        Usuario u = new Usuario();
        u.setUsername(req.username());
        u.setPassword(passwordEncoder.encode(req.password()));
        u.setNombre(req.nombre() != null ? req.nombre() : req.username());
        u.setRol(req.rol() != null ? Usuario.Rol.valueOf(req.rol()) : Usuario.Rol.VIEWER);
        usuarioRepository.save(u);
        String token = jwtUtil.generateToken(u.getUsername(), u.getRol().name());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new AuthResponse(token, u.getUsername(), u.getRol().name(), u.getNombre()));
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(@RequestHeader("Authorization") String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        String token = authHeader.substring(7);
        if (!jwtUtil.validateToken(token)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        String username = jwtUtil.getUsername(token);
        var user = usuarioRepository.findByUsername(username);
        if (user.isEmpty()) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        Usuario u = user.get();
        return ResponseEntity.ok(new AuthResponse(null, u.getUsername(), u.getRol().name(), u.getNombre()));
    }
}
