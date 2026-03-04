/**
 * E2E – Gestión de Tarifario
 *
 * Cubre los siguientes casos del documento funcional:
 *  CF1  – Alta exitosa de una tarifa
 *  CF2  – Alta con campos obligatorios vacíos
 *  CT1  – Navegación entre listado y formulario
 */

import { test, expect, nav } from '../fixtures/base';

test.describe('Gestión de Tarifario', () => {

  // ---------------------------------------------------------------------------
  // CF1 – Alta exitosa
  // ---------------------------------------------------------------------------
  test('CF1 – alta exitosa de una tarifa con datos válidos', async ({ page }) => {
    await page.goto('/');
    await nav(page).toTariffs();

    await expect(page.getByRole('grid')).toBeVisible();

    // Abrir formulario de alta
    await page.getByRole('button', { name: /nuevo/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('heading', { name: /nueva tarifa/i })).toBeVisible();

    // Rellenar campos
    await page.getByLabel(/tarifa|código/i).first().fill('T_TEST_01');
    await page.getByLabel(/fijo/i).fill('10');
    await page.getByLabel(/variable/i).fill('0.15');
    await page.getByLabel(/vigencia/i).fill('2024-06-01');

    await page.getByRole('button', { name: /guardar/i }).click();

    // Éxito
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('grid')).toContainText('T_TEST_01');
  });

  // ---------------------------------------------------------------------------
  // CF2 – Campos obligatorios vacíos
  // ---------------------------------------------------------------------------
  test('CF2 – alta con campos vacíos muestra errores de validación', async ({ page }) => {
    await page.goto('/');
    await nav(page).toTariffs();

    await page.getByRole('button', { name: /nuevo/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // Intentar guardar sin rellenar nada
    await page.getByRole('button', { name: /guardar/i }).click();

    // El diálogo permanece abierto y hay mensajes de error
    await expect(page.getByRole('dialog')).toBeVisible();
    const errorMessages = page.locator('[role="dialog"] .MuiFormHelperText-root');
    await expect(errorMessages.first()).toBeVisible({ timeout: 3000 });
    expect(await errorMessages.count()).toBeGreaterThan(0);
  });

  // ---------------------------------------------------------------------------
  // CT1 – Navegación
  // ---------------------------------------------------------------------------
  test('CT1 – navegación fluida listado ↔ formulario de nueva tarifa', async ({ page }) => {
    await page.goto('/');
    await nav(page).toTariffs();

    const start = Date.now();
    await page.getByRole('button', { name: /nuevo/i }).click();

    await expect(page.getByRole('dialog')).toBeVisible();
    expect(Date.now() - start).toBeLessThan(2000);

    await page.getByRole('button', { name: /cancelar/i }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect(page.getByRole('grid')).toBeVisible();
  });
});
