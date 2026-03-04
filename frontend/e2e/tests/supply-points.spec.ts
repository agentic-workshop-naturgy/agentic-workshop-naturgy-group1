/**
 * E2E â€“ GestiÃ³n de Puntos de Suministro
 *
 * Cubre los siguientes casos del documento funcional:
 *  CF1  â€“ Alta exitosa de un nuevo punto de suministro
 *  CF2  â€“ Intento de alta con CUPS duplicado
 *  CF3  â€“ EdiciÃ³n de un punto de suministro
 *  CT1  â€“ EliminaciÃ³n/inactivaciÃ³n con diÃ¡logo de confirmaciÃ³n
 *  CT2  â€“ NavegaciÃ³n entre listado y formulario de alta/ediciÃ³n
 *
 * Notas de implementaciÃ³n:
 *  - MUI v7: getByLabel se scopa al dialog para evitar conflictos con cabeceras del grid
 *  - El botÃ³n editar de la fila tiene aria-label="Guardar" (= t('common.save'))
 *  - El botÃ³n eliminar de la fila tiene aria-label="Eliminar" (= t('common.delete'))
 *  - La SPA usa ListItemButton (renders como <button>) en el sidebar
 */

import { test, expect, nav } from '../fixtures/base';

// CUPS único por ejecución — evita colisiones con la BBDD persistente en memoria
const ts = Date.now().toString().slice(-8); // 8 últimos dígitos del timestamp
const CUPS_NEW = `ES9900${ts}0001`; // 18 caracteres, formato válido

