package com.naturgy.gas.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "billing_errors")
@Getter
@Setter
@NoArgsConstructor
public class BillingError {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String cups;

    @Column(nullable = false, length = 7)
    private String period;

    @Column(name = "error_message", nullable = false, length = 500)
    private String errorMessage;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public BillingError(String cups, String period, String errorMessage) {
        this.cups = cups;
        this.period = period;
        this.errorMessage = errorMessage;
        this.createdAt = LocalDateTime.now();
    }
}
