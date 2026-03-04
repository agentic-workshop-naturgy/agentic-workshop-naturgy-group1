import type { Page, Locator } from '@playwright/test';

/**
 * Page Object for Facturas (Invoices) list page.
 */
export class InvoicesPO {
  private readonly page: Page;
  private readonly dataGrid: Locator;

  constructor(page: Page) {
    this.page = page;
    this.dataGrid = page.locator('.MuiDataGrid-root');
  }

  // ── Actions ────────────────────────────────────────────────

  /** Click "Descargar PDF" button for a row */
  async clickDownloadPdf(rowText: string): Promise<void> {
    const row = this.dataGrid.getByRole('row').filter({ hasText: rowText });
    await row.getByRole('button', { name: /PDF|Descargar/ }).click();
  }

  /** Click on a row to view invoice detail */
  async clickRow(rowText: string): Promise<void> {
    const row = this.dataGrid.getByRole('row').filter({ hasText: rowText });
    await row.click();
  }

  /** Click "Volver" / back button */
  async clickBack(): Promise<void> {
    await this.page.getByRole('button', { name: /Volver|Atrás/ }).click();
  }

  // ── Assertions / Queries ───────────────────────────────────

  /** Check if the DataGrid is visible (page loaded) */
  async isListVisible(): Promise<boolean> {
    return this.dataGrid.isVisible();
  }

  /** Get the number of invoice rows */
  async getRowCount(): Promise<number> {
    return this.dataGrid.locator('.MuiDataGrid-row').count();
  }

  /** Check if a row with given text is visible */
  async isRowVisible(text: string): Promise<boolean> {
    const row = this.dataGrid.getByRole('row').filter({ hasText: text });
    return row.isVisible();
  }

  /** Get error alert message */
  async getErrorMessage(): Promise<string> {
    const alert = this.page.locator('.MuiAlert-standardError .MuiAlert-message');
    await alert.waitFor({ state: 'visible', timeout: 5_000 });
    return alert.textContent() as Promise<string>;
  }

  /** Get success snackbar message */
  async getSuccessMessage(): Promise<string> {
    const alert = this.page.locator('.MuiSnackbar-root .MuiAlert-message');
    await alert.waitFor({ state: 'visible', timeout: 5_000 });
    return alert.textContent() as Promise<string>;
  }
}
