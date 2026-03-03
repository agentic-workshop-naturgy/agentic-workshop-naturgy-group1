package com.naturgy.gas.mobile.ui.theme

import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val NaturgyGreen = Color(0xFF00A651)
private val NaturgyDarkGreen = Color(0xFF007A3D)
private val NaturgyLightGreen = Color(0xFFB2DFDB)
private val NaturgyBlue = Color(0xFF1565C0)

private val LightColorScheme = lightColorScheme(
    primary = NaturgyGreen,
    onPrimary = Color.White,
    primaryContainer = NaturgyLightGreen,
    onPrimaryContainer = NaturgyDarkGreen,
    secondary = NaturgyBlue,
    onSecondary = Color.White,
    surface = Color.White,
    onSurface = Color(0xFF1C1B1F),
    background = Color(0xFFF8F9FA),
    onBackground = Color(0xFF1C1B1F),
    error = Color(0xFFBA1A1A),
    onError = Color.White,
)

@Composable
fun NaturgyTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = LightColorScheme,
        typography = Typography(),
        content = content
    )
}
