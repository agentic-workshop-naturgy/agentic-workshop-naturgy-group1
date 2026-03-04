import { test, expect } from '../fixtures/base.fixture';
import { TAX, TAX_INVALID, TIMEOUTS } from '../utils/test-data';

test.describe('Gestión de Impuestos (IVA)', () => {
  test.beforeEach(async ({ sidebar }) => {
    await sidebar.goToTaxes();
  });

  // ── CASO FUNCIONAL 1 ──────────────────────────────────────
  test('CF1: Alta exitosa de un impuesto', async ({ taxes }) => {
    await taxes.clickNew();

    await taxes.fillForm({
      codigo: TAX.codigo,
      tasa: TAX.tasa,
      vigenciaDesde: TAX.vigenciaDesde,
    });

    await taxes.clickSave();

    const msg = await taxes.getSuccessMessage();
    expect(msg).toBeTruthy();

    const visible = await taxes.isRowVisible(TAX.codigo);
    expect(visible).toBeTruthy();
  });

  // ── CASO FUNCIONAL 2 ──────────────────────────────────────
  test('CF2: Alta con tasa fuera de valores permitidos', async ({ taxes }) => {
    await taxes.clickNew();

    await taxes.fillForm({
      tasa: TAX_INVALID.tasa,
    });

    await taxes.clickSave();

    // Validate error for out-of-range tax rate
    const hasErrors = await taxes.hasFieldErrors();
    expect(hasErrors).toBeTruthy();
  });

  // ── CASO TRANSICIONAL 1 ───────────────────────────────────
  test('CT1: Navegación entre listado y formulario de alta/edición', async ({ taxes, page }) => {
    const startTime = Date.now();
    await taxes.clickNew();

    const formOpen = await taxes.isFormOpen();
    const loadTime = Date.now() - startTime;
    expect(formOpen).toBeTruthy();
    expect(loadTime).toBeLessThan(TIMEOUTS.formLoad);

    await taxes.clickCancel();

    await page.waitForTimeout(300);
    const formClosed = await taxes.isFormOpen();
    expect(formClosed).toBeFalsy();
  });
});
