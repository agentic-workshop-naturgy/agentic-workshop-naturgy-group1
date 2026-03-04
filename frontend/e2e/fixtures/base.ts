/**
 * base.ts – custom Playwright fixtures shared across all tests.
 *
 * Exports:
 *  - `test`   : base test with `navigate` helper available via fixture
 *  - `expect` : re-exported for convenience
 *  - `nav`    : navigation helper factory (nav(page).toSupplyPoints() etc.)
 *
 * Usage:
 *   import { test, expect, nav } from '../fixtures/base';
 */

import { test as base, expect, type Page } from '@playwright/test';

// Re-export expect so imports stay tidy in test files
export { expect };

// ---------------------------------------------------------------------------
// Navigation helper – the app is a SPA that uses sidebar ListItemButtons
// ---------------------------------------------------------------------------

export const nav = (page: Page) => ({
  toSupplyPoints: () => page.getByRole('button', { name: /puntos de suministro/i }).click(),
  toReadings:     () => page.getByRole('button', { name: /lecturas/i }).click(),
  toTariffs:      () => page.getByRole('button', { name: /tarifario/i }).click(),
  toConversionFactors: () => page.getByRole('button', { name: /factores conversión/i }).click(),
  toTaxes:        () => page.getByRole('button', { name: /impuestos/i }).click(),
  toBilling:      () => page.getByRole('button', { name: /^facturación$/i }).click(),
  toInvoices:     () => page.getByRole('button', { name: /^facturas$/i }).click(),
  toDashboard:    () => page.getByRole('button', { name: /dashboard/i }).click(),
});

export const test = base;
