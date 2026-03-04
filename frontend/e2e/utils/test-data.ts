/**
 * Centralized test data constants extracted from the test case document.
 * All values match those specified in "Casos_Pruebas_Detallados 1.txt".
 */

// ── Supply Points ──────────────────────────────────────────────
export const SUPPLY_POINT = {
  cups: 'ES1234567890123456',
  zona: 'Centro',
  tarifa: 'T1',
  estado: 'ACTIVO' as const,
};

export const SUPPLY_POINT_EDIT = {
  tarifa: 'T2',
};

// ── Readings ───────────────────────────────────────────────────
export const READING = {
  cups: 'ES1234567890123456',
  fecha: '2024-06-01',
  valor: '1500',
};

export const READING_EDIT = {
  valor: '1600',
};

// ── Tariffs ────────────────────────────────────────────────────
export const TARIFF = {
  nombre: 'T2',
  fijo: '10',
  variable: '0.15',
  vigencia: '2024-06-01',
};

// ── Conversion Factors ─────────────────────────────────────────
export const CONVERSION_FACTOR = {
  zona: 'Centro',
  mes: '2024-06',
  coefConv: '1.05',
  pcs: '10.5',
};

export const CONVERSION_FACTOR_INVALID = {
  zona: 'Test',
  mes: '2024-06',
  coefConv: '-1',
  pcs: '1000',
};

// ── Taxes ──────────────────────────────────────────────────────
export const TAX = {
  codigo: 'IVA21',
  tasa: '0.21',
  vigenciaDesde: '2024-01-01',
};

export const TAX_INVALID = {
  tasa: '150',
};

// ── Billing ────────────────────────────────────────────────────
export const BILLING = {
  periodo: '2024-06',
};

// ── Timeouts from test case document ───────────────────────────
export const TIMEOUTS = {
  /** Max response time for CRUD operations (3 seconds) */
  crudResponse: 3_000,
  /** Max form load time (2 seconds) */
  formLoad: 2_000,
  /** Max billing execution time (10 seconds) */
  billingExecution: 10_000,
  /** Max billing with high volume (30 seconds) */
  billingHighVolume: 30_000,
  /** Max results page load time (3 seconds) */
  resultsLoad: 3_000,
};
