/**
 * E2E – Gestión de Factores de Conversión
 *
 * Cubre los siguientes casos del documento funcional:
 *  CF1  – Alta exitosa de un factor de conversión
 *  CF2  – Alta con datos fuera de rango (CoefConv negativo)
 *  CT1  – Navegación entre listado y formulario
 */

import { test, expect, nav } from '../fixtures/base';

test.describe('Gestión de Factores de Conversión', () => {

  // ---------------------------------------------------------------------------
  // CF1 – Alta exitosa
  // ---------------------------------------------------------------------------
  test('CF1 – alta exitosa con datos válidos', async ({ page }) => {
    await page.goto('/');
    await nav(page).toConversionFactors();

    await expect(page.getByRole('grid')).toBeVisible();

    // Abrir formulario
    await page.getByRole('button', { name: /nuevo/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('heading', { name: /nuevo factor/i })).toBeVisible();

    // Rellenar
    await page.getByLabel(/zona/i).fill('ZONA_TEST');
    await page.getByLabel(/mes/i).fill('2024-06');
    await page.getByLabel(/coef/i).fill('1.05');
    await page.getByLabel(/pcs/i).fill('10.5');

    await page.getByRole('button', { name: /guardar/i }).click();

    // El diálogo debe cerrarse
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 });
    // Nuevo registro visible
    await expect(page.getByRole('grid')).toContainText('ZONA_TEST');
  });

  // ---------------------------------------------------------------------------
  // CF2 – Datos fuera de rango
  // ---------------------------------------------------------------------------
  test('CF2 – alta con CoefConv ≤ 0 muestra error de validación', async ({ page }) => {
    await page.goto('/');
    await nav(page).toConversionFactors();

    await page.getByRole('button', { name: /nuevo/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    await page.getByLabel(/zona/i).fill('ZONA_ERR');
    await page.getByLabel(/mes/i).fill('2024-07');
    await page.getByLabel(/coef/i).fill('-1');   // fuera de rango
    await page.getByLabel(/pcs/i).fill('10.5');

    await page.getByRole('button', { name: /guardar/i }).click();

    // Permanece abierto con error
    await expect(page.getByRole('dialog')).toBeVisible();
    const errors = page.locator('[role="dialog"] .MuiFormHelperText-root');
    await expect(errors.first()).toBeVisible({ timeout: 3000 });
  });

  // ---------------------------------------------------------------------------
  // CT1 – Navegación
  // ---------------------------------------------------------------------------
  test('CT1 – navegación fluida listado ↔ formulario de nuevo factor', async ({ page }) => {
    await page.goto('/');
    await nav(page).toConversionFactors();

    const start = Date.now();
    await page.getByRole('button', { name: /nuevo/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    expect(Date.now() - start).toBeLessThan(2000);

    await page.getByRole('button', { name: /cancelar/i }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect(page.getByRole('grid')).toBeVisible();
  });
});
