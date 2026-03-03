package com.naturgy.gas.mobile.data.api

import com.naturgy.gas.mobile.data.model.*
import io.ktor.client.*
import io.ktor.client.call.*
import io.ktor.client.request.*

class GasApiClient(
    private val client: HttpClient,
    private val baseUrl: String = "http://10.0.2.2:8080/api/gas" // Android emulator → host
) {
    // Health
    suspend fun getHealth(): HealthStatus =
        client.get("$baseUrl/health").body()

    // Supply Points
    suspend fun getSupplyPoints(): List<SupplyPoint> =
        client.get("$baseUrl/supply-points").body()

    suspend fun getSupplyPoint(cups: String): SupplyPoint =
        client.get("$baseUrl/supply-points/$cups").body()

    // Readings
    suspend fun getReadings(cups: String? = null): List<GasReading> =
        client.get("$baseUrl/readings") {
            cups?.let { parameter("cups", it) }
        }.body()

    suspend fun getReading(id: Long): GasReading =
        client.get("$baseUrl/readings/$id").body()

    // Tariffs
    suspend fun getTariffs(): List<GasTariff> =
        client.get("$baseUrl/tariffs").body()

    suspend fun getTariff(tarifa: String): GasTariff =
        client.get("$baseUrl/tariffs/$tarifa").body()

    // Conversion Factors
    suspend fun getConversionFactors(): List<GasConversionFactor> =
        client.get("$baseUrl/conversion-factors").body()

    suspend fun getConversionFactor(id: Long): GasConversionFactor =
        client.get("$baseUrl/conversion-factors/$id").body()

    // Taxes
    suspend fun getTaxes(): List<TaxConfig> =
        client.get("$baseUrl/taxes").body()

    suspend fun getTax(taxCode: String): TaxConfig =
        client.get("$baseUrl/taxes/$taxCode").body()

    // Invoices
    suspend fun getInvoices(
        cups: String? = null,
        period: String? = null,
        fechaEmision: String? = null
    ): List<Invoice> =
        client.get("$baseUrl/invoices") {
            cups?.let { parameter("cups", it) }
            period?.let { parameter("period", it) }
            fechaEmision?.let { parameter("fechaEmision", it) }
        }.body()

    suspend fun getInvoice(invoiceId: String): Invoice =
        client.get("$baseUrl/invoices/$invoiceId").body()
}
