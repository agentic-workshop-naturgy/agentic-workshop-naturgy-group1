package com.naturgy.gas.repository;

import com.naturgy.gas.entity.TaxConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDate;
import java.util.Optional;

public interface TaxConfigRepository extends JpaRepository<TaxConfig, String> {

    @Query("SELECT t FROM TaxConfig t WHERE t.taxCode = :taxCode AND t.vigenciaDesde <= :date ORDER BY t.vigenciaDesde DESC")
    java.util.List<TaxConfig> findEffectiveByTaxCodeAndDate(String taxCode, LocalDate date);

    default Optional<TaxConfig> findEffective(String taxCode, LocalDate periodEnd) {
        return findEffectiveByTaxCodeAndDate(taxCode, periodEnd).stream().findFirst();
    }
}
