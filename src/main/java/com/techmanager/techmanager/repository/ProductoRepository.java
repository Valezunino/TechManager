package com.techmanager.techmanager.repository;

import com.techmanager.techmanager.entity.Producto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProductoRepository extends JpaRepository<Producto, Long> {

    long countByStockLessThanEqual(int stock);
}
