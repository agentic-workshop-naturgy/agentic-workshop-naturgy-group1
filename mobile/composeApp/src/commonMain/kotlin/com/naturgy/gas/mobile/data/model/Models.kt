package com.naturgy.gas.mobile.data.model

import kotlinx.serialization.Serializable

@Serializable
data class SupplyPoint(
    val cups: String,
    val zona: String,
    val tarifa: String,
    val estado: String
)

@Serializable
data class GasReading(
    val id: Long? = null,
    val cups: String,
    val fecha: String,
    val lecturaM3: Double,
    val tipo: String
)

@Serializable
data class GasTariff(
    val tarifa: String,
    val fijoMesEur: Double,
    val variableEurKwh: Double,
    val vigenciaDesde: String
)

@Serializable
data class GasConversionFactor(
    val id: Long? = null,
    val zona: String,
    val mes: String,
    val coefConv: Double,
    val pcsKwhM3: Double
)

@Serializable
data class TaxConfig(
    val taxCode: String,
    val taxRate: Double,
    val vigenciaDesde: String
)

@Serializable
data class Invoice(
    val numeroFactura: String,
    val cups: String,
    val periodoInicio: String,
    val periodoFin: String,
    val base: Double,
    val impuestos: Double,
    val total: Double,
    val fechaEmision: String,
    val lines: List<InvoiceLine>? = null
)

@Serializable
data class InvoiceLine(
    val id: Long? = null,
    val tipoLinea: String,
    val descripcion: String,
    val cantidad: Double,
    val precioUnitario: Double,
    val importe: Double
)

@Serializable
data class HealthStatus(
    val status: String,
    val service: String
)
