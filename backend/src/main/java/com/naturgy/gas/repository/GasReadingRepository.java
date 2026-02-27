package com.naturgy.gas.repository;

import com.naturgy.gas.entity.GasReading;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface GasReadingRepository extends JpaRepository<GasReading, Long> {

    boolean existsByCupsAndFecha(String cups, LocalDate fecha);

    List<GasReading> findByCupsOrderByFechaDesc(String cups);

    Optional<GasReading> findTopByCupsAndFechaBeforeOrderByFechaDesc(String cups, LocalDate fecha);

    Optional<GasReading> findTopByCupsAndFechaLessThanEqualOrderByFechaDesc(String cups, LocalDate fecha);
}
