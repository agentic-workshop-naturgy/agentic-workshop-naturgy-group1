import { test, expect } from '../fixtures/base.fixture';
import { CONVERSION_FACTOR, CONVERSION_FACTOR_INVALID, TIMEOUTS } from '../utils/test-data';

test.describe('Gestión de Factores de Conversión', () => {
  test.beforeEach(async ({ sidebar }) => {
    await sidebar.goToConversionFactors();
  });

  // ── CASO FUNCIONAL 1 ──────────────────────────────────────
  test('CF1: Alta exitosa de un factor de conversión', async ({ conversionFactors }) => {
    await conversionFactors.clickNew();

    await conversionFactors.fillForm({
      zona: CONVERSION_FACTOR.zona,
      mes: CONVERSION_FACTOR.mes,
      coefConv: CONVERSION_FACTOR.coefConv,
      pcs: CONVERSION_FACTOR.pcs,
    });

    await conversionFactors.clickSave();

    const msg = await conversionFactors.getSuccessMessage();
    expect(msg).toBeTruthy();

    const visible = await conversionFactors.isRowVisible(CONVERSION_FACTOR.coefConv);
    expect(visible).toBeTruthy();
  });

  // ── CASO FUNCIONAL 2 ──────────────────────────────────────
  test('CF2: Alta con datos fuera de rango', async ({ conversionFactors }) => {
    await conversionFactors.clickNew();

    await conversionFactors.fillForm({
      zona: CONVERSION_FACTOR_INVALID.zona,
      mes: CONVERSION_FACTOR_INVALID.mes,
      coefConv: CONVERSION_FACTOR_INVALID.coefConv,
      pcs: CONVERSION_FACTOR_INVALID.pcs,
    });

    await conversionFactors.clickSave();

    // Validate error messages for out-of-range values
    const hasErrors = await conversionFactors.hasFieldErrors();
    expect(hasErrors).toBeTruthy();
  });

  // ── CASO TRANSICIONAL 1 ───────────────────────────────────
  test('CT1: Navegación entre listado y formulario de alta/edición', async ({ conversionFactors, page }) => {
    const startTime = Date.now();
    await conversionFactors.clickNew();

    const formOpen = await conversionFactors.isFormOpen();
    const loadTime = Date.now() - startTime;
    expect(formOpen).toBeTruthy();
    expect(loadTime).toBeLessThan(TIMEOUTS.formLoad);

    await conversionFactors.clickCancel();

    await page.waitForTimeout(300);
    const formClosed = await conversionFactors.isFormOpen();
    expect(formClosed).toBeFalsy();
  });
});
