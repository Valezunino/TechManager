package com.techmanager.techmanager.service.impl;

import com.techmanager.techmanager.entity.Marca;
import com.techmanager.techmanager.repository.MarcaRepository;
import com.techmanager.techmanager.service.MarcaService;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class MarcaServiceImpl implements MarcaService {

    private final MarcaRepository marcaRepository;

    public MarcaServiceImpl(MarcaRepository marcaRepository) {
        this.marcaRepository = marcaRepository;
    }

    @Override
    public List<Marca> listarTodas() {
        return marcaRepository.findAll();
    }

    @Override
    public Optional<Marca> buscarPorId(Long id) {
        return marcaRepository.findById(id);
    }

    @Override
    public Marca guardar(Marca marca) {
        return marcaRepository.save(marca);
    }

    @Override
    public Marca actualizar(Long id, Marca marca) {
        Marca marcaExistente = marcaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Marca no encontrada"));

        marcaExistente.setNombre(marca.getNombre());

        return marcaRepository.save(marcaExistente);
    }

    @Override
    public void eliminar(Long id) {
        marcaRepository.deleteById(id);
    }
}
