package com.naturgy.gas.repository;

import com.naturgy.gas.entity.GasTariff;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDate;
import java.util.Optional;

public interface GasTariffRepository extends JpaRepository<GasTariff, String> {

    @Query("SELECT t FROM GasTariff t WHERE t.tarifa = :tarifa AND t.vigenciaDesde <= :date ORDER BY t.vigenciaDesde DESC")
    java.util.List<GasTariff> findEffectiveByTarifaAndDate(String tarifa, LocalDate date);

    default Optional<GasTariff> findEffective(String tarifa, LocalDate periodEnd) {
        return findEffectiveByTarifaAndDate(tarifa, periodEnd).stream().findFirst();
    }
}
