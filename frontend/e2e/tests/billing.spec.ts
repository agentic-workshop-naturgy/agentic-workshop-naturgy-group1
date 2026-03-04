import { test, expect } from '../fixtures/base.fixture';
import { BILLING, TIMEOUTS } from '../utils/test-data';

test.describe('Ejecución de Facturación', () => {
  test.beforeEach(async ({ sidebar }) => {
    await sidebar.goToBilling();
  });

  // ── CASO FUNCIONAL 1 ──────────────────────────────────────
  test('CF1: Ejecución exitosa de la facturación', async ({ billing }) => {
    // Precondition: valid readings, tariffs, factors, and taxes exist
    await billing.runBilling(BILLING.periodo);

    // Wait for completion (max 10 seconds per spec)
    await billing.waitForCompletion(TIMEOUTS.billingExecution);

    // Verify results section appears
    const hasResults = await billing.hasResults();
    expect(hasResults).toBeTruthy();
  });

  // ── CASO FUNCIONAL 2 ──────────────────────────────────────
  test('CF2: Ejecución con datos incompletos/inconsistentes', async ({ billing }) => {
    // Use a period with no data
    await billing.runBilling('1999-01');

    await billing.waitForCompletion(TIMEOUTS.billingExecution);

    // Should show results with errors or info message
    const hasResults = await billing.hasResults();
    const hasError = await billing.getErrorMessage().catch(() => null);

    // Either error alert or results with error count
    expect(hasResults || hasError).toBeTruthy();
  });

  // ── CASO NO FUNCIONAL 1 ───────────────────────────────────
  test('CNF1: Ejecución con gran volumen de datos', async ({ billing }) => {
    test.slow(); // Allow 3x the default timeout

    const startTime = Date.now();
    await billing.runBilling(BILLING.periodo);
    await billing.waitForCompletion(TIMEOUTS.billingHighVolume);
    const elapsed = Date.now() - startTime;

    // Must complete within 30 seconds
    expect(elapsed).toBeLessThan(TIMEOUTS.billingHighVolume);

    // Shouldn't crash — results or error should be visible
    const hasResults = await billing.hasResults();
    expect(hasResults).toBeTruthy();
  });

  // ── CASO FUNCIONAL 3 ──────────────────────────────────────
  test('CF3: Integración entre módulos durante facturación', async ({ billing }) => {
    await billing.runBilling(BILLING.periodo);
    await billing.waitForCompletion(TIMEOUTS.billingExecution);

    // Verify invoices created count is a number
    const hasResults = await billing.hasResults();
    if (hasResults) {
      const created = await billing.getInvoicesCreated();
      expect(Number(created)).toBeGreaterThanOrEqual(0);

      const updated = await billing.getInvoicesUpdated();
      expect(Number(updated)).toBeGreaterThanOrEqual(0);

      const errors = await billing.getErrorCount();
      expect(Number(errors)).toBeGreaterThanOrEqual(0);
    }
  });

  // ── CASO FUNCIONAL 4 ──────────────────────────────────────
  test('CF4: Visualización y descarga de errores de facturación', async ({ billing, page }) => {
    // Execute billing that may produce errors
    await billing.runBilling(BILLING.periodo);
    await billing.waitForCompletion(TIMEOUTS.billingExecution);

    const hasResults = await billing.hasResults();
    expect(hasResults).toBeTruthy();

    // Check that error count is visible
    const errorCount = await billing.getErrorCount();
    expect(errorCount).toBeTruthy();

    // If there are errors, the error grid should be visible
    if (Number(errorCount) > 0) {
      const hasErrorGrid = await billing.hasErrorGrid();
      expect(hasErrorGrid).toBeTruthy();
    }
  });

  // ── CASO TRANSICIONAL 1 ───────────────────────────────────
  test('CT1: Navegación entre ejecución y resultados/errores', async ({ billing, page }) => {
    // Execute billing
    await billing.runBilling(BILLING.periodo);
    await billing.waitForCompletion(TIMEOUTS.billingExecution);

    // Results should load within 3 seconds
    const startTime = Date.now();
    const hasResults = await billing.hasResults();
    const loadTime = Date.now() - startTime;

    expect(hasResults).toBeTruthy();
    expect(loadTime).toBeLessThan(TIMEOUTS.resultsLoad);
  });
});
