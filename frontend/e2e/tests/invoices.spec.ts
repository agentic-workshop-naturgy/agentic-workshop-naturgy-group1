import { test, expect } from '../fixtures/base.fixture';
import { installMockApi } from '../helpers/mockApi';
import { goToModule, openApp } from '../helpers/navigation';

test.describe('Facturas', () => {
  test('IN-FUNC-01 visualización listado', async ({ page }) => {
    await installMockApi(page);
    await openApp(page);
    await goToModule(page, 'Facturas');

    await expect(page.getByRole('grid')).toContainText('F-202406-0001');
    await expect(page.getByRole('grid')).toContainText('ES1234567890123456');
    await expect(page.getByRole('grid')).toContainText('121,00');
  });

  test('IN-FUNC-02 descarga PDF exitosa', async ({ page }) => {
    await installMockApi(page);
    await openApp(page);
    await goToModule(page, 'Facturas');

    await page.getByLabel('Descargar PDF').first().click();
    await expect(page.getByText('PDF descargado')).toBeVisible();
  });

  test('IN-FUNC-03 error en descarga PDF inexistente', async ({ page }) => {
    await installMockApi(page, { failPdfFor: ['F-202406-0001'] });
    await openApp(page);
    await goToModule(page, 'Facturas');

    await page.getByLabel('Descargar PDF').first().click();
    await expect(page.getByRole('alert')).toContainText('Recurso no encontrado');
  });

  test('IN-TRANS-01 navegación listado-detalle-volver', async ({ page }) => {
    await installMockApi(page);
    await openApp(page);
    await goToModule(page, 'Facturas');

    await page.getByLabel('Ver detalle').first().click();
    await expect(page.getByRole('dialog')).toContainText('Detalle de Factura');
    await page.getByRole('button', { name: 'Cerrar' }).click();
    await expect(page.getByRole('dialog')).toBeHidden();
    await expect(page.getByRole('grid')).toBeVisible();
  });
});
