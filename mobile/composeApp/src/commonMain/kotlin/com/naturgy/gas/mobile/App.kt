package com.naturgy.gas.mobile

import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import com.naturgy.gas.mobile.data.api.GasApiClient
import com.naturgy.gas.mobile.data.api.createHttpClient
import com.naturgy.gas.mobile.ui.screens.*
import com.naturgy.gas.mobile.ui.theme.NaturgyTheme

enum class Screen(
    val title: String,
    val icon: ImageVector
) {
    SupplyPoints("Suministros", Icons.Default.LocationOn),
    Readings("Lecturas", Icons.Default.Speed),
    Tariffs("Tarifas", Icons.Default.PriceChange),
    ConversionFactors("Conversión", Icons.Default.Science),
    Taxes("Impuestos", Icons.Default.AccountBalance),
    Invoices("Facturas", Icons.Default.Receipt)
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun App(baseUrl: String = "http://10.0.2.2:8080/api/gas") {
    val client = remember { createHttpClient() }
    val api = remember { GasApiClient(client, baseUrl) }

    val supplyPointsVm = remember { SupplyPointsViewModel(api) }
    val readingsVm = remember { ReadingsViewModel(api) }
    val tariffsVm = remember { TariffsViewModel(api) }
    val conversionFactorsVm = remember { ConversionFactorsViewModel(api) }
    val taxesVm = remember { TaxesViewModel(api) }
    val invoicesVm = remember { InvoicesViewModel(api) }

    var currentScreen by remember { mutableStateOf(Screen.SupplyPoints) }

    NaturgyTheme {
        Scaffold(
            topBar = {
                TopAppBar(
                    title = { Text(currentScreen.title) },
                    colors = TopAppBarDefaults.topAppBarColors(
                        containerColor = MaterialTheme.colorScheme.primary,
                        titleContentColor = MaterialTheme.colorScheme.onPrimary
                    )
                )
            },
            bottomBar = {
                NavigationBar {
                    Screen.entries.forEach { screen ->
                        NavigationBarItem(
                            selected = currentScreen == screen,
                            onClick = { currentScreen = screen },
                            icon = { Icon(screen.icon, contentDescription = screen.title) },
                            label = { Text(screen.title, maxLines = 1) }
                        )
                    }
                }
            }
        ) { padding ->
            val modifier = Modifier.padding(padding)
            when (currentScreen) {
                Screen.SupplyPoints -> SupplyPointsScreen(supplyPointsVm)
                Screen.Readings -> ReadingsScreen(readingsVm)
                Screen.Tariffs -> TariffsScreen(tariffsVm)
                Screen.ConversionFactors -> ConversionFactorsScreen(conversionFactorsVm)
                Screen.Taxes -> TaxesScreen(taxesVm)
                Screen.Invoices -> InvoicesScreen(invoicesVm)
            }
        }
    }
}
