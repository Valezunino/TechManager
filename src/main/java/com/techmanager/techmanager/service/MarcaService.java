package com.techmanager.techmanager.service;

import com.techmanager.techmanager.entity.Marca;

import java.util.List;
import java.util.Optional;

public interface MarcaService {

    List<Marca> listarTodas();

    Optional<Marca> buscarPorId(Long id);

    Marca guardar(Marca marca);

    Marca actualizar(Long id, Marca marca);

    void eliminar(Long id);
}
