import { test, expect } from '../fixtures/base.fixture';
import { installMockApi } from '../helpers/mockApi';
import { cancelDialog, goToModule, openApp, saveDialog } from '../helpers/navigation';

test.describe('Tarifario', () => {
  test.beforeEach(async ({ page }) => {
    await installMockApi(page);
    await openApp(page);
    await goToModule(page, 'Tarifario');
  });

  test('TF-FUNC-01 alta exitosa de tarifa', async ({ page }) => {
    await page.getByRole('button', { name: 'Nueva Tarifa' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Código Tarifa').fill('T3');
    await dialog.getByLabel('Término Fijo (€/mes)').fill('10');
    await dialog.getByLabel('Término Variable (€/kWh)').fill('0.15');
    await dialog.getByLabel('Vigencia Desde (YYYY-MM-DD)').fill('2024-06-01');
    await saveDialog(page);

    await expect(page.getByText('Tarifa creada')).toBeVisible();
    await expect(page.getByRole('grid')).toContainText('T3');
  });

  test('TF-FUNC-02 validación de obligatorios vacíos', async ({ page }) => {
    await page.getByRole('button', { name: 'Nueva Tarifa' }).click();
    await saveDialog(page);

    await expect(page.getByText('Código tarifa es requerido')).toBeVisible();
    await expect(page.getByText('Requerido').first()).toBeVisible();
  });

  test('TF-TRANS-01 navegación listado-formulario', async ({ page }) => {
    await page.getByRole('button', { name: 'Nueva Tarifa' }).click();
    await expect(page.getByRole('dialog')).toContainText('Nueva Tarifa');
    await cancelDialog(page);
    await expect(page.getByRole('dialog')).toBeHidden();
    await expect(page.getByRole('grid')).toBeVisible();
  });
});