test.describe('GestiÃ³n de Puntos de Suministro', () => {

  // ---------------------------------------------------------------------------
  // CF1 â€“ Alta exitosa
  // ---------------------------------------------------------------------------
  test('CF1 â€“ alta exitosa con todos los campos obligatorios', async ({ page }) => {
    await page.goto('/');
    await nav(page).toSupplyPoints();
    await expect(page.getByRole('grid')).toBeVisible();

    // Abrir formulario de alta
    await page.getByRole('button', { name: /nuevo/i }).click();

    // Scope al dialog para los getByLabel (evita ambigÃ¼edad con cabeceras del grid)
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('heading', { name: /nuevo punto de suministro/i })).toBeVisible();

    // Rellenar campos usando los inputs en orden dentro del dialog
    // CUPS = 1er input, Zona = 2do, Tarifa = 3er (MUI TextField â†’ <input>)
    const inputs = dialog.locator('input:not([type="hidden"])');
    await inputs.nth(0).fill(CUPS_NEW); // CUPS
    await inputs.nth(1).fill('Centro'); // Zona
    await inputs.nth(2).fill('T1');     // Tarifa

    // Guardar
    await dialog.getByRole('button', { name: /guardar/i }).click();

    // Ã‰xito: Snackbar MUI
    await expect(page.getByText(/punto de suministro creado/i)).toBeVisible({ timeout: 5000 });
    await expect(dialog).not.toBeVisible();
    await expect(page.getByRole('grid')).toContainText(CUPS_NEW);
  });

  // ---------------------------------------------------------------------------
  // CF2 â€“ CUPS duplicado
  // ---------------------------------------------------------------------------
  test('CF2 â€“ alta con CUPS duplicado muestra error', async ({ page }) => {
    await page.goto('/');
    await nav(page).toSupplyPoints();
    await expect(page.getByRole('grid')).toBeVisible();

    // Tomar el CUPS de la primera fila de datos del seed
    const firstRow = page.locator('[role="row"]:not([aria-rowindex="1"])').first();
    await expect(firstRow).toBeVisible();
    const duplicateCups = (await firstRow.locator('[role="gridcell"]').first().textContent())?.trim()
      ?? 'ES0000000000000001';

    // Abrir formulario y rellenar con el CUPS duplicado
    await page.getByRole('button', { name: /nuevo/i }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    const inputs = dialog.locator('input:not([type="hidden"])');
    await inputs.nth(0).fill(duplicateCups); // CUPS duplicado
    await inputs.nth(1).fill('Centro');
    await inputs.nth(2).fill('T1');

    await dialog.getByRole('button', { name: /guardar/i }).click();

    // El dialog permanece abierto y muestra el error de la API
    await expect(dialog).toBeVisible({ timeout: 5000 });
    await expect(dialog.locator('.MuiAlert-root')).toBeVisible({ timeout: 5000 });
  });

  // ---------------------------------------------------------------------------
  // CF3 â€“ EdiciÃ³n
  // ---------------------------------------------------------------------------
  test('CF3 â€“ ediciÃ³n de un punto de suministro actualiza la tarifa', async ({ page }) => {
    await page.goto('/');
    await nav(page).toSupplyPoints();
    await expect(page.getByRole('grid')).toBeVisible();

    const firstRow = page.locator('[role="row"]:not([aria-rowindex="1"])').first();
    await expect(firstRow).toBeVisible();

    // BotÃ³n editar: aria-label = t('common.save') = "Guardar"
    await firstRow.getByRole('button', { name: /guardar/i }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('heading', { name: /editar punto de suministro/i })).toBeVisible();

    // En modo ediciÃ³n, CUPS estÃ¡ deshabilitado â†’ Tarifa es el 2do input no deshabilitado
    // Usar el 3er input general (CUPS=0 deshabilitado, Zona=1, Tarifa=2)
    const inputs = dialog.locator('input:not([type="hidden"])');
    const tarifaInput = inputs.nth(2); // Tarifa
    await tarifaInput.clear();
    await tarifaInput.fill('T2');

    await dialog.getByRole('button', { name: /guardar/i }).click();

    await expect(page.getByText(/punto de suministro actualizado/i)).toBeVisible({ timeout: 5000 });
    await expect(dialog).not.toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // CT1 â€“ EliminaciÃ³n con confirmaciÃ³n
  // ---------------------------------------------------------------------------
  test('CT1 â€“ eliminaciÃ³n solicita confirmaciÃ³n y elimina el registro', async ({ page }) => {
    await page.goto('/');
    await nav(page).toSupplyPoints();
    await expect(page.getByRole('grid')).toBeVisible();

    const dataRows = page.locator('[role="row"]:not([aria-rowindex="1"])');
    await expect(dataRows.first()).toBeVisible();
    const rowsBefore = await dataRows.count();
    expect(rowsBefore).toBeGreaterThan(0);

    // BotÃ³n eliminar de la primera fila: aria-label = "Eliminar"
    await dataRows.first().getByRole('button', { name: /eliminar/i }).click();

    // ConfirmDialog debe aparecer
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText(/eliminar punto de suministro/i)).toBeVisible();

    // Confirmar
    await dialog.getByRole('button', { name: /eliminar/i }).click();

    await expect(page.getByText(/punto de suministro eliminado/i)).toBeVisible({ timeout: 5000 });
    await expect(dataRows).toHaveCount(rowsBefore - 1, { timeout: 5000 });
  });

  // ---------------------------------------------------------------------------
  // CT2 â€“ NavegaciÃ³n listado â†” formulario
  // ---------------------------------------------------------------------------
  test('CT2 â€“ navegaciÃ³n fluida entre listado y formulario de alta', async ({ page }) => {
    await page.goto('/');
    await nav(page).toSupplyPoints();
    await expect(page.getByRole('grid')).toBeVisible();

    const start = Date.now();
    await page.getByRole('button', { name: /nuevo/i }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    expect(Date.now() - start).toBeLessThan(2000);

    // Cancelar â†’ retorno al listado sin recarga de pÃ¡gina
    await dialog.getByRole('button', { name: /cancelar/i }).click();
    await expect(dialog).not.toBeVisible();
    await expect(page.getByRole('grid')).toBeVisible();
  });
});
