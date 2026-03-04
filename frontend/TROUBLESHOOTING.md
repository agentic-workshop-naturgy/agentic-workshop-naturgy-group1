# 🔧 Guía de Solución de Errores Comunes - Tests E2E

## 📋 Patrones de Error Identificados

### 1. ❌ `expect(received).toBeTruthy()` - Row Visibility Failures

**Error Típico:**
```
Error: expect(received).toBeTruthy()
Received: false
  at isRowVisible check
```

**Causa Raíz:**
- El DataGrid de MUI no actualiza inmediatamente después de crear/editar
- El test verifica la fila antes de que el grid se refresque

**Solución Implementada:**
```typescript
// En page objects (ej: tariffs.po.ts)
async isRowVisible(uniqueText: string): Promise<boolean> {
  // Espera a que desaparezca el indicador de carga
  await this.page.waitForSelector('[role="progressbar"]', { 
    state: 'detached', 
    timeout: 5000 
  }).catch(() => {});
  
  const row = this.page.locator(`[role="row"]:has-text("${uniqueText}")`);
  await row.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
  
  return await row.isVisible();
}
```

**Próximos Pasos:**
- [ ] Aplicar este patrón a todos los page objects que verifican visibilidad
- [ ] Increase timeout si el backend es lento
- [ ] Considerar agregar wait por datos específicos del backend

---

### 2. 🔄 Duplicate Key/ID Errors

**Error Típico:**
```
Error creating entity: Duplicate entry for key 'PRIMARY' or similar
Snackbar shows: "Error al guardar"
```

**Causa Raíz:**
- Tests ejecutados múltiples veces con los mismos datos
- Base de datos H2 in-memory persiste durante toda la sesión de dev server
- Códigos/IDs hardcoded en test-data.ts colisionan

**Solución Implementada:**
```typescript
// Generar IDs únicos en tiempo de ejecución
const uniqueTariffCode = `${TARIFF.nombre}-${Date.now()}`;

await tariffs.fillForm({
  ...TARIFF,
  nombre: uniqueTariffCode  // Usar código único
});
```

**Próximos Pasos:**
- [ ] Aplicar `Date.now()` o UUID a todos los CF1 (Alta exitosa)
- [ ] Considerar cleanup de BD entre suites
- [ ] O usar transacciones rollback en tests

**Ubicaciones a Actualizar:**
- `e2e/tests/supply-points.spec.ts` - CF1
- `e2e/tests/readings.spec.ts` - CF1 
- `e2e/tests/conversion-factors.spec.ts` - CF1
- `e2e/tests/taxes.spec.ts` - CF1

---

### 3. ⏱️ Timeout Errors

**Error Típico:**
```
TimeoutError: waiting for locator(...) to be visible
```

**Causas Posibles:**
1. Selector incorrecto o elemento no existe
2. Animación/transición de MUI aún en progreso
3. Backend lento respondiendo
4. Drawer/Dialog no se abrió correctamente

**Solución por Caso:**

#### A. Selectores de Drawer (Sidebar)
```typescript
// Esperar a que el Drawer esté completamente visible
await this.page.getByRole('button', { name: 'Módulo' }).click();
await this.page.waitForSelector('[role="presentation"]', { 
  state: 'visible' 
});
```

#### B. Formularios en Dialogs
```typescript
// Esperar apertura completa del dialog
await this.page.getByRole('button', { name: 'Nuevo' }).click();
await this.page.waitForSelector('[role="dialog"]', { 
  state: 'visible',
  timeout: 10000
});
```

#### C. Operaciones del Backend
```typescript
// Aumentar timeout en operaciones costosas
await this.clickButton('Facturar');
await this.page.waitForSelector('.success-message', { 
  timeout: 30000  // Facturación puede tomar tiempo
});
```

---

### 4. 🚫 Assertion Failures en Formularios

**Error Típico:**
```
Error: expect(received).toBe(expected)
Expected: "Valor esperado"
Received: ""
```

**Causa Raíz:**
- Campo no se llenó correctamente
- Input no tuvo foco
- Valor se limpió por validación

**Solución:**
```typescript
// Asegurar foco y valores con triple verificación
async fillField(label: string, value: string) {
  const input = this.page.getByLabel(label);
  await input.click();              // Dar foco
  await input.clear();              // Limpiar valor anterior
  await input.fill(value);          // Llenar
  await expect(input).toHaveValue(value);  // Verificar
}
```

---

