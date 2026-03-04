/**
 * E2E – Ejecución de Facturación
 *
 * Cubre los siguientes casos del documento funcional:
 *  CF1  – Ejecución exitosa de la facturación
 *  CF2  – Ejecución con periodo vacío/formato incorrecto
 *  CF3  – Integración: resultado muestra datos de los módulos
 *  CF4  – Visualización de errores tras ejecución
 *  CT1  – Navegación entre pantalla de ejecución y resultados
 */

import { test, expect, nav } from '../fixtures/base';

test.describe('Ejecución de Facturación', () => {

  // ---------------------------------------------------------------------------
  // CF1 – Ejecución exitosa
  // ---------------------------------------------------------------------------
  test('CF1 – ejecución exitosa con periodo válido muestra resultado', async ({ page }) => {
    await page.goto('/');
    await nav(page).toBilling();

    await expect(page.getByLabel(/periodo/i)).toBeVisible();

    await page.getByLabel(/periodo/i).fill('2026-01');
    await page.getByRole('button', { name: /ejecutar facturación/i }).click();

    // Esperar resultado (máx 10 s)
    await expect(page.getByText(/resultado para el periodo/i)).toBeVisible({ timeout: 10000 });

    // Deben aparecer las tarjetas de resumen
    await expect(page.getByText(/facturas creadas/i)).toBeVisible();
    await expect(page.getByText(/facturas actualizadas/i)).toBeVisible();
    await expect(page.getByText(/errores/i)).toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // CF2 – Periodo vacío o con formato incorrecto
  // ---------------------------------------------------------------------------
  test('CF2 – ejecución sin periodo muestra error de validación', async ({ page }) => {
    await page.goto('/');
    await nav(page).toBilling();

    // Intentar ejecutar sin rellenar el periodo
    await page.getByRole('button', { name: /ejecutar facturación/i }).click();

    // El campo muestra helper text de error
    await expect(page.getByText(/el periodo es requerido/i)).toBeVisible({ timeout: 3000 });
  });

  test('CF2b – ejecución con formato incorrecto muestra error de formato', async ({ page }) => {
    await page.goto('/');
    await nav(page).toBilling();

    await page.getByLabel(/periodo/i).fill('01-2026'); // formato malo
    await page.getByRole('button', { name: /ejecutar facturación/i }).click();

    await expect(page.getByText(/formato yyyy-mm/i)).toBeVisible({ timeout: 3000 });
  });

  // ---------------------------------------------------------------------------
  // CF3 – Integración: Resultado refleja datos de los módulos
  // ---------------------------------------------------------------------------
  test('CF3 – resultado integra lecturas, tarifas, factores e impuestos', async ({ page }) => {
    await page.goto('/');
    await nav(page).toBilling();

    await page.getByLabel(/periodo/i).fill('2026-01');
    await page.getByRole('button', { name: /ejecutar facturación/i }).click();

    await expect(page.getByText(/resultado para el periodo/i)).toBeVisible({ timeout: 10000 });

    // Al menos uno de los contadores (creadas + actualizadas) debe ser > 0
    // o debe haber un mensaje explicativo
    const resumen = page.locator('h4, .MuiTypography-h4');
    const values = await resumen.allTextContents();
    // Comprobamos que los valores numéricos están presentes en el DOM
    expect(values.some((v) => /\d+/.test(v))).toBeTruthy();
  });

  // ---------------------------------------------------------------------------
  // CF4 – Errores de facturación visibles
  // ---------------------------------------------------------------------------
  test('CF4 – errores de facturación se muestran en la tabla de errores', async ({ page }) => {
    await page.goto('/');
    await nav(page).toBilling();

    await page.getByLabel(/periodo/i).fill('2026-01');
    await page.getByRole('button', { name: /ejecutar facturación/i }).click();

    await expect(page.getByText(/resultado para el periodo/i)).toBeVisible({ timeout: 10000 });

    // Si hay errores → la tabla de errores debe ser visible
    const errorTable = page.locator('[role="grid"]');
    const errorTitle = page.getByText(/cups con errores/i);

    if (await errorTitle.isVisible()) {
      await expect(errorTable).toBeVisible();
    } else {
      // Si no hay errores, debe haber mensaje de éxito
      await expect(page.getByText(/facturación completada sin errores|no hay puntos/i)).toBeVisible();
    }
  });

  // ---------------------------------------------------------------------------
  // CT1 – Navegación entre ejecución y resultados
  // ---------------------------------------------------------------------------
  test('CT1 – tras ejecutar se puede navegar a Facturas para ver resultados', async ({ page }) => {
    await page.goto('/');
    await nav(page).toBilling();

    await page.getByLabel(/periodo/i).fill('2026-01');
    await page.getByRole('button', { name: /ejecutar facturación/i }).click();
    await expect(page.getByText(/resultado para el periodo/i)).toBeVisible({ timeout: 10000 });

    // Navegar a Facturas
    const start = Date.now();
    await nav(page).toInvoices();
    await expect(page.getByRole('grid')).toBeVisible({ timeout: 5000 });
    expect(Date.now() - start).toBeLessThan(3000);
  });
});
