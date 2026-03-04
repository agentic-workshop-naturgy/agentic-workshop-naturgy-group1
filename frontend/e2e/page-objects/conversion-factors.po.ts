import type { Page, Locator } from '@playwright/test';

/**
 * Page Object for Factores de Conversión (Conversion Factors) CRUD page.
 */
export class ConversionFactorsPO {
  private readonly page: Page;
  private readonly dataGrid: Locator;
  private readonly dialog: Locator;

  constructor(page: Page) {
    this.page = page;
    this.dataGrid = page.locator('.MuiDataGrid-root');
    this.dialog = page.locator('.MuiDialog-root');
  }

  // ── Actions ────────────────────────────────────────────────

  /** Click the "Nuevo" button to open create form */
  async clickNew(): Promise<void> {
    await this.page.getByRole('button', { name: /Nuev/ }).click();
    await this.dialog.waitFor({ state: 'visible' });
  }

  /** Fill the conversion factor form fields */
  async fillForm(data: {
    zona?: string;
    mes?: string;
    coefConv?: string;
    pcs?: string;
  }): Promise<void> {
    if (data.zona !== undefined) {
      await this.dialog.getByLabel('Zona').fill(data.zona);
    }
    if (data.mes !== undefined) {
      await this.dialog.getByLabel('Mes (YYYY-MM)').fill(data.mes);
    }
    if (data.coefConv !== undefined) {
      await this.dialog.getByLabel('Coeficiente Conv.').fill(data.coefConv);
    }
    if (data.pcs !== undefined) {
      await this.dialog.getByLabel('PCS (kWh/m³)').fill(data.pcs);
    }
  }

  /** Click the "Guardar" button */
  async clickSave(): Promise<void> {
    await this.dialog.getByRole('button', { name: 'Guardar' }).click();
  }

  /** Click the "Cancelar" button */
  async clickCancel(): Promise<void> {
    await this.dialog.getByRole('button', { name: 'Cancelar' }).click();
  }

  /** Click edit on a row */
  async clickEdit(rowText: string): Promise<void> {
    const row = this.dataGrid.getByRole('row').filter({ hasText: rowText });
    await row.getByRole('button', { name: 'editar' }).click();
    await this.dialog.waitFor({ state: 'visible' });
  }

  /** Click delete on a row */
  async clickDelete(rowText: string): Promise<void> {
    const row = this.dataGrid.getByRole('row').filter({ hasText: rowText });
    await row.getByRole('button', { name: 'eliminar' }).click();
  }

  /** Confirm deletion */
  async confirmDelete(): Promise<void> {
    const confirmDialog = this.page.locator('.MuiDialog-root').last();
    await confirmDialog.getByRole('button', { name: 'Eliminar' }).click();
  }

  // ── Assertions / Queries ───────────────────────────────────

  async getSuccessMessage(): Promise<string> {
    const alert = this.page.locator('.MuiSnackbar-root .MuiAlert-message');
    await alert.waitFor({ state: 'visible', timeout: 5_000 });
    return alert.textContent() as Promise<string>;
  }

  async getErrorMessage(): Promise<string> {
    const alert = this.page.locator('.MuiAlert-standardError .MuiAlert-message');
    await alert.waitFor({ state: 'visible', timeout: 5_000 });
    return alert.textContent() as Promise<string>;
  }

  async getFormError(): Promise<string> {
    const alert = this.dialog.locator('.MuiAlert-standardError .MuiAlert-message');
    await alert.waitFor({ state: 'visible', timeout: 5_000 });
    return alert.textContent() as Promise<string>;
  }

  async isRowVisible(text: string): Promise<boolean> {
    const row = this.dataGrid.getByRole('row').filter({ hasText: text });
    return row.isVisible();
  }

  async getRowCount(): Promise<number> {
    return this.dataGrid.locator('.MuiDataGrid-row').count();
  }

  async isFormOpen(): Promise<boolean> {
    return this.dialog.isVisible();
  }

  async hasFieldErrors(): Promise<boolean> {
    const helpers = this.dialog.locator('.Mui-error');
    return (await helpers.count()) > 0;
  }
}
