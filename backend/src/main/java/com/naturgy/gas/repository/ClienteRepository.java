package com.naturgy.gas.repository;

import com.naturgy.gas.entity.Cliente;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ClienteRepository extends JpaRepository<Cliente, Long> {
    boolean existsByNif(String nif);
    java.util.Optional<Cliente> findByNif(String nif);
}
