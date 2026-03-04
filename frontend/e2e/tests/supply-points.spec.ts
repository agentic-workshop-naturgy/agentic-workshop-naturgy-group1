import { test, expect } from '../fixtures/base.fixture';
import { installMockApi } from '../helpers/mockApi';
import { cancelDialog, confirmDelete, openApp, saveDialog } from '../helpers/navigation';

test.describe('Puntos de Suministro', () => {
  test.beforeEach(async ({ page }) => {
    await installMockApi(page);
    await openApp(page);
  });

  test('SP-FUNC-01 alta exitosa', async ({ page }) => {
    await page.getByRole('button', { name: 'Nuevo' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('CUPS').fill('ES1234567890123499');
    await dialog.getByLabel('Zona').fill('Centro');
    await dialog.getByLabel('Tarifa').fill('T1');
    await saveDialog(page);

    await expect(page.getByText('Punto de suministro creado')).toBeVisible();
    await expect(page.getByRole('grid')).toContainText('ES1234567890123499');
  });

  test('SP-FUNC-02 alta con CUPS duplicado', async ({ page }) => {
    await page.getByRole('button', { name: 'Nuevo' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('CUPS').fill('ES1234567890123456');
    await dialog.getByLabel('Zona').fill('Centro');
    await dialog.getByLabel('Tarifa').fill('T1');
    await saveDialog(page);

    await expect(page.getByRole('alert')).toContainText('El CUPS ya existe');
  });

  test('SP-FUNC-03 edición de tarifa', async ({ page }) => {
    await page.getByLabel('editar').first().click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Tarifa').fill('T2');
    await saveDialog(page);

    await expect(page.getByText('Punto de suministro actualizado')).toBeVisible();
    await expect(page.getByRole('grid')).toContainText('T2');
  });

  test('SP-TRANS-01 eliminación con confirmación', async ({ page }) => {
    await page.getByLabel('eliminar').first().click();
    await expect(page.getByRole('dialog')).toContainText('Eliminar Punto de Suministro');
    await confirmDelete(page);

    await expect(page.getByText('Punto de suministro eliminado')).toBeVisible();
    await expect(page.getByRole('grid')).not.toContainText('ES1234567890123456');
  });

  test('SP-TRANS-02 navegación listado-formulario', async ({ page }) => {
    await page.getByRole('button', { name: 'Nuevo' }).click();
    await expect(page.getByRole('dialog')).toContainText('Nuevo Punto de Suministro');
    await cancelDialog(page);
    await expect(page.getByRole('dialog')).toBeHidden();
    await expect(page.getByRole('grid')).toBeVisible();
  });
});
