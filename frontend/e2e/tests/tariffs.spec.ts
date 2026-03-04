import { test, expect } from '../fixtures/base.fixture';
import { TARIFF, TIMEOUTS } from '../utils/test-data';

test.describe('Gestión de Tarifario', () => {
  test.beforeEach(async ({ sidebar }) => {
    await sidebar.goToTariffs();
  });

  // ── CASO FUNCIONAL 1 ──────────────────────────────────────
  test('CF1: Alta exitosa de una tarifa', async ({ tariffs }) => {
    const uniqueTariffCode = `${TARIFF.nombre}-${Date.now()}`;

    await tariffs.clickNew();

    await tariffs.fillForm({
      nombre: uniqueTariffCode,
      fijo: TARIFF.fijo,
      variable: TARIFF.variable,
      vigencia: TARIFF.vigencia,
    });

    await tariffs.clickSave();

    const msg = await tariffs.getSuccessMessage();
    expect(msg).toBeTruthy();

    const visible = await tariffs.isRowVisible(uniqueTariffCode);
    expect(visible).toBeTruthy();
  });

  // ── CASO FUNCIONAL 2 ──────────────────────────────────────
  test('CF2: Alta de tarifa con campos obligatorios vacíos', async ({ tariffs }) => {
    await tariffs.clickNew();

    // Leave all fields empty and click save
    await tariffs.clickSave();

    // Validate field-level error messages appear
    const hasErrors = await tariffs.hasFieldErrors();
    expect(hasErrors).toBeTruthy();
  });

  // ── CASO TRANSICIONAL 1 ───────────────────────────────────
  test('CT1: Navegación entre listado y formulario de alta/edición', async ({ tariffs, page }) => {
    const startTime = Date.now();
    await tariffs.clickNew();

    const formOpen = await tariffs.isFormOpen();
    const loadTime = Date.now() - startTime;
    expect(formOpen).toBeTruthy();
    expect(loadTime).toBeLessThan(TIMEOUTS.formLoad);

    await tariffs.clickCancel();

    await page.waitForTimeout(300);
    const formClosed = await tariffs.isFormOpen();
    expect(formClosed).toBeFalsy();
  });
});
