import { test, expect } from '../fixtures/base.fixture';
import { installMockApi } from '../helpers/mockApi';
import { goToModule, openApp, saveDialog } from '../helpers/navigation';

test.describe('Comportamiento general', () => {
  test.beforeEach(async ({ page }) => {
    await installMockApi(page);
    await openApp(page);
  });

  test('GN-FUNC-01 mensajes de error y éxito en tiempo real', async ({ page }) => {
    await page.getByRole('button', { name: 'Nuevo' }).click();
    const dialog = page.getByRole('dialog');
    await saveDialog(page);

    await expect(page.getByText('CUPS es requerido')).toBeVisible();
    await expect(page.getByText('Zona es requerida')).toBeVisible();
    await expect(page.getByText('Tarifa es requerida')).toBeVisible();

    await dialog.getByLabel('CUPS').fill('ES1234567890123490');
    await dialog.getByLabel('Zona').fill('Centro');
    await dialog.getByLabel('Tarifa').fill('T1');
    await saveDialog(page);

    await expect(page.getByText('Punto de suministro creado')).toBeVisible();
  });

  test('GN-FUNC-02 confirmación antes de acción destructiva', async ({ page }) => {
    await page.getByLabel('eliminar').first().click();
    await expect(page.getByRole('dialog')).toContainText('Eliminar Punto de Suministro');
    await page.getByRole('button', { name: 'Cancelar' }).click();

    await expect(page.getByRole('dialog')).toBeHidden();
    await expect(page.getByRole('grid')).toContainText('ES1234567890123456');
  });

  test('GN-TRANS-01 navegación fluida entre módulos (<2s por cambio)', async ({ page }) => {
    const modules: Array<{ nav: string; title: string }> = [
      { nav: 'Lecturas', title: 'Lecturas de Gas' },
      { nav: 'Tarifario', title: 'Tarifario' },
      { nav: 'Factores Conversión', title: 'Factores de Conversión' },
      { nav: 'Impuestos (IVA)', title: 'Impuestos (IVA)' },
      { nav: 'Facturación', title: 'Facturación' },
      { nav: 'Facturas', title: 'Facturas' },
    ];

    for (const module of modules) {
      const start = Date.now();
      await goToModule(page, module.nav);
      await expect(page.getByRole('heading', { level: 6, name: module.title })).toBeVisible();
      const elapsed = Date.now() - start;
      expect(elapsed).toBeLessThan(2_000);
    }
  });

  test('GN-FUNC-03 cambio de idioma visible en navegación', async ({ page }) => {
    await page.getByText('Español').click();
    await page.getByRole('menuitem', { name: 'English' }).click();
    await expect(page.getByRole('button', { name: 'Supply Points' })).toBeVisible();
  });
});
