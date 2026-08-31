package com.techmanager.techmanager.controller;

import com.techmanager.techmanager.dto.BootstrapRequest;
import com.techmanager.techmanager.dto.LoginRequest;
import com.techmanager.techmanager.dto.LoginResponse;
import com.techmanager.techmanager.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @GetMapping("/bootstrap-status")
    public Map<String, Boolean> bootstrapStatus() {
        return Map.of("requiereAdministrador", authService.requiereAdministradorInicial());
    }

    @PostMapping("/bootstrap")
    public ResponseEntity<LoginResponse> bootstrap(
            @Valid @RequestBody BootstrapRequest request
    ) {
        return ResponseEntity.ok(authService.crearAdministradorInicial(request));
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(
            @Valid @RequestBody LoginRequest request
    ) {
        return ResponseEntity.ok(authService.login(request));
    }
}

