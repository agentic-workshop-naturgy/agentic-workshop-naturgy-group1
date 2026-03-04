/**
 * E2E – Gestión de Lecturas
 *
 * Cubre los siguientes casos del documento funcional:
 *  CF1  – Alta exitosa de una lectura
 *  CF2  – Alta con combinación CUPS+Fecha duplicada
 *  CF3  – Edición de una lectura
 *  CT1  – Eliminación con confirmación
 *  CT2  – Navegación entre listado y formulario
 */

import { test, expect, nav } from '../fixtures/base';

const CUPS_VALID = 'ES0000000000000001'; // CUPS del seed de lecturas
const FECHA_NEW  = '2026-06-01';
const FECHA_DUP  = '2026-01-31'; // fecha que existe en el seed junto al CUPS anterior

test.describe('Gestión de Lecturas', () => {

  // ---------------------------------------------------------------------------
  // CF1 – Alta exitosa
  // ---------------------------------------------------------------------------
  test('CF1 – alta exitosa de una lectura', async ({ page }) => {
    await page.goto('/');
    await nav(page).toReadings();

    await expect(page.getByRole('grid')).toBeVisible();

    // Abrir formulario
    await page.getByRole('button', { name: /^nueva$/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('heading', { name: /nueva lectura/i })).toBeVisible();

    // Para obtener un CUPS válido usamos el primero del grid
    const cupsCell = page.locator('[role="row"]:not([aria-rowindex="1"]) [role="gridcell"]:nth-child(2)').first();
    const cups = (await cupsCell.textContent())?.trim() || CUPS_VALID;

    await page.getByLabel(/^cups$/i).fill(cups);
    await page.getByLabel(/fecha/i).fill(FECHA_NEW);
    await page.getByLabel(/lectura/i).fill('1500');

    await page.getByRole('button', { name: /guardar/i }).click();

    // Éxito
    await expect(page.getByText(/lectura creada/i)).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect(page.getByRole('grid')).toContainText(FECHA_NEW);
  });

  // ---------------------------------------------------------------------------
  // CF2 – CUPS+Fecha duplicada
  // ---------------------------------------------------------------------------
  test('CF2 – alta con CUPS+Fecha duplicada muestra error', async ({ page }) => {
    await page.goto('/');
    await nav(page).toReadings();

    await expect(page.getByRole('grid')).toBeVisible();

    // Tomar el CUPS y la Fecha de la primera lectura ya existente
    const cupsCell = page.locator('[role="row"]:not([aria-rowindex="1"]) [role="gridcell"]:nth-child(2)').first();
    const fechaCell = page.locator('[role="row"]:not([aria-rowindex="1"]) [role="gridcell"]:nth-child(3)').first();
    const cups  = (await cupsCell.textContent())?.trim()  || CUPS_VALID;
    const fecha = (await fechaCell.textContent())?.trim() || FECHA_DUP;

    await page.getByRole('button', { name: /^nueva$/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    await page.getByLabel(/^cups$/i).fill(cups);
    await page.getByLabel(/fecha/i).fill(fecha);
    await page.getByLabel(/lectura/i).fill('9999');

    await page.getByRole('button', { name: /guardar/i }).click();

    // El diálogo permanece abierto y hay un error visible
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });
    const errors = await page.locator('[role="dialog"] .MuiAlert-root, [role="dialog"] .MuiFormHelperText-root').count();
    expect(errors).toBeGreaterThan(0);
  });

  // ---------------------------------------------------------------------------
  // CF3 – Edición
  // ---------------------------------------------------------------------------
  test('CF3 – edición de una lectura actualiza el valor', async ({ page }) => {
    await page.goto('/');
    await nav(page).toReadings();

    await expect(page.getByRole('grid')).toBeVisible();

    // Clic en el primer botón de editar
    await page.locator('[role="row"]:not([aria-rowindex="1"])').first()
      .getByRole('button').nth(0).click();

    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('heading', { name: /editar lectura/i })).toBeVisible();

    const lecturaInput = page.getByLabel(/lectura/i);
    await lecturaInput.clear();
    await lecturaInput.fill('1600');

    await page.getByRole('button', { name: /guardar/i }).click();

    await expect(page.getByText(/lectura actualizada/i)).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // CT1 – Eliminación con confirmación
  // ---------------------------------------------------------------------------
  test('CT1 – eliminación solicita confirmación y elimina la lectura', async ({ page }) => {
    await page.goto('/');
    await nav(page).toReadings();

    await expect(page.getByRole('grid')).toBeVisible();
    const rowsBefore = await page.locator('[role="row"]:not([aria-rowindex="1"])').count();

    // Botón eliminar (índice 1 en los action buttons)
    await page.locator('[role="row"]:not([aria-rowindex="1"])').first()
      .getByRole('button').nth(1).click();

    // Diálogo de confirmación
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByRole('button', { name: /^eliminar$/i }).click();

    await expect(page.getByText(/lectura eliminada/i)).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[role="row"]:not([aria-rowindex="1"])')).toHaveCount(rowsBefore - 1, { timeout: 5000 });
  });

  // ---------------------------------------------------------------------------
  // CT2 – Navegación
  // ---------------------------------------------------------------------------
  test('CT2 – navegación fluida entre listado y formulario', async ({ page }) => {
    await page.goto('/');
    await nav(page).toReadings();

    const start = Date.now();
    await page.getByRole('button', { name: /^nueva$/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    expect(Date.now() - start).toBeLessThan(2000);

    await page.getByRole('button', { name: /cancelar/i }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect(page.getByRole('grid')).toBeVisible();
  });
});
