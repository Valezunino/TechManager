package com.techmanager.techmanager.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class DashboardDTO {

    private long productos;
    private long categorias;
    private long marcas;
    private long usuarios;
    private long productosSinStock;

}
