package com.naturgy.gas.mobile.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.naturgy.gas.mobile.data.api.GasApiClient
import com.naturgy.gas.mobile.data.model.GasTariff
import com.naturgy.gas.mobile.ui.components.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class TariffsViewModel(private val api: GasApiClient) : ViewModel() {
    private val _items = MutableStateFlow<List<GasTariff>>(emptyList())
    val items = _items.asStateFlow()

    private val _isLoading = MutableStateFlow(true)
    val isLoading = _isLoading.asStateFlow()

    private val _error = MutableStateFlow<String?>(null)
    val error = _error.asStateFlow()

    init { load() }

    fun load() {
        viewModelScope.launch {
            _isLoading.value = true
            _error.value = null
            try {
                _items.value = api.getTariffs()
            } catch (e: Exception) {
                _error.value = "Error al cargar tarifas: ${e.message}"
            } finally {
                _isLoading.value = false
            }
        }
    }
}

@Composable
fun TariffsScreen(viewModel: TariffsViewModel) {
    val items by viewModel.items.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()
    val error by viewModel.error.collectAsState()

    when {
        isLoading -> LoadingIndicator()
        error != null -> ErrorMessage(message = error!!, onRetry = { viewModel.load() })
        items.isEmpty() -> EmptyState("No hay tarifas configuradas")
        else -> LazyColumn(
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            items(items, key = { it.tarifa }) { tariff ->
                TariffCard(tariff)
            }
        }
    }
}

@Composable
private fun TariffCard(tariff: GasTariff) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(
                text = tariff.tarifa,
                style = MaterialTheme.typography.titleSmall,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.primary
            )
            Spacer(Modifier.height(8.dp))
            InfoRow("Fijo mensual", "${tariff.fijoMesEur} EUR")
            InfoRow("Variable", "${tariff.variableEurKwh} EUR/kWh")
            InfoRow("Vigencia desde", tariff.vigenciaDesde)
        }
    }
}
