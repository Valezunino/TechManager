package com.techmanager.techmanager.service;

import com.techmanager.techmanager.dto.BootstrapRequest;
import com.techmanager.techmanager.dto.LoginRequest;
import com.techmanager.techmanager.dto.LoginResponse;
import com.techmanager.techmanager.entity.Rol;
import com.techmanager.techmanager.entity.Usuario;
import com.techmanager.techmanager.repository.RolRepository;
import com.techmanager.techmanager.repository.UsuarioRepository;
import com.techmanager.techmanager.security.CustomUserDetailsService;
import com.techmanager.techmanager.security.JwtService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final CustomUserDetailsService customUserDetailsService;
    private final JwtService jwtService;
    private final UsuarioRepository usuarioRepository;
    private final RolRepository rolRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthService(
            AuthenticationManager authenticationManager,
            CustomUserDetailsService customUserDetailsService,
            JwtService jwtService,
            UsuarioRepository usuarioRepository,
            RolRepository rolRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.authenticationManager = authenticationManager;
        this.customUserDetailsService = customUserDetailsService;
        this.jwtService = jwtService;
        this.usuarioRepository = usuarioRepository;
        this.rolRepository = rolRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public boolean requiereAdministradorInicial() {
        return usuarioRepository.count() == 0;
    }

    public LoginResponse login(LoginRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        email,
                        request.getPassword()
                )
        );

        return crearRespuestaAutenticada(email);
    }

    @Transactional
    public LoginResponse crearAdministradorInicial(BootstrapRequest request) {
        if (!requiereAdministradorInicial()) {
            throw new IllegalStateException("El administrador inicial ya fue creado");
        }

        Rol rolAdmin = rolRepository.findByNombreIgnoreCase("ADMIN")
                .orElseGet(() -> {
                    Rol rol = new Rol();
                    rol.setNombre("ADMIN");
                    return rolRepository.save(rol);
                });

        Usuario usuario = new Usuario();
        usuario.setNombre(request.getNombre().trim());
        usuario.setEmail(request.getEmail().trim().toLowerCase());
        usuario.setPassword(passwordEncoder.encode(request.getPassword()));
        usuario.setRol(rolAdmin);
        usuario.setActivo(true);
        usuarioRepository.save(usuario);

        return crearRespuestaAutenticada(usuario.getEmail());
    }

    private LoginResponse crearRespuestaAutenticada(String email) {
        Usuario usuario = usuarioRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new IllegalStateException("Usuario autenticado no encontrado"));
        UserDetails userDetails = customUserDetailsService.loadUserByUsername(email);
        String token = jwtService.generarToken(userDetails);

        return new LoginResponse(
                token,
                usuario.getNombre(),
                usuario.getEmail(),
                usuario.getRol().getNombre()
        );
    }
}

