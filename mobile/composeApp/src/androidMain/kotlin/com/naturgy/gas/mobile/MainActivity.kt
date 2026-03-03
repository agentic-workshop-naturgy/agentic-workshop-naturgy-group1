package com.naturgy.gas.mobile

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            // 10.0.2.2 maps to host machine localhost from Android emulator
            App(baseUrl = "http://10.0.2.2:8080/api/gas")
        }
    }
}
