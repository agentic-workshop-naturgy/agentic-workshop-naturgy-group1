import { test, expect } from '../fixtures/base.fixture';
import { installMockApi } from '../helpers/mockApi';
import { cancelDialog, goToModule, openApp, saveDialog } from '../helpers/navigation';

test.describe('Factores de Conversión', () => {
  test.beforeEach(async ({ page }) => {
    await installMockApi(page);
    await openApp(page);
    await goToModule(page, /Factores Conversión|Factores de Conversión/);
  });

  test('FC-FUNC-01 alta exitosa de factor', async ({ page }) => {
    await page.getByRole('button', { name: 'Nuevo Factor' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Zona').fill('Centro');
    await dialog.getByLabel('Mes (YYYY-MM)').fill('2024-07');
    await dialog.getByLabel('Coeficiente Conv.').fill('1.05');
    await dialog.getByLabel('PCS (kWh/m³)').fill('10.5');
    await saveDialog(page);

    await expect(page.getByText('Factor creado')).toBeVisible();
    await expect(page.getByRole('grid')).toContainText('2024-07');
  });

  test('FC-FUNC-02 alta con datos fuera de rango', async ({ page }) => {
    await page.getByRole('button', { name: 'Nuevo Factor' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Zona').fill('Centro');
    await dialog.getByLabel('Mes (YYYY-MM)').fill('2024-07');
    await dialog.getByLabel('Coeficiente Conv.').fill('-1');
    await dialog.getByLabel('PCS (kWh/m³)').fill('1000');
    await saveDialog(page);

    await expect(page.getByText('Debe ser > 0')).toBeVisible();
  });

  test('FC-TRANS-01 navegación listado-formulario', async ({ page }) => {
    await page.getByRole('button', { name: 'Nuevo Factor' }).click();
    await expect(page.getByRole('dialog')).toContainText('Nuevo Factor de Conversión');
    await cancelDialog(page);
    await expect(page.getByRole('dialog')).toBeHidden();
    await expect(page.getByRole('grid')).toBeVisible();
  });
});
