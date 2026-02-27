# Agentic Workshop Naturgy · Facturador Gas E2E

Aplicación demo **end-to-end** para facturación de gas: mantiene maestros regulatorios y lecturas, **calcula importes** y **genera la factura** (datos + **PDF**). El repo está preparado para trabajo **agentic** (GitHub Copilot/Agents) con **SSOT** de especificaciones.

---

## Objetivo

Construir una aplicación **facturador gas E2E** que, a partir de lecturas de contador y maestros regulatorios:

- calcula consumos e importes (fijo/variable + alquiler + impuestos)
- genera una **factura** (cabecera + líneas) y su **PDF**
- permite el mantenimiento de datos (CUPS, lecturas, tarifas, factores, impuestos)

---

## Funcionalidades

- **Ingesta** de lecturas de contador (m³) por **CUPS** y periodo.
- **Cálculo de consumo** del periodo y **conversión a kWh**.
- Aplicación de **peajes/cargos** (término fijo + variable) + **alquiler** + **IVA**.
- Generación de **factura** (cabecera + líneas) lista para envío/archivo.
- Export **PDF** de la factura.

---

## Entradas mínimas (maestros y datos)

- **Maestro CUPS** (zona, tarifa, estado)
- **Lecturas** (fecha, m³, REAL/ESTIMADA)
- **Tarifario** (fijo €/mes, variable €/kWh, vigencia)
- **Factores de conversión** por zona/mes (**coef**, **PCS** kWh/m³)
- **Impuestos** (tipo IVA)
 
---

## Lógica de cálculo (resumen)

**m³ consumidos → kWh (coef × PCS) → coste fijo prorrateado + coste variable → base + alquiler → total con IVA**

> Nota: la especificación detallada (campos/formato y reglas de cálculo) está en el **SSOT** del repo.

---

## Estructura del repositorio

- `.github/`  
  Instrucciones y configuración para trabajo con **Copilot/Agents** (prompts, agentes, workflows, etc.).
- `_data/`  
  **SSOT** y dataset reproducible:
  - `_data/specs/` → especificación de datos y lógica de negocio
  - `_data/db/samples/` → CSVs de ejemplo para demo end-to-end
- `backend/`  
  API y lógica de negocio (facturación + PDF).
- `frontend/`  
  UI (React/Vite/TS) para mantenimiento CRUD y consumo de la API.
- `reports/`  
  Salidas de QA (JaCoCo/Vitest/Playwright/Allure opcional) + landing HTML unificado.
- `scripts/`  
  Utilidades de soporte (p.ej. ejecución de SIT/tests, etc.)
- `terraform/`  
  Infra IaC (si aplica al workshop).

---

## Dataset reproducible (demo E2E)

Los CSVs de `_data/db/samples/` permiten ejecutar la demo con datos consistentes:
- puntos de suministro (**CUPS**)
- lecturas
- tarifas
- factores de conversión
- impuestos

---

## Agentes utilizados en el Workshop

### Scaffold (construcción base)
- `db-scaffold-gas.agent.md`  
  Monta la **capa de datos**: estructura/seed desde `_data/db/samples`, entidades y repositorios.

- `backend-scaffold-gas.agent.md`  
  Genera el **backend Spring Boot**: endpoints, lógica (m³→kWh, fijo/variable, IVA), persistencia y salida de factura (cabecera/líneas) + **PDF**.

- `frontend-scaffold-gas.agent.md`  
  Genera el **frontend React/Vite/TS**: pantallas CRUD del workshop (CUPS, lecturas, tarifas, etc.) y consumo de API vía `/api`.

### Debug / Bugfix (ciclos de corrección)
- `backend-bugfix-debug.agent.md`  
  Agente de **debug/bugfix backend**: reproduce errores de terminal/tests, identifica causa raíz (config, seed CSV, DTOs, etc.), aplica fix mínimo + test de regresión y deja PR.

- `frontend-bugfix-debug.agent.md`  
  Agente de **debug/bugfix frontend**: reproduce errores UI/consola/network (400/500, payloads, fechas, validaciones), corrige mapeos/manejo de errores y deja PR.

### Standards / Refactor
- `frontend-scaffold-react-standards.agent.md`  
  Refactor y alineamiento del frontend con `react-standards.md`: estructura, patrones, naming, componentes, tipado y calidad.

### QA / Reporting
- `test-reporter.agent.md`  
  Agente de **QA**: ejecuta tests backend+frontend y genera reportes (JaCoCo/Vitest/Playwright/Allure opcional) con landing `reports/index.html` + resumen en consola.

---

## Ejecución de agentes (según entorno)

- **GitHub Enterprise**: ejecución desde la UI de repositorio / Agents.
- **GitHub Copilot en VS Code**: ejecución desde el IDE con el agente correspondiente.

> Recomendación: mantener `.github/` y `_data/` como “paquete reusable” para bootstrap de otros repos (plantilla SSOT + agentes).

---

## Cómo ejecutar (runbook)

Consulta **`RUNBOOK.md`** para:
- prerrequisitos
- arranque de backend y frontend
- ejecución end-to-end
- generación de PDF
- ejecución de tests y reportes

> Tip: para ejecución rápida de tests en Windows, revisa `run-tests.bat` (si aplica en tu entorno).

---

## Calidad y reportes

- Los reportes unificados se publican en `reports/index.html`.
- Backend: JaCoCo (si está configurado)
- Frontend: Vitest (y Playwright/Allure opcional)

---

## Notas de gobernanza (SSOT)

Las especificaciones **no se “inventan”**: se toman del **SSOT** en `_data/specs/`.  
Cualquier cambio en campos, formatos o reglas debe quedar trazado (Issue/PR) y versionado.

---

## Licencia

Uso interno para workshop 