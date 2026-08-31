package com.techmanager.techmanager.controller;

import com.techmanager.techmanager.entity.Marca;
import com.techmanager.techmanager.service.MarcaService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/marcas")
public class MarcaController {

    private final MarcaService marcaService;

    public MarcaController(MarcaService marcaService) {
        this.marcaService = marcaService;
    }

    @GetMapping
    public List<Marca> listarMarcas() {
        return marcaService.listarTodas();
    }

    @GetMapping("/{id}")
    public Marca buscarMarca(@PathVariable Long id) {
        return marcaService.buscarPorId(id)
                .orElseThrow(() -> new RuntimeException("Marca no encontrada"));
    }

    @PostMapping
    public Marca guardarMarca(@Valid @RequestBody Marca marca) {
        return marcaService.guardar(marca);
    }

    @PutMapping("/{id}")
    public Marca actualizarMarca(@PathVariable Long id, @Valid @RequestBody Marca marca) {
        return marcaService.actualizar(id, marca);
    }

    @DeleteMapping("/{id}")
    public void eliminarMarca(@PathVariable Long id) {
        marcaService.eliminar(id);
    }
}

