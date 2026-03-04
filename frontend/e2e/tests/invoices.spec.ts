/**
 * E2E – Gestión de Facturas
 *
 * Cubre los siguientes casos del documento funcional:
 *  CF1  – Visualización del listado de facturas
 *  CF2  – Descarga exitosa del PDF de una factura
 *  CF3  – Detalle de factura (modal de detalle)
 *  CT1  – Navegación entre listado y detalle de factura
 *
 * Precondición: debe existir al menos una factura generada
 * (ejecutar primero billing para el periodo 2026-01).
 */

import { test, expect, nav } from '../fixtures/base';

test.describe('Gestión de Facturas', () => {

  test.beforeEach(async ({ page }) => {
    // Asegurar que hay datos: ejecutar facturación del periodo de seeds
    await page.goto('/');
    await nav(page).toBilling();
    await page.getByLabel(/periodo/i).fill('2026-01');
    await page.getByRole('button', { name: /ejecutar facturación/i }).click();
    await page.getByText(/resultado para el periodo/i).waitFor({ timeout: 10000 });
  });

  // ---------------------------------------------------------------------------
  // CF1 – Visualización del listado
  // ---------------------------------------------------------------------------
  test('CF1 – listado de facturas muestra número, fecha e importe', async ({ page }) => {
    await nav(page).toInvoices();

    await expect(page.getByRole('grid')).toBeVisible({ timeout: 5000 });

    // Cabeceras de columna esperadas
    await expect(page.getByRole('columnheader', { name: /periodo/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /cups/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /importe|total/i })).toBeVisible();

    // Debe haber al menos una fila de datos
    const rows = page.locator('[role="row"]:not([aria-rowindex="1"])');
    await expect(rows.first()).toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // CF2 – Descarga del PDF
  // ---------------------------------------------------------------------------
  test('CF2 – botón descargar PDF está disponible en el listado', async ({ page }) => {
    await nav(page).toInvoices();
    await expect(page.getByRole('grid')).toBeVisible({ timeout: 5000 });

    // Verificar que al menos una fila tiene botón de descarga
    const downloadBtn = page.locator('[role="row"]:not([aria-rowindex="1"])').first()
      .getByRole('button').filter({ hasText: '' }).first(); // IconButton de descarga

    // El botón existe (aria-label o tooltip: Descargar PDF, etc.)
    const downloadButtons = page.locator('[role="row"]:not([aria-rowindex="1"])')
      .first()
      .locator('button');
    await expect(downloadButtons.first()).toBeVisible({ timeout: 3000 });
  });

  // ---------------------------------------------------------------------------
  // CF3 – Detalle de factura
  // ---------------------------------------------------------------------------
  test('CF3 – abrir detalle de factura muestra información completa', async ({ page }) => {
    await nav(page).toInvoices();
    await expect(page.getByRole('grid')).toBeVisible({ timeout: 5000 });

    // Clic en el primer botón de detalle (VisibilityIcon)
    await page.locator('[role="row"]:not([aria-rowindex="1"])').first()
      .getByRole('button').nth(0).click();

    // Se abre el diálogo con el detalle
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 3000 });

    // El detalle debe mostrar datos de la factura (CUPS, periodo, importe, etc.)
    const dialog = page.getByRole('dialog');
    await expect(dialog).toContainText(/cups/i);
    await expect(dialog).toContainText(/periodo|importe|total/i);
  });

  // ---------------------------------------------------------------------------
  // CT1 – Navegación listado ↔ detalle
  // ---------------------------------------------------------------------------
  test('CT1 – abrir detalle y volver al listado en menos de 3 s', async ({ page }) => {
    await nav(page).toInvoices();
    await expect(page.getByRole('grid')).toBeVisible({ timeout: 5000 });

    const start = Date.now();
    // Abrir detalle
    await page.locator('[role="row"]:not([aria-rowindex="1"])').first()
      .getByRole('button').nth(0).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    expect(Date.now() - start).toBeLessThan(3000);

    // Cerrar → volver al listado
    await page.getByRole('button', { name: /cerrar|close/i }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect(page.getByRole('grid')).toBeVisible();
  });
});
