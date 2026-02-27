package com.naturgy.gas.repository;

import com.naturgy.gas.entity.BillingError;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BillingErrorRepository extends JpaRepository<BillingError, Long> {

    List<BillingError> findByPeriod(String period);

    void deleteByPeriod(String period);
}