### 5. 📸 Skipped Tests (Descarga PDF)

**Tests Skipped:**
- `invoices.spec.ts › CF2: Descarga exitosa del PDF`
- `invoices.spec.ts › CF3: Descarga de PDF con error`

**Razón:**
```typescript
test.skip('CF2: Descarga exitosa del PDF', async ({ page }) => {
  // Backend no implementado aún
});
```

**Próximos Pasos:**
- [ ] Implementar endpoint de descarga PDF en backend
- [ ] Actualizar tests con lógica de descarga
- [ ] Verificar archivo descargado existe

**Implementación Sugerida:**
```typescript
test('CF2: Descarga exitosa del PDF', async ({ page }) => {
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Descargar PDF' }).click()
  ]);
  
  const fileName = await download.suggestedFilename();
  expect(fileName).toMatch(/factura.*\.pdf/i);
  
  const path = await download.path();
  expect(fs.existsSync(path)).toBeTruthy();
});
```

---

## 🎯 Plan de Acción Prioritario

### 🔥 Alta Prioridad (Arregla ~80% de fallos)

1. **Aplicar patrón de IDs únicos a todos los CF1**
   - supply-points, readings, conversion-factors, taxes, tariffs
   - Archivos: `e2e/utils/test-data.ts` + specs

2. **Actualizar isRowVisible() en todos los POs**
   - supply-points.po.ts, readings.po.ts, conversion-factors.po.ts, taxes.po.ts
   - Copiar implementación de tariffs.po.ts

3. **Agregar waits explícitos después de operaciones CRUD**
   ```typescript
   await this.clickSave();
   await this.page.waitForLoadState('networkidle');
   await this.waitForProgressBar();
   ```

### ⚡ Media Prioridad

4. **Aumentar timeouts selectivamente**
   - Facturación: 30s
   - operaciones de BD: 10s
   - Navegación: 15s (ya configurado)

5. **Mejorar manejo de errores en Page Objects**
   ```typescript
   async clickSave() {
     try {
       await this.saveButton.click();
       await this.page.waitForLoadState('networkidle');
     } catch (error) {
       throw new Error(`Failed to save: ${error.message}`);
     }
   }
   ```

### 🔮 Baja Prioridad (Mejoras Futuras)

6. **Implementar cleanup fixtures**
   ```typescript
   // In base.fixture.ts
   afterEach(async ({ page }) => {
     // Cleanup created data
     await cleanupTestData();
   });
   ```

7. **Agregar retry logic personalizado**
   ```typescript
   test('CF1: Alta exitosa', async ({ page }) => {
     await test.step('Navigate', async () => {
       // Navigation
     });
     
     await test.step('Create entity', async () => {
       // Creation - will retry only this step if fails
     });
   });
   ```

---

## 📊 Estadísticas de Fallo (Ejecución Reciente)

**Total Tests:** 96 (32 tests × 3 browsers)
**Passed:** ~67
**Failed:** ~23
**Skipped:** 6

**Módulos con Más Fallos:**
1. Gestión de Lecturas - 12 fallos (CF1, CF3, CT1 × 3 browsers)
2. Gestión de Puntos de Suministro - 9 fallos
3. Gestión de Factores de Conversión - 3 fallos
4. Gestión de Impuestos - 3 fallos

**Navegadores:**
- Todos los navegadores (Chromium, Firefox, WebKit) fallan similarmente
- Indica que los errores son lógicos, no específicos del browser

---

## 🛠️ Herramientas de Debugging

### 1. Modo Headed (Ver Browser)
```powershell
npx playwright test [spec-file] --headed
```

### 2. Modo UI (Interactivo)
```powershell
npm run test:e2e:ui
```

### 3. Debug Específico
```typescript
// En el test, agregar:
await page.pause();  // Pausa ejecución para inspección manual
```

### 4. Trace Viewer
```powershell
# Después de un fallo, abrir trace
npx playwright show-trace test-results/[test-name]/trace.zip
```

### 5. Screenshots en Cada Paso
```typescript
// En playwright.config.ts, cambiar:
use: {
  screenshot: 'on',  // En lugar de 'only-on-failure'
}
```

---

## 📚 Referencias

- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Auto-waiting in Playwright](https://playwright.dev/docs/actionability)
- [Debugging Tests](https://playwright.dev/docs/debug)
- [Test Fixtures](https://playwright.dev/docs/test-fixtures)
- [Page Object Model](https://playwright.dev/docs/pom)
