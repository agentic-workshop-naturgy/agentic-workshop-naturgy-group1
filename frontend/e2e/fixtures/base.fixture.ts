import { test as base, type Page } from '@playwright/test';
import { SidebarPO } from '../page-objects/sidebar.po';
import { SupplyPointsPO } from '../page-objects/supply-points.po';
import { ReadingsPO } from '../page-objects/readings.po';
import { TariffsPO } from '../page-objects/tariffs.po';
import { ConversionFactorsPO } from '../page-objects/conversion-factors.po';
import { TaxesPO } from '../page-objects/taxes.po';
import { BillingPO } from '../page-objects/billing.po';
import { InvoicesPO } from '../page-objects/invoices.po';

/**
 * Extended Playwright test fixture providing pre-built Page Objects
 * for all Gas Billing application features.
 *
 * Usage:
 *   import { test, expect } from '../fixtures/base.fixture';
 *   test('my test', async ({ sidebar, supplyPoints }) => { ... });
 */
export interface GasFixtures {
  sidebar: SidebarPO;
  supplyPoints: SupplyPointsPO;
  readings: ReadingsPO;
  tariffs: TariffsPO;
  conversionFactors: ConversionFactorsPO;
  taxes: TaxesPO;
  billing: BillingPO;
  invoices: InvoicesPO;
}

export const test = base.extend<GasFixtures>({
  /** Navigate to the app root before each test */
  page: async ({ page }, use) => {
    await page.goto('/');
    // Wait for the sidebar (MUI Drawer) to be visible
    await page.locator('.MuiDrawer-root').waitFor({ state: 'visible' });
    await use(page);
  },

  sidebar: async ({ page }, use) => {
    await use(new SidebarPO(page));
  },

  supplyPoints: async ({ page }, use) => {
    await use(new SupplyPointsPO(page));
  },

  readings: async ({ page }, use) => {
    await use(new ReadingsPO(page));
  },

  tariffs: async ({ page }, use) => {
    await use(new TariffsPO(page));
  },

  conversionFactors: async ({ page }, use) => {
    await use(new ConversionFactorsPO(page));
  },

  taxes: async ({ page }, use) => {
    await use(new TaxesPO(page));
  },

  billing: async ({ page }, use) => {
    await use(new BillingPO(page));
  },

  invoices: async ({ page }, use) => {
    await use(new InvoicesPO(page));
  },
});

export { expect } from '@playwright/test';
