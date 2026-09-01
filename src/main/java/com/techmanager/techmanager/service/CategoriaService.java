package com.techmanager.techmanager.service;

import com.techmanager.techmanager.entity.Categoria;

import java.util.List;
import java.util.Optional;

public interface CategoriaService {

    List<Categoria> listarTodas();

    Optional<Categoria> buscarPorId(Long id);

    Categoria guardar(Categoria categoria);

    Categoria actualizar(Long id, Categoria categoria);

    void eliminar(Long id);
}
