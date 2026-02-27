package com.naturgy.gas.repository;

import com.naturgy.gas.entity.Invoice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface InvoiceRepository extends JpaRepository<Invoice, String> {

    Optional<Invoice> findByCupsAndPeriodoInicio(String cups, LocalDate periodoInicio);

    long countByNumeroFacturaStartingWith(String prefix);

    List<Invoice> findByCups(String cups);

    List<Invoice> findByPeriodoInicio(LocalDate periodoInicio);

    List<Invoice> findByFechaEmision(LocalDate fechaEmision);

    @Query("SELECT i FROM Invoice i LEFT JOIN FETCH i.lines WHERE i.numeroFactura = :id")
    Optional<Invoice> findByIdWithLines(String id);

    @Query("SELECT i FROM Invoice i WHERE (:cups IS NULL OR i.cups = :cups) " +
           "AND (:periodoInicio IS NULL OR i.periodoInicio = :periodoInicio) " +
           "AND (:fechaEmision IS NULL OR i.fechaEmision = :fechaEmision)")
    List<Invoice> findWithFilters(String cups, LocalDate periodoInicio, LocalDate fechaEmision);
}
