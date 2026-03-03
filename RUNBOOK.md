# GAS Workshop — Runbook de arranque y demo

## 1. Prerequisitos

| Herramienta | Versión mínima | Verificar |
|---|---|---|
| Java (JDK) | 17 | `java -version` |
| Maven | 3.8+ | `mvn -v` |
| Node.js | 18+ | `node -v` |
| npm | 9+ | `npm -v` |

> **Puertos necesarios:** `8080` (backend) · `5173` (frontend)

---

## 2. Arrancar el backend

```bash
cd backend
mvn spring-boot:run
```

Espera a ver:
```
Started Application in ... seconds
```

Verifica con:
```bash
curl -s http://localhost:8080/api/gas/supply-points | python3 -m json.tool
```

---

## 3. Arrancar el frontend

```bash
# En otra terminal
npm --prefix frontend install   # solo la primera vez
npm --prefix frontend run dev
```

Abre en el navegador: **http://localhost:5173**

El proxy Vite redirige automáticamente `/api → http://localhost:8080`.

---

## 4. Pasos de demo (flujo completo)

### 4.1 Cargar maestros (si la BD está vacía)

Los CSV de ejemplo están en `_data/db/samples/` (ver §6).  
Puedes importarlos vía el endpoint `POST /api/gas/…` o usar los CSV que soporta el backend.

### 4.2 Pantalla: Puntos de Suministro
1. Navega a **Puntos de Suministro** en el menú lateral.
2. Haz clic en **Nuevo** → rellena CUPS, Zona, Tarifa, Estado=ACTIVO → **Guardar**.
3. Verifica el nuevo punto en la tabla (DataGrid paginado).
4. Edita y cambia Estado a INACTIVO → **Guardar**.

### 4.3 Pantalla: Lecturas
1. Navega a **Lecturas**.
2. Crea al menos **dos lecturas** para el mismo CUPS:
   - Lectura *anterior* al periodo de facturación (ej. `fecha=2025-12-31`)
   - Lectura *dentro* del periodo (ej. `fecha=2026-01-31`)
3. Usa el filtro **CUPS** + botón **Buscar** para verificar.

### 4.4 Pantalla: Tarifario
1. Navega a **Tarifario** → **Nueva Tarifa**.
2. Crea tarifa `RL1`: Fijo=5.00, Variable=0.062, Vigencia=2026-01-01.

### 4.5 Pantalla: Factores de Conversión
1. Navega a **Factores de Conversión** → **Nuevo Factor**.
2. Crea: Zona=ZONA1, Mes=2026-01, CoefConv=1.01, PCS=11.5.
3. Prueba el filtro por Zona y/o Mes.

### 4.6 Pantalla: Impuestos (IVA)
1. Navega a **Impuestos (IVA)** → **Nuevo Impuesto**.
2. Crea: Código=`IVA`, Tasa=0.21, Vigencia=2026-01-01.

### 4.7 Pantalla: Facturación ⭐
1. Navega a **Facturación**.
2. Introduce periodo: **`2026-01`** y pulsa **Ejecutar Facturación**.
3. Observa los contadores: *Facturas creadas / actualizadas / errores*.
4. Si hay errores, revisa la tabla de errores (CUPS + motivo).
5. Re-ejecuta el mismo periodo → *Facturas actualizadas* sube (idempotencia).

### 4.8 Pantalla: Facturas
1. Navega a **Facturas**.
2. Filtra por periodo `2026-01` → **Buscar**.
3. Haz clic en 👁 (**Ver detalle**) → aparece el modal con:
   - Cabecera: nº factura, CUPS, periodo, totales
   - Líneas: TERMINO_FIJO, TERMINO_VARIABLE, IVA
4. Pulsa **Descargar PDF** (en la tabla o en el modal) → se descarga el PDF.

---

## 5. Comandos útiles

```bash
# Build de producción del frontend
npm --prefix frontend run build

# Verificar TypeScript sin compilar
npm --prefix frontend run tsc -- --noEmit

# Limpiar caché Vite
rm -rf frontend/node_modules/.vite
```

---

## 6. Rutas SSOT y CSV samples

| Recurso | Ruta |
|---|---|
| Spec CSV (esquemas) | `_data/specs/gas_csv-spec.txt` |
| Spec lógica de facturación | `_data/specs/gas_logic-spec.txt` |
| React standards | `_data/specs/react-standards.md` |
| CSV samples | `_data/db/samples/supply-points.csv` |
| | `_data/db/samples/gas-readings.csv` |
| | `_data/db/samples/gas-tariffs.csv` |
| | `_data/db/samples/gas-conversion-factors.csv` |
| | `_data/db/samples/taxes.csv` |
| PDF de factura demo | `_data/specs/factura_gas_demo.pdf` |

---

## 7. Multi-idioma (i18n)

La aplicación soporta tres idiomas: **Español**, **English** y **Català**.

- Selector de idioma: icono de globo (🌐) en la barra superior derecha.
- El idioma se persiste en `localStorage`; al recargar se mantiene.
- Ficheros de traducción: `frontend/src/i18n/{es,en,ca}.json`.
- Stack: `i18next` + `react-i18next` + `i18next-browser-languagedetector`.

## 8. PDF de factura

Cada factura genera un PDF branded Naturgy con:

- Cabecera naranja con logo
- Datos de factura a dos columnas
- Tabla de detalle del consumo
- **Gráfico de pastel** — desglose por concepto (Consumo / Término fijo / IVA)
- **Gráfico de barras** — últimos consumos (m³) calculados a partir de las lecturas del CUPS

## 9. Estructura del frontend generado

```
frontend/
├── vite.config.ts          # proxy /api → localhost:8080
├── src/
│   ├── main.tsx            # entry point (StrictMode + Providers)
│   ├── App.tsx             # AppShell: Drawer + AppBar + routing por estado
│   ├── app/
│   │   ├── theme.ts        # Naturgy orange (#F5831F) + navy, MUI v7
│   │   └── providers.tsx   # ThemeProvider + CssBaseline
│   ├── i18n/               # Traducciones ES / EN / CA
│   │   ├── index.ts
│   │   ├── es.json
│   │   ├── en.json
│   │   └── ca.json
│   ├── shared/
│   │   ├── api/httpClient.ts   # fetch wrapper + error mapping
│   │   └── ui/
│   │       ├── PageHeader.tsx
│   │       └── ConfirmDialog.tsx
│   └── features/
│       ├── supplyPoints/   # CRUD Puntos de Suministro
│       ├── readings/       # CRUD Lecturas + filtro CUPS
│       ├── tariffs/        # CRUD Tarifario
│       ├── conversionFactors/ # CRUD + filtro zona/mes
│       ├── taxes/          # CRUD IVA
│       ├── billing/        # Ejecutar facturación + resultado
│       └── invoices/       # Listado + detalle + descarga PDF
```

---

## 10. Variables de entorno (opcional)

Para apuntar a un backend en otro host, crea `frontend/.env.local`:
```env
VITE_API_TARGET=http://mi-servidor:8080
```
Y actualiza `vite.config.ts` para usar `process.env.VITE_API_TARGET`.

---

*Generado automáticamente para el GAS Workshop — Naturgy Group 1*
