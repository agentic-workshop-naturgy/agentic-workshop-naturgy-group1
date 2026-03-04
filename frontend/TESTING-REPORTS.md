# 📊 Sistema de Reportes de Tests E2E

Este documento explica cómo generar y usar los reportes de errores de los tests E2E ejecutados con Playwright.

## 🎯 Reportes Disponibles

### 1. HTML Report (Playwright Nativo)
- **Comando:** `npm run test:e2e:report`
- **Ubicación:** `e2e-results/html-report/index.html`
- **Características:**
  - Vista interactiva de todos los tests
  - Screenshots y videos de fallos
  - Traces detallados
  - Filtros por browser, estado, archivo

### 2. Error Report (Custom Markdown)
- **Comando:** `npm run test:e2e:error-report`
- **Ubicación:** `e2e-results/error-report.md`
- **Características:**
  - Listado completo de tests fallidos
  - Contexto de error detallado
  - Estadísticas por navegador y módulo
  - Patrones de error comunes
  - Enlaces a screenshots y videos

### 3. JSON Results
- **Ubicación:** `e2e-results/test-results.json`
- **Características:**
  - Resultados estructurados
  - Parseable programáticamente
  - Incluye metadata completa

## 🚀 Flujo de Trabajo Recomendado

### Ejecutar Tests y Generar Reportes

```powershell
# 1. Ejecutar todos los tests (secuencial para evitar colisiones de datos)
npm run test:e2e -- --workers=1

# 2. Generar informe de errores personalizado
npm run test:e2e:error-report

# 3. Abrir HTML report interactivo (opcional)
npm run test:e2e:report
```

### Solo Para Tests Específicos

```powershell
# Ejecutar un módulo específico
npx playwright test readings.spec.ts --workers=1

# Ejecutar tests con un patrón en el nombre
npx playwright test --grep="CF1"

# Generar reporte después
npm run test:e2e:error-report
```

### Para Debugging Individual

```powershell
# Ejecutar en modo headed (ver navegador)
npm run test:e2e:headed -- readings.spec.ts

# Ejecutar en modo UI (interactivo)
npm run test:e2e:ui

# Solo un navegador
npm run test:e2e:chromium -- readings.spec.ts
```

## 📁 Estructura de Resultados

```
frontend/
├── test-results/                    # Resultados detallados por test
│   ├── [test-name]-chromium/
│   │   ├── error-context.md        # Contexto del error
│   │   ├── test-failed-1.png       # Screenshot del fallo
│   │   ├── video.webm              # Video de la ejecución
│   │   └── trace.zip               # Trace completo
│   ├── [test-name]-firefox/
│   └── [test-name]-webkit/
│
└── e2e-results/                     # Reportes consolidados
    ├── html-report/                 # Reporte HTML interactivo
    │   └── index.html
    ├── test-results.json            # Resultados en JSON
    └── error-report.md              # Informe de errores (generado)
```

## 📖 Interpretando el Error Report

### Secciones del Informe

#### 1. Encabezado
```markdown
# ⚠️ Informe de Errores - Tests E2E Playwright
**📅 Fecha de Generación:** [timestamp]
**❌ Total de Tests Fallidos:** X
**🧪 Tests Únicos con Fallos:** Y
```

#### 2. Tabla de Contenidos
Links directos a cada test fallido.

#### 3. Detalles de Errores
Para cada test:
- **Nombre completo del test**
- **Navegadores afectados**
- **Error Context:** Stack trace y mensaje de error
- **Screenshots:** Capturas del momento del fallo
- **Videos:** Grabación completa de la ejecución

#### 4. Resumen Estadístico
- **Distribución por Navegador:** Tabla con porcentajes
- **Distribución por Módulo:** Tests fallidos por feature
- **Patrones de Error Comunes:** Errores recurrentes

### Ejemplo de Entrada en el Reporte

```markdown
## 1. Gestión de Lecturas CF1 Alta exitosa de una lectura

**🌐 Navegadores Afectados:** `chromium`, `firefox`, `webkit`
**📊 Ocurrencias:** 3

### 🔵 CHROMIUM

**📁 Directorio:** `test-results/readings-...-chromium`

#### 🔴 Error Context
```
Error: expect(received).toBeTruthy()
Received: false
  at e2e/tests/readings.spec.ts:28:21
```

#### 📸 Capturas de Pantalla
- `test-results/readings-.../test-failed-1.png`

#### 🎥 Videos de Reproducción
- `test-results/readings-.../video.webm`
```

## 🔧 Solución de Problemas Comunes

### Error Report Vacío
```powershell
# Verifica que haya test-results con errores
dir test-results

# Si no hay, ejecuta los tests primero
npm run test:e2e -- --workers=1
```

### Reporte No Se Actualiza
```powershell
# Elimina resultados anteriores
Remove-Item -Recurse -Force test-results
Remove-Item e2e-results/error-report.md

# Ejecuta tests y genera nuevo reporte
npm run test:e2e -- --workers=1
npm run test:e2e:error-report
```

### JSON Results No Se Generan
El reporter JSON está configurado en `playwright.config.ts`:
```typescript
reporter: [
  ['json', { outputFile: 'e2e-results/test-results.json' }],
  // ...
],
```

## 🎨 Personalización del Error Report

El script `generate-error-report.js` puede modificarse para:
- Cambiar el formato del reporte
- Agregar filtros personalizados
- Exportar a otros formatos (HTML, PDF, etc.)
- Integrar con sistemas de tracking (Jira, GitHub Issues, etc.)

## 📌 Notas Importantes

1. **Ejecutar con `--workers=1`:** Evita colisiones de datos en la BD
2. **Error Report se regenera:** Cada ejecución sobrescribe el anterior
3. **Screenshots y Videos:** Se guardan solo para tests fallidos o con retry
4. **Traces:** Se capturan en el primer retry (ver `playwright.config.ts`)

## 🔗 Links Útiles

- [Playwright Test Reporter API](https://playwright.dev/docs/test-reporters)
- [HTML Reporter](https://playwright.dev/docs/test-reporters#html-reporter)
- [JSON Reporter](https://playwright.dev/docs/test-reporters#json-reporter)
- [Custom Reporters](https://playwright.dev/docs/test-reporters#custom-reporters)
