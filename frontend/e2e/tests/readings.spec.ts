import { test, expect } from '../fixtures/base.fixture';
import { installMockApi } from '../helpers/mockApi';
import { cancelDialog, confirmDelete, goToModule, openApp, saveDialog } from '../helpers/navigation';

test.describe('Lecturas', () => {
  test.beforeEach(async ({ page }) => {
    await installMockApi(page);
    await openApp(page);
    await goToModule(page, 'Lecturas');
  });

  test('RD-FUNC-01 alta exitosa de lectura', async ({ page }) => {
    await page.getByRole('button', { name: 'Nueva' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('CUPS').fill('ES1234567890123456');
    await dialog.getByLabel('Fecha').fill('2024-06-02');
    await dialog.getByLabel('Lectura (m³)').fill('1600');
    await saveDialog(page);

    await expect(page.getByText('Lectura creada')).toBeVisible();
    await expect(page.getByRole('grid')).toContainText('2024-06-02');
  });

  test('RD-FUNC-02 alta duplicada por CUPS+Fecha', async ({ page }) => {
    await page.getByRole('button', { name: 'Nueva' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('CUPS').fill('ES1234567890123456');
    await dialog.getByLabel('Fecha').fill('2024-06-01');
    await dialog.getByLabel('Lectura (m³)').fill('1500');
    await saveDialog(page);

    await expect(page.getByRole('alert')).toContainText('Ya existe una lectura para ese CUPS y fecha');
  });

  test('RD-FUNC-03 edición de lectura', async ({ page }) => {
    await page.getByLabel('editar').first().click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Lectura (m³)').fill('1600');
    await saveDialog(page);

    await expect(page.getByText('Lectura actualizada')).toBeVisible();
    await expect(page.getByRole('grid')).toContainText('1,600');
  });

  test('RD-TRANS-01 eliminación con confirmación', async ({ page }) => {
    await page.getByLabel('eliminar').first().click();
    await expect(page.getByRole('dialog')).toContainText('Eliminar Lectura');
    await confirmDelete(page);

    await expect(page.getByText('Lectura eliminada')).toBeVisible();
    await expect(page.getByRole('grid')).not.toContainText('2024-06-01');
  });

  test('RD-TRANS-02 navegación listado-formulario', async ({ page }) => {
    await page.getByRole('button', { name: 'Nueva' }).click();
    await expect(page.getByRole('dialog')).toContainText('Nueva Lectura');
    await cancelDialog(page);
    await expect(page.getByRole('dialog')).toBeHidden();
    await expect(page.getByRole('grid')).toBeVisible();
  });
});
