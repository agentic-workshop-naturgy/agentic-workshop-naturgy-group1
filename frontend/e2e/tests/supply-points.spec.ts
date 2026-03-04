import { test, expect } from '../fixtures/base.fixture';
import { SUPPLY_POINT, SUPPLY_POINT_EDIT, TIMEOUTS } from '../utils/test-data';

test.describe('Gestión de Puntos de Suministro', () => {
  test.beforeEach(async ({ sidebar }) => {
    await sidebar.goToSupplyPoints();
  });

  // ── CASO FUNCIONAL 1 ──────────────────────────────────────
  test('CF1: Alta exitosa de un nuevo punto de suministro', async ({ supplyPoints }) => {
    // 1. Click "Nuevo"
    await supplyPoints.clickNew();

    // 2. Complete form with valid data
    await supplyPoints.fillForm({
      cups: SUPPLY_POINT.cups,
      zona: SUPPLY_POINT.zona,
      tarifa: SUPPLY_POINT.tarifa,
      estado: SUPPLY_POINT.estado,
    });

    // 3. Click "Guardar"
    await supplyPoints.clickSave();

    // 4. Validate success message (within 3 seconds)
    const msg = await supplyPoints.getSuccessMessage();
    expect(msg).toContain('creado');

    // 5. Verify the new record appears in the list
    const visible = await supplyPoints.isRowVisible(SUPPLY_POINT.cups);
    expect(visible).toBeTruthy();
  });

  // ── CASO FUNCIONAL 2 ──────────────────────────────────────
  test('CF2: Intento de alta con CUPS duplicado', async ({ supplyPoints }) => {
    // Precondition: there should be a supply point with the same CUPS
    // (created by CF1 or seed data)
    await supplyPoints.clickNew();

    await supplyPoints.fillForm({
      cups: SUPPLY_POINT.cups,
      zona: 'Norte',
      tarifa: 'T2',
      estado: 'ACTIVO',
    });

    await supplyPoints.clickSave();

    // Validate error message about duplicate CUPS
    const error = await supplyPoints.getFormError();
    expect(error).toBeTruthy();
  });

  // ── CASO FUNCIONAL 3 ──────────────────────────────────────
  test('CF3: Edición de un punto de suministro', async ({ supplyPoints }) => {
    // Precondition: a supply point exists in the list
    await supplyPoints.clickEdit(SUPPLY_POINT.cups);

    // Modify tarifa field
    await supplyPoints.fillForm({ tarifa: SUPPLY_POINT_EDIT.tarifa });

    await supplyPoints.clickSave();

    // Validate success message
    const msg = await supplyPoints.getSuccessMessage();
    expect(msg).toContain('actualizado');

    // Verify the change is reflected
    const visible = await supplyPoints.isRowVisible(SUPPLY_POINT_EDIT.tarifa);
    expect(visible).toBeTruthy();
  });

  // ── CASO TRANSICIONAL 1 ───────────────────────────────────
  test('CT1: Eliminación/inactivación de un punto de suministro', async ({ supplyPoints }) => {
    // Precondition: at least one supply point exists
    const initialCount = await supplyPoints.getRowCount();

    // Get CUPS of first visible row for deletion
    await supplyPoints.clickDelete(SUPPLY_POINT.cups);

    // Confirm deletion dialog appears and confirm
    await supplyPoints.confirmDelete();

    // Validate success message
    const msg = await supplyPoints.getSuccessMessage();
    expect(msg).toContain('eliminado');

    // Verify the record is no longer in the list
    const finalCount = await supplyPoints.getRowCount();
    expect(finalCount).toBeLessThan(initialCount);
  });

  // ── CASO TRANSICIONAL 2 ───────────────────────────────────
  test('CT2: Navegación entre listado y formulario de alta/edición', async ({ supplyPoints, page }) => {
    // 1. Click "Nuevo" to open form
    const startTime = Date.now();
    await supplyPoints.clickNew();

    // 2. Verify form loads in less than 2 seconds
    const formOpen = await supplyPoints.isFormOpen();
    const loadTime = Date.now() - startTime;
    expect(formOpen).toBeTruthy();
    expect(loadTime).toBeLessThan(TIMEOUTS.formLoad);

    // 3. Click "Cancelar" to return to list
    await supplyPoints.clickCancel();

    // 4. Verify form is closed (returned to list)
    await page.waitForTimeout(300);
    const formClosed = await supplyPoints.isFormOpen();
    expect(formClosed).toBeFalsy();
  });
});
