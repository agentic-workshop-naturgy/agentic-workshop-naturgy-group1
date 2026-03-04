import type { Page, Locator } from '@playwright/test';

/**
 * Page Object for Facturación (Billing) execution page.
 */
export class BillingPO {
  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // ── Actions ────────────────────────────────────────────────

  /** Fill the billing period field */
  async fillPeriod(period: string): Promise<void> {
    await this.page.getByLabel(/Periodo/).fill(period);
  }

  /** Click the "Ejecutar Facturación" button */
  async clickExecute(): Promise<void> {
    await this.page.getByRole('button', { name: /Ejecutar Facturación/ }).click();
  }

  /** Execute billing for a given period (fill + click) */
  async runBilling(period: string): Promise<void> {
    await this.fillPeriod(period);
    await this.clickExecute();
  }

  // ── Assertions / Queries ───────────────────────────────────

  /** Check if billing is currently executing (button shows spinner) */
  async isRunning(): Promise<boolean> {
    const button = this.page.getByRole('button', { name: /Ejecutando/ });
    return button.isVisible();
  }

  /** Wait for billing execution to complete */
  async waitForCompletion(timeout = 10_000): Promise<void> {
    // Wait for "Ejecutando" to disappear (billing finished)
    await this.page
      .getByRole('button', { name: /Ejecutar Facturación/ })
      .waitFor({ state: 'visible', timeout });
  }

  /** Get the error alert message */
  async getErrorMessage(): Promise<string> {
    const alert = this.page.locator('.MuiAlert-standardError .MuiAlert-message');
    await alert.waitFor({ state: 'visible', timeout: 5_000 });
    return alert.textContent() as Promise<string>;
  }

  /** Get the period error helper text */
  async getPeriodError(): Promise<string | null> {
    const helper = this.page.locator('.MuiFormHelperText-root.Mui-error');
    if (await helper.isVisible()) {
      return helper.textContent();
    }
    return null;
  }

  /** Check if results section is visible */
  async hasResults(): Promise<boolean> {
    return this.page.getByText(/Resultado para el periodo/).isVisible();
  }

  /** Get the number of invoices created */
  async getInvoicesCreated(): Promise<string> {
    const card = this.page.locator('text=Facturas creadas').locator('..');
    const value = card.locator('.MuiTypography-h4');
    return value.textContent() as Promise<string>;
  }

  /** Get the number of invoices updated */
  async getInvoicesUpdated(): Promise<string> {
    const card = this.page.locator('text=Facturas actualizadas').locator('..');
    const value = card.locator('.MuiTypography-h4');
    return value.textContent() as Promise<string>;
  }

  /** Get the error count from results */
  async getErrorCount(): Promise<string> {
    const card = this.page.locator('text=Errores').locator('..');
    const value = card.locator('.MuiTypography-h4');
    return value.textContent() as Promise<string>;
  }

  /** Check if the error DataGrid is visible */
  async hasErrorGrid(): Promise<boolean> {
    return this.page.getByText('CUPS con errores de facturación').isVisible();
  }

  /** Get the success alert message */
  async getSuccessAlert(): Promise<string | null> {
    const alert = this.page.locator('.MuiAlert-standardSuccess');
    if (await alert.isVisible()) {
      return alert.textContent();
    }
    return null;
  }
}
