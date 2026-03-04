import { test, expect } from '../fixtures/base.fixture';
import { TIMEOUTS } from '../utils/test-data';

test.describe('Comportamiento general', () => {

  // ── CASO FUNCIONAL 1 ──────────────────────────────────────
  test('CF1: Visualización de mensajes de error y éxito en tiempo real', async ({
    sidebar,
    supplyPoints,
    page,
  }) => {
    await sidebar.goToSupplyPoints();

    // Open form and try to save with empty required fields
    await supplyPoints.clickNew();
    await supplyPoints.clickSave();

    // Validate immediate error feedback (field-level validations)
    // MUI form helper texts with error class should appear
    const errorHelpers = page.locator('.MuiFormHelperText-root');
    const errorCount = await errorHelpers.count();
    expect(errorCount).toBeGreaterThan(0);

    // Now fill correctly and save
    await supplyPoints.fillForm({
      cups: `ES${Date.now()}`,
      zona: 'Test',
      tarifa: 'T1',
    });
    await supplyPoints.clickSave();

    // Validate success message appears immediately
    const msg = await supplyPoints.getSuccessMessage();
    expect(msg).toBeTruthy();
  });

  // ── CASO FUNCIONAL 2 ──────────────────────────────────────
  test('CF2: Confirmación obligatoria antes de acciones destructivas', async ({
    sidebar,
    supplyPoints,
    page,
  }) => {
    await sidebar.goToSupplyPoints();

    // Precondition: at least one row exists
    const rowCount = await supplyPoints.getRowCount();
    if (rowCount === 0) {
      test.skip(true, 'No records available for delete confirmation test');
      return;
    }

    // Get first row's text to identify it
    const firstRow = page.locator('.MuiDataGrid-row').first();
    const firstRowText = await firstRow.textContent();

    // Click delete
    await firstRow.getByRole('button', { name: 'eliminar' }).click();

    // Verify confirmation dialog appears
    const confirmDialog = page.locator('.MuiDialog-root').last();
    await confirmDialog.waitFor({ state: 'visible' });

    const dialogText = await confirmDialog.textContent();
    expect(dialogText).toContain('Eliminar');

    // Cancel the action
    await confirmDialog.getByRole('button', { name: 'Cancelar' }).click();

    // Verify the record is NOT deleted
    await page.waitForTimeout(500);
    const stillExists = await firstRow.isVisible();
    expect(stillExists).toBeTruthy();
  });

  // ── CASO TRANSICIONAL 1 ───────────────────────────────────
  test('CT1: Navegación fluida entre módulos', async ({ sidebar, page }) => {
    const modules = [
      { label: 'Puntos de Suministro', title: 'Puntos de Suministro' },
      { label: 'Lecturas', title: 'Lecturas de Gas' },
      { label: 'Tarifario', title: 'Tarifario' },
      { label: 'Factores Conversión', title: 'Factores de Conversión' },
      { label: 'Impuestos (IVA)', title: 'Impuestos (IVA)' },
      { label: 'Facturación', title: 'Ejecutar Facturación' },
      { label: 'Facturas', title: 'Facturas' },
    ];

    for (const mod of modules) {
      const startTime = Date.now();
      await sidebar.navigateTo(mod.label);
      const loadTime = Date.now() - startTime;

      // Verify AppBar title changes
      const appBarTitle = page.locator('.MuiAppBar-root .MuiTypography-h6');
      await expect(appBarTitle).toHaveText(mod.title);

      // Navigation should be under 2 seconds
      expect(loadTime).toBeLessThan(TIMEOUTS.formLoad);
    }
  });
});
