package com.naturgy.gas.mobile.data.api

import io.ktor.client.*
import io.ktor.client.engine.okhttp.*

actual fun createPlatformHttpClient(): HttpClient {
    return HttpClient(OkHttp)
}
