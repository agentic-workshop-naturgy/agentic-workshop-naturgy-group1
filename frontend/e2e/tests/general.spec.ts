/**
 * E2E – Comportamiento General
 *
 * Cubre los siguientes casos del documento funcional:
 *  CF1  – Mensajes de error y éxito en tiempo real al interactuar con formularios
 *  CF2  – Confirmación obligatoria antes de acciones destructivas
 *  CT1  – Navegación fluida entre módulos (tiempos de carga < 2 s)
 */

import { test, expect, nav } from '../fixtures/base';

test.describe('Comportamiento General', () => {

  // ---------------------------------------------------------------------------
  // CF1 – Mensajes en tiempo real
  // ---------------------------------------------------------------------------
  test('CF1 – campos vacíos muestran error inmediato; guardado correcto muestra éxito', async ({ page }) => {
    await page.goto('/');
    await nav(page).toTariffs();

    // Abrir formulario y guardar sin datos → error inmediato
    await page.getByRole('button', { name: /nuevo/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    await page.getByRole('button', { name: /guardar/i }).click();

    // Error debe aparecer sin recargar la página
    const helperErrors = page.locator('[role="dialog"] .MuiFormHelperText-root');
    await expect(helperErrors.first()).toBeVisible({ timeout: 1000 }); // < 1 s

    // Rellenar correctamente y guardar → éxito inmediato
    await page.getByLabel(/tarifa|código/i).first().fill('T_GEN_01');
    await page.getByLabel(/fijo/i).fill('5');
    await page.getByLabel(/variable/i).fill('0.10');
    await page.getByLabel(/vigencia/i).fill('2024-01-01');

    await page.getByRole('button', { name: /guardar/i }).click();

    // Snackbar con éxito
    const snackbar = page.locator('[role="alert"]').or(page.getByText(/creada|creado/i)).first();
    await expect(snackbar).toBeVisible({ timeout: 3000 });
  });

  // ---------------------------------------------------------------------------
  // CF2 – Confirmación obligatoria antes de eliminar
  // ---------------------------------------------------------------------------
  test('CF2 – acción destructiva requiere confirmación; cancelar no elimina', async ({ page }) => {
    await page.goto('/');
    await nav(page).toSupplyPoints();

    await expect(page.getByRole('grid')).toBeVisible();
    const rowsBefore = await page.locator('[role="row"]:not([aria-rowindex="1"])').count();

    // Clic en botón Eliminar de la primera fila (índice 1 = segundo botón de acciones)
    await page.locator('[role="row"]:not([aria-rowindex="1"])').first()
      .getByRole('button').nth(1).click();

    // Diálogo de confirmación debe aparecer
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('heading', { name: /eliminar punto de suministro/i })).toBeVisible();

    // Cancelar → el registro no se elimina
    await page.getByRole('button', { name: /cancelar/i }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // Número de filas no cambia
    await expect(page.locator('[role="row"]:not([aria-rowindex="1"])')).toHaveCount(rowsBefore);
  });

  // ---------------------------------------------------------------------------
  // CT1 – Navegación fluida entre módulos (< 2 s por transición)
  // ---------------------------------------------------------------------------
  test('CT1 – navegación entre todos los módulos principales sin errores', async ({ page }) => {
    await page.goto('/');

    const modules: Array<{ name: string; navigate: () => Promise<void> }> = [
      { name: 'supply-points',      navigate: () => nav(page).toSupplyPoints() },
      { name: 'readings',           navigate: () => nav(page).toReadings() },
      { name: 'tariffs',            navigate: () => nav(page).toTariffs() },
      { name: 'conversion-factors', navigate: () => nav(page).toConversionFactors() },
      { name: 'taxes',              navigate: () => nav(page).toTaxes() },
      { name: 'billing',            navigate: () => nav(page).toBilling() },
      { name: 'invoices',           navigate: () => nav(page).toInvoices() },
    ];

    for (const mod of modules) {
      const start = Date.now();
      await mod.navigate();

      // Esperar a que algún elemento principal sea visible (grid o campo)
      await page.locator('[role="grid"], [role="main"] input, .MuiPageHeader-root, h5, h6').first()
        .waitFor({ state: 'visible', timeout: 5000 });

      const elapsed = Date.now() - start;
      expect(elapsed, `Módulo ${mod.name} tardó ${elapsed} ms (> 2000 ms)`).toBeLessThan(2000);

      // No debe haber ningún error de red o JS no capturado visible
      await expect(page.getByText(/something went wrong|uncaught error/i)).not.toBeVisible();
    }
  });
});
