import { test, expect } from '../fixtures/base.fixture';
import { installMockApi } from '../helpers/mockApi';
import { cancelDialog, goToModule, openApp, saveDialog } from '../helpers/navigation';

test.describe('Impuestos', () => {
  test.beforeEach(async ({ page }) => {
    await installMockApi(page);
    await openApp(page);
    await goToModule(page, 'Impuestos (IVA)');
  });

  test('TX-FUNC-01 alta exitosa de impuesto', async ({ page }) => {
    await page.getByRole('button', { name: 'Nuevo Impuesto' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Código').fill('IVA10');
    await dialog.getByLabel('Tasa (0 a 1)').fill('0.10');
    await dialog.getByLabel('Vigencia Desde (YYYY-MM-DD)').fill('2024-06-01');
    await saveDialog(page);

    await expect(page.getByText('Impuesto creado')).toBeVisible();
    await expect(page.getByRole('grid')).toContainText('IVA10');
  });

  test('TX-FUNC-02 tasa fuera de rango', async ({ page }) => {
    await page.getByRole('button', { name: 'Nuevo Impuesto' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Código').fill('IVAX');
    await dialog.getByLabel('Tasa (0 a 1)').fill('1.50');
    await dialog.getByLabel('Vigencia Desde (YYYY-MM-DD)').fill('2024-06-01');
    await saveDialog(page);

    await expect(page.getByText('Debe ser un decimal en [0, 1] (ej: 0.21)')).toBeVisible();
  });

  test('TX-TRANS-01 navegación listado-formulario', async ({ page }) => {
    await page.getByRole('button', { name: 'Nuevo Impuesto' }).click();
    await expect(page.getByRole('dialog')).toContainText('Nuevo Impuesto');
    await cancelDialog(page);
    await expect(page.getByRole('dialog')).toBeHidden();
    await expect(page.getByRole('grid')).toBeVisible();
  });
});
