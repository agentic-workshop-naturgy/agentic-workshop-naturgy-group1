import type { Page, Locator } from '@playwright/test';

/**
 * Page Object for Impuestos / IVA (Taxes) CRUD page.
 */
export class TaxesPO {
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

  /** Fill the tax form fields */
  async fillForm(data: {
    codigo?: string;
    tasa?: string;
    vigenciaDesde?: string;
  }): Promise<void> {
    if (data.codigo !== undefined) {
      await this.dialog.getByLabel('Código').fill(data.codigo);
    }
    if (data.tasa !== undefined) {
      await this.dialog.getByLabel('Tasa (0 a 1)').fill(data.tasa);
    }
    if (data.vigenciaDesde !== undefined) {
      await this.dialog.getByLabel(/Vigencia Desde/).fill(data.vigenciaDesde);
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
