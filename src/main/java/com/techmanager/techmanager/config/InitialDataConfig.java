package com.techmanager.techmanager.config;

import com.techmanager.techmanager.entity.Rol;
import com.techmanager.techmanager.repository.RolRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class InitialDataConfig {

    @Bean
    CommandLineRunner crearRolesIniciales(RolRepository rolRepository) {
        return args -> {
            crearRolSiNoExiste(rolRepository, "ADMIN");
            crearRolSiNoExiste(rolRepository, "EMPLEADO");
        };
    }

    private void crearRolSiNoExiste(RolRepository rolRepository, String nombre) {
        if (rolRepository.findByNombreIgnoreCase(nombre).isEmpty()) {
            Rol rol = new Rol();
            rol.setNombre(nombre);
            rolRepository.save(rol);
        }
    }
}

