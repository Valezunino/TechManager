package com.techmanager.techmanager.service;

import com.techmanager.techmanager.dto.DashboardDTO;
import com.techmanager.techmanager.repository.CategoriaRepository;
import com.techmanager.techmanager.repository.MarcaRepository;
import com.techmanager.techmanager.repository.ProductoRepository;
import com.techmanager.techmanager.repository.UsuarioRepository;
import org.springframework.stereotype.Service;

@Service
public class DashboardService {

    private final ProductoRepository productoRepository;
    private final CategoriaRepository categoriaRepository;
    private final MarcaRepository marcaRepository;
    private final UsuarioRepository usuarioRepository;

    public DashboardService(
            ProductoRepository productoRepository,
            CategoriaRepository categoriaRepository,
            MarcaRepository marcaRepository,
            UsuarioRepository usuarioRepository
    ) {
        this.productoRepository = productoRepository;
        this.categoriaRepository = categoriaRepository;
        this.marcaRepository = marcaRepository;
        this.usuarioRepository = usuarioRepository;
    }

    public DashboardDTO obtenerEstadisticas() {

        long productos = productoRepository.count();
        long categorias = categoriaRepository.count();
        long marcas = marcaRepository.count();
        long usuarios = usuarioRepository.count();
        long productosSinStock =
                productoRepository.countByStockLessThanEqual(0);

        return new DashboardDTO(
                productos,
                categorias,
                marcas,
                usuarios,
                productosSinStock
        );
    }
}
