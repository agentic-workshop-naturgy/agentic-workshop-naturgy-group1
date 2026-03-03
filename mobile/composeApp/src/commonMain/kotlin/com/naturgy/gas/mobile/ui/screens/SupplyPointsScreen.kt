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
import androidx.lifecycle.viewmodel.compose.viewModel
import com.naturgy.gas.mobile.data.api.GasApiClient
import com.naturgy.gas.mobile.data.model.SupplyPoint
import com.naturgy.gas.mobile.ui.components.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class SupplyPointsViewModel(private val api: GasApiClient) : ViewModel() {
    private val _items = MutableStateFlow<List<SupplyPoint>>(emptyList())
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
                _items.value = api.getSupplyPoints()
            } catch (e: Exception) {
                _error.value = "Error al cargar puntos de suministro: ${e.message}"
            } finally {
                _isLoading.value = false
            }
        }
    }
}

@Composable
fun SupplyPointsScreen(viewModel: SupplyPointsViewModel) {
    val items by viewModel.items.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()
    val error by viewModel.error.collectAsState()

    when {
        isLoading -> LoadingIndicator()
        error != null -> ErrorMessage(message = error!!, onRetry = { viewModel.load() })
        items.isEmpty() -> EmptyState("No hay puntos de suministro")
        else -> LazyColumn(
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            items(items, key = { it.cups }) { sp ->
                SupplyPointCard(sp)
            }
        }
    }
}

@Composable
private fun SupplyPointCard(sp: SupplyPoint) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = sp.cups,
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.Bold
                )
                StatusChip(
                    text = sp.estado,
                    isActive = sp.estado == "ACTIVO"
                )
            }
            Spacer(Modifier.height(8.dp))
            InfoRow("Zona", sp.zona)
            InfoRow("Tarifa", sp.tarifa)
        }
    }
}
