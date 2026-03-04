/**
 * E2E smoke test – verifica que la aplicación carga y
 * los elementos de navegación principal son visibles en el sidebar.
 */

import { test, expect, nav } from '../fixtures/base';

test.describe('Smoke – carga de la aplicación', () => {
  test('la página de inicio carga sin errores', async ({ page }) => {
    await page.goto('/');
    await expect(page).not.toHaveTitle(/error/i);
    await expect(page.locator('body')).toBeVisible();
  });

  test('sidebar muestra todos los módulos de navegación', async ({ page }) => {
    await page.goto('/');

    const navLabels = [
      /dashboard/i,
      /puntos de suministro/i,
      /lecturas/i,
      /tarifario/i,
      /factores conversión/i,
      /impuestos \(iva\)/i,
      /^facturación$/i,
      /^facturas$/i,
    ];

    for (const label of navLabels) {
      await expect(page.getByRole('button', { name: label })).toBeVisible();
    }
  });

  test('navegar a cada módulo no provoca errores visibles', async ({ page }) => {
    await page.goto('/');

    const navigations = [
      () => nav(page).toSupplyPoints(),
      () => nav(page).toReadings(),
      () => nav(page).toTariffs(),
      () => nav(page).toConversionFactors(),
      () => nav(page).toTaxes(),
      () => nav(page).toBilling(),
      () => nav(page).toInvoices(),
    ];

    for (const go of navigations) {
      await go();
      await expect(page.getByText(/something went wrong|uncaught/i)).not.toBeVisible();
    }
  });
});
