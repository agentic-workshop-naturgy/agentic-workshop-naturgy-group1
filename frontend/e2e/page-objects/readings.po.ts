import type { Page, Locator } from '@playwright/test';

/**
 * Page Object for Lecturas (Gas Readings) CRUD page.
 */
export class ReadingsPO {
  private readonly page: Page;
  private readonly dataGrid: Locator;
  private readonly dialog: Locator;

  constructor(page: Page) {
    this.page = page;
    this.dataGrid = page.locator('.MuiDataGrid-root');
    this.dialog = page.locator('.MuiDialog-root');
  }

  // ── Actions ────────────────────────────────────────────────

  /** Click the "Nueva" button to open create form */
  async clickNew(): Promise<void> {
    await this.page.getByRole('button', { name: 'Nueva' }).click();
    await this.dialog.waitFor({ state: 'visible' });
  }

  /** Fill the reading form fields */
  async fillForm(data: {
    cups?: string;
    fecha?: string;
    valor?: string;
    tipo?: string;
  }): Promise<void> {
    if (data.cups !== undefined) {
      await this.dialog.getByLabel('CUPS').fill(data.cups);
    }
    if (data.fecha !== undefined) {
      await this.dialog.getByLabel(/Fecha/).fill(data.fecha);
    }
    if (data.valor !== undefined) {
      await this.dialog.getByLabel('Lectura (m³)').fill(data.valor);
    }
    if (data.tipo !== undefined) {
      await this.dialog.getByLabel('Tipo').click();
      await this.page.getByRole('option', { name: data.tipo }).click();
    }
  }

  /** Click the "Guardar" button in the dialog */
  async clickSave(): Promise<void> {
    await this.dialog.getByRole('button', { name: 'Guardar' }).click();
  }

  /** Click the "Cancelar" button in the dialog */
  async clickCancel(): Promise<void> {
    await this.dialog.getByRole('button', { name: 'Cancelar' }).click();
  }

  /** Click the edit button for a row identified by text */
  async clickEdit(rowText: string): Promise<void> {
    const row = this.dataGrid.getByRole('row').filter({ hasText: rowText });
    await row.getByRole('button', { name: 'editar' }).click();
    await this.dialog.waitFor({ state: 'visible' });
  }

  /** Click the delete button for a row */
  async clickDelete(rowText: string): Promise<void> {
    const row = this.dataGrid.getByRole('row').filter({ hasText: rowText });
    await row.getByRole('button', { name: 'eliminar' }).click();
  }

  /** Confirm deletion */
  async confirmDelete(): Promise<void> {
    const confirmDialog = this.page.locator('.MuiDialog-root').last();
    await confirmDialog.getByRole('button', { name: 'Eliminar' }).click();
  }

  /** Cancel deletion */
  async cancelDelete(): Promise<void> {
    const confirmDialog = this.page.locator('.MuiDialog-root').last();
    await confirmDialog.getByRole('button', { name: 'Cancelar' }).click();
  }

  /** Filter readings by CUPS */
  async filterByCups(cups: string): Promise<void> {
    await this.page.getByLabel('Filtrar por CUPS').fill(cups);
    await this.page.getByRole('button', { name: 'Buscar' }).click();
  }

  /** Clear the CUPS filter */
  async clearFilter(): Promise<void> {
    await this.page.getByRole('button', { name: 'Limpiar' }).click();
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
    const rows = this.dataGrid.locator('.MuiDataGrid-row');
    return rows.count();
  }

  async isFormOpen(): Promise<boolean> {
    return this.dialog.isVisible();
  }
}
