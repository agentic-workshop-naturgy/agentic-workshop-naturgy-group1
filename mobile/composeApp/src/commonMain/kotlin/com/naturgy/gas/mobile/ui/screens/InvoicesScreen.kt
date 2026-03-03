package com.naturgy.gas.mobile.ui.screens

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.naturgy.gas.mobile.data.api.GasApiClient
import com.naturgy.gas.mobile.data.model.Invoice
import com.naturgy.gas.mobile.data.model.InvoiceLine
import com.naturgy.gas.mobile.ui.components.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class InvoicesViewModel(private val api: GasApiClient) : ViewModel() {
    private val _items = MutableStateFlow<List<Invoice>>(emptyList())
    val items = _items.asStateFlow()

    private val _selectedInvoice = MutableStateFlow<Invoice?>(null)
    val selectedInvoice = _selectedInvoice.asStateFlow()

    private val _isLoading = MutableStateFlow(true)
    val isLoading = _isLoading.asStateFlow()

    private val _isLoadingDetail = MutableStateFlow(false)
    val isLoadingDetail = _isLoadingDetail.asStateFlow()

    private val _error = MutableStateFlow<String?>(null)
    val error = _error.asStateFlow()

    init { load() }

    fun load() {
        viewModelScope.launch {
            _isLoading.value = true
            _error.value = null
            try {
                _items.value = api.getInvoices()
            } catch (e: Exception) {
                _error.value = "Error al cargar facturas: ${e.message}"
            } finally {
                _isLoading.value = false
            }
        }
    }

    fun loadDetail(invoiceId: String) {
        viewModelScope.launch {
            _isLoadingDetail.value = true
            _error.value = null
            try {
                _selectedInvoice.value = api.getInvoice(invoiceId)
            } catch (e: Exception) {
                _error.value = "Error al cargar detalle: ${e.message}"
            } finally {
                _isLoadingDetail.value = false
            }
        }
    }

    fun clearDetail() {
        _selectedInvoice.value = null
    }
}

@Composable
fun InvoicesScreen(viewModel: InvoicesViewModel) {
    val items by viewModel.items.collectAsState()
    val selectedInvoice by viewModel.selectedInvoice.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()
    val isLoadingDetail by viewModel.isLoadingDetail.collectAsState()
    val error by viewModel.error.collectAsState()

    if (selectedInvoice != null) {
        InvoiceDetailView(
            invoice = selectedInvoice!!,
            isLoading = isLoadingDetail,
            onBack = { viewModel.clearDetail() }
        )
    } else {
        when {
            isLoading -> LoadingIndicator()
            error != null -> ErrorMessage(message = error!!, onRetry = { viewModel.load() })
            items.isEmpty() -> EmptyState("No hay facturas")
            else -> LazyColumn(
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                items(items, key = { it.numeroFactura }) { invoice ->
                    InvoiceCard(
                        invoice = invoice,
                        onClick = { viewModel.loadDetail(invoice.numeroFactura) }
                    )
                }
            }
        }
    }
}

@Composable
private fun InvoiceCard(invoice: Invoice, onClick: () -> Unit) {
    Card(
        modifier = Modifier.fillMaxWidth().clickable(onClick = onClick),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(
                text = invoice.numeroFactura,
                style = MaterialTheme.typography.titleSmall,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.primary
            )
            Spacer(Modifier.height(4.dp))
            Text(
                text = invoice.cups,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Spacer(Modifier.height(8.dp))
            InfoRow("Período", "${invoice.periodoInicio} → ${invoice.periodoFin}")
            InfoRow("Base", "${invoice.base} EUR")
            InfoRow("Impuestos", "${invoice.impuestos} EUR")
            HorizontalDivider(modifier = Modifier.padding(vertical = 4.dp))
            InfoRow("Total", "${invoice.total} EUR")
            InfoRow("Emisión", invoice.fechaEmision)
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun InvoiceDetailView(
    invoice: Invoice,
    isLoading: Boolean,
    onBack: () -> Unit
) {
    Column(modifier = Modifier.fillMaxSize()) {
        TopAppBar(
            title = { Text("Factura") },
            navigationIcon = {
                IconButton(onClick = onBack) {
                    Icon(Icons.AutoMirrored.Filled.ArrowBack, "Volver")
                }
            }
        )

        if (isLoading) {
            LoadingIndicator()
        } else {
            LazyColumn(
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                item {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            SectionTitle("Datos generales")
                            InfoRow("Nº Factura", invoice.numeroFactura)
                            InfoRow("CUPS", invoice.cups)
                            InfoRow("Período", "${invoice.periodoInicio} → ${invoice.periodoFin}")
                            InfoRow("Emisión", invoice.fechaEmision)
                            HorizontalDivider(modifier = Modifier.padding(vertical = 8.dp))
                            InfoRow("Base imponible", "${invoice.base} EUR")
                            InfoRow("Impuestos", "${invoice.impuestos} EUR")
                            InfoRow("Total", "${invoice.total} EUR")
                        }
                    }
                }

                invoice.lines?.let { lines ->
                    item { SectionTitle("Líneas de factura") }
                    items(lines) { line ->
                        InvoiceLineCard(line)
                    }
                }
            }
        }
    }
}

@Composable
private fun InvoiceLineCard(line: InvoiceLine) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
        )
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            Text(
                text = line.tipoLinea,
                style = MaterialTheme.typography.labelMedium,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.primary
            )
            Text(
                text = line.descripcion,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Spacer(Modifier.height(4.dp))
            InfoRow("Cantidad", line.cantidad.toString())
            InfoRow("Precio unit.", "${line.precioUnitario} EUR")
            InfoRow("Importe", "${line.importe} EUR")
        }
    }
}
