import { test, expect } from '../fixtures/base.fixture';
import { READING, READING_EDIT, TIMEOUTS } from '../utils/test-data';

test.describe('Gestión de Lecturas', () => {
  test.beforeEach(async ({ sidebar }) => {
    await sidebar.goToReadings();
  });

  // ── CASO FUNCIONAL 1 ──────────────────────────────────────
  test('CF1: Alta exitosa de una lectura', async ({ readings }) => {
    await readings.clickNew();

    await readings.fillForm({
      cups: READING.cups,
      fecha: READING.fecha,
      valor: READING.valor,
    });

    await readings.clickSave();

    // Validate success message within 3 seconds
    const msg = await readings.getSuccessMessage();
    expect(msg).toContain('creada');

    // Verify the reading appears in the list
    const visible = await readings.isRowVisible(READING.cups);
    expect(visible).toBeTruthy();
  });

  // ── CASO FUNCIONAL 2 ──────────────────────────────────────
  test('CF2: Alta de lectura con combinación CUPS+Fecha duplicada', async ({ readings }) => {
    // Precondition: a reading with same CUPS + Fecha already exists
    await readings.clickNew();

    await readings.fillForm({
      cups: READING.cups,
      fecha: READING.fecha,
      valor: '2000',
    });

    await readings.clickSave();

    // Validate error message about duplicate
    const error = await readings.getFormError();
    expect(error).toBeTruthy();
  });

  // ── CASO FUNCIONAL 3 ──────────────────────────────────────
  test('CF3: Edición de una lectura', async ({ readings }) => {
    // Precondition: a reading exists
    await readings.clickEdit(READING.cups);

    await readings.fillForm({ valor: READING_EDIT.valor });

    await readings.clickSave();

    const msg = await readings.getSuccessMessage();
    expect(msg).toContain('actualizada');

    // Verify the updated value
    const visible = await readings.isRowVisible(READING_EDIT.valor);
    expect(visible).toBeTruthy();
  });

  // ── CASO TRANSICIONAL 1 ───────────────────────────────────
  test('CT1: Eliminación de una lectura', async ({ readings }) => {
    const initialCount = await readings.getRowCount();

    await readings.clickDelete(READING.cups);
    await readings.confirmDelete();

    const msg = await readings.getSuccessMessage();
    expect(msg).toContain('eliminada');

    const finalCount = await readings.getRowCount();
    expect(finalCount).toBeLessThan(initialCount);
  });

  // ── CASO TRANSICIONAL 2 ───────────────────────────────────
  test('CT2: Navegación entre listado y formulario de alta/edición', async ({ readings, page }) => {
    const startTime = Date.now();
    await readings.clickNew();

    const formOpen = await readings.isFormOpen();
    const loadTime = Date.now() - startTime;
    expect(formOpen).toBeTruthy();
    expect(loadTime).toBeLessThan(TIMEOUTS.formLoad);

    await readings.clickCancel();

    await page.waitForTimeout(300);
    const formClosed = await readings.isFormOpen();
    expect(formClosed).toBeFalsy();
  });
});
