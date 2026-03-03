# Naturgy Gas - App Móvil Multiplataforma

App móvil de **solo lectura** para consultar datos de gestión de gas, construida con **Kotlin Multiplatform** y **Compose Multiplatform**.

## Plataformas soportadas

- **Android** (API 26+)
- **iOS** (requiere macOS para compilar)

## Tecnologías

| Componente | Tecnología |
|---|---|
| UI | Compose Multiplatform 1.7.1 |
| Lenguaje | Kotlin 2.0.21 |
| HTTP Client | Ktor 2.3.12 |
| Serialización | Kotlinx Serialization 1.7.3 |
| ViewModel | AndroidX Lifecycle |
| Build | Gradle 8.9 |

## Estructura del proyecto

```
mobile/
├── composeApp/
│   └── src/
│       ├── commonMain/         # Código compartido (modelos, API, UI)
│       │   └── kotlin/com/naturgy/gas/mobile/
│       │       ├── App.kt                    # Composable raíz
│       │       ├── data/
│       │       │   ├── api/                  # Cliente HTTP & API
│       │       │   └── model/                # Modelos de datos
│       │       └── ui/
│       │           ├── theme/                # Tema Naturgy
│       │           ├── components/           # Componentes reutilizables
│       │           └── screens/              # Pantallas
│       ├── androidMain/        # Código Android (MainActivity, HttpClient)
│       └── iosMain/            # Código iOS (MainViewController, HttpClient)
├── gradle/
│   ├── libs.versions.toml      # Catálogo de versiones
│   └── wrapper/
├── build.gradle.kts
├── settings.gradle.kts
└── local.properties            # SDK path (no commitear)
```

## Pantallas

| Pantalla | Descripción |
|---|---|
| Puntos de suministro | Lista CUPS con zona, tarifa y estado |
| Lecturas | Lecturas de gas con fecha, m³ y tipo |
| Tarifas | Tarifas con fijo mensual y variable |
| Factores de conversión | Coeficientes por zona y mes |
| Impuestos | Configuración impositiva vigente |
| Facturas | Listado con detalle de líneas |

## Requisitos previos

1. **JDK 17+** 
2. **Android SDK** (API 35, Build Tools 35.0.0)
3. **Xcode 15+** (solo para iOS, requiere macOS)

## Configuración

### 1. Android SDK

Crear `local.properties` en la raíz de `mobile/`:

```properties
sdk.dir=/ruta/al/Android/Sdk
```

### 2. Backend

La app se conecta al backend Spring Boot. Asegúrate de que esté corriendo:

```bash
cd ../backend
./mvnw spring-boot:run
```

La URL base se configura según la plataforma:
- **Android emulador**: `http://10.0.2.2:8080/api/gas` (mapea al localhost del host)
- **iOS simulador**: `http://localhost:8080/api/gas`
- **Dispositivo físico**: cambiar a la IP de red del host

### 3. Compilar y ejecutar

```bash
# Android
./gradlew :composeApp:assembleDebug

# Instalar en emulador/dispositivo
./gradlew :composeApp:installDebug

# iOS (desde macOS)
# Abrir iosApp/iosApp.xcodeproj en Xcode
```

## API Backend

La app consume los siguientes endpoints (solo GET):

| Recurso | Endpoint |
|---|---|
| Health | `GET /api/gas/health` |
| Supply Points | `GET /api/gas/supply-points` |
| Readings | `GET /api/gas/readings` |
| Tariffs | `GET /api/gas/tariffs` |
| Conversion Factors | `GET /api/gas/conversion-factors` |
| Taxes | `GET /api/gas/taxes` |
| Invoices | `GET /api/gas/invoices` |
| Invoice Detail | `GET /api/gas/invoices/{id}` |
