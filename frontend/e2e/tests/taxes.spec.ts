/**
 * E2E – Gestión de Impuestos (IVA)
 *
 * Cubre los siguientes casos del documento funcional:
 *  CF1  – Alta exitosa de un impuesto
 *  CF2  – Alta con tasa fuera de valores permitidos
 *  CT1  – Navegación entre listado y formulario
 */

import { test, expect, nav } from '../fixtures/base';

test.describe('Gestión de Impuestos (IVA)', () => {

  // ---------------------------------------------------------------------------
  // CF1 – Alta exitosa
  // ---------------------------------------------------------------------------
  test('CF1 – alta exitosa con código y tasa válidos', async ({ page }) => {
    await page.goto('/');
    await nav(page).toTaxes();

    await expect(page.getByRole('grid')).toBeVisible();

    // Abrir formulario
    await page.getByRole('button', { name: /nuevo/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // Rellenar campos:
    // taxCode label: "Código impuesto es requerido" → buscar por placeholder/label
    await page.getByLabel(/código impuesto|taxcode/i).fill('IVA_TEST');
    // taxRate: debe ser decimal [0,1]
    await page.getByLabel(/tasa|taxrate/i).fill('0.21');
    // vigenciaDesde
    await page.getByLabel(/vigencia/i).fill('2024-06-01');

    await page.getByRole('button', { name: /guardar/i }).click();

    // El diálogo se cierra y el nuevo código aparece
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('grid')).toContainText('IVA_TEST');
  });

  // ---------------------------------------------------------------------------
  // CF2 – Tasa fuera de rango
  // ---------------------------------------------------------------------------
  test('CF2 – alta con tasa fuera de rango [0,1] muestra error', async ({ page }) => {
    await page.goto('/');
    await nav(page).toTaxes();

    await page.getByRole('button', { name: /nuevo/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    await page.getByLabel(/código impuesto|taxcode/i).fill('IVA_ERR');
    await page.getByLabel(/tasa|taxrate/i).fill('150'); // fuera de rango (debe ser 0-1)
    await page.getByLabel(/vigencia/i).fill('2024-06-01');

    await page.getByRole('button', { name: /guardar/i }).click();

    // Permanece abierto con error de validación
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(
      page.getByText(/debe ser un decimal en \[0, 1\]|rango|valor inválido/i)
    ).toBeVisible({ timeout: 3000 });
  });

  // ---------------------------------------------------------------------------
  // CT1 – Navegación
  // ---------------------------------------------------------------------------
  test('CT1 – navegación fluida listado ↔ formulario de nuevo impuesto', async ({ page }) => {
    await page.goto('/');
    await nav(page).toTaxes();

    const start = Date.now();
    await page.getByRole('button', { name: /nuevo/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    expect(Date.now() - start).toBeLessThan(2000);

    await page.getByRole('button', { name: /cancelar/i }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect(page.getByRole('grid')).toBeVisible();
  });
});
