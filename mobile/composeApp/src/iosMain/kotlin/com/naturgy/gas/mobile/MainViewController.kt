package com.naturgy.gas.mobile

import androidx.compose.ui.window.ComposeUIViewController

fun MainViewController() = ComposeUIViewController {
    // Use localhost for iOS simulator connecting to host
    App(baseUrl = "http://localhost:8080/api/gas")
}
