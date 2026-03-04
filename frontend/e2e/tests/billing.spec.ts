import { test, expect } from '../fixtures/base.fixture';
import type { Page } from '@playwright/test';
import { installMockApi, type MockApiOptions } from '../helpers/mockApi';
import { goToModule, openApp } from '../helpers/navigation';

async function openBilling(page: Page, options?: MockApiOptions) {
  await installMockApi(page, options);
  await openApp(page);
  await goToModule(page, 'Facturación');
}

test.describe('Facturación', () => {
  test('BL-FUNC-01 ejecución exitosa', async ({ page }) => {
    await openBilling(page);
    await page.getByLabel('Periodo (YYYY-MM)').fill('2024-06');
    await page.getByRole('button', { name: 'Ejecutar Facturación' }).click();

    await expect(page.getByText('Resultado para el periodo 2024-06')).toBeVisible();
    await expect(page.getByText('Facturación completada sin errores. Ve a Facturas para ver el resultado.')).toBeVisible();
  });

  test('BL-FUNC-02 ejecución con datos incompletos', async ({ page }) => {
    await openBilling(page, {
      billingForcedErrors: [{ cups: 'ES1234567890123456', error: 'Faltan lecturas o tarifas' }],
    });
    await page.getByLabel('Periodo (YYYY-MM)').fill('2024-06');
    await page.getByRole('button', { name: 'Ejecutar Facturación' }).click();

    await expect(page.getByText('CUPS con errores de facturación')).toBeVisible();
    await expect(page.getByRole('grid')).toContainText('Faltan lecturas o tarifas');
  });

  test('BL-NF-01 rendimiento con volumen alto (<30s)', async ({ page }) => {
    const manyReadings = Array.from({ length: 10000 }, (_, idx) => ({
      id: idx + 1,
      cups: 'ES1234567890123456',
      fecha: '2024-06-01',
      lecturaM3: 1000 + idx,
      tipo: 'REAL' as const,
    }));

    await openBilling(page, {
      seed: { readings: manyReadings },
    });

    await page.getByLabel('Periodo (YYYY-MM)').fill('2024-06');
    const start = Date.now();
    await page.getByRole('button', { name: 'Ejecutar Facturación' }).click();
    await expect(page.getByText('Resultado para el periodo 2024-06')).toBeVisible();
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(30_000);
  });

  test('BL-FUNC-03 integración entre módulos y cálculo visible en facturas', async ({ page }) => {
    await openBilling(page);
    await page.getByLabel('Periodo (YYYY-MM)').fill('2024-06');
    await page.getByRole('button', { name: 'Ejecutar Facturación' }).click();
    await expect(page.getByText('Resultado para el periodo 2024-06')).toBeVisible();

    await goToModule(page, 'Facturas');
    await expect(page.getByRole('grid')).toContainText('F-202406-3456');
    await expect(page.getByRole('grid')).toContainText('ES1234567890123456');
  });

  test('BL-TRANS-01 navegación entre ejecución y resultados', async ({ page }) => {
    await openBilling(page, {
      billingForcedErrors: [{ cups: 'ES1234567890123456', error: 'Error de prueba' }],
    });

    await page.getByLabel('Periodo (YYYY-MM)').fill('2024-06');
    await page.getByRole('button', { name: 'Ejecutar Facturación' }).click();

    await expect(page.getByText('Resultado para el periodo 2024-06')).toBeVisible();
    await expect(page.getByText('CUPS con errores de facturación')).toBeVisible();
  });
});
