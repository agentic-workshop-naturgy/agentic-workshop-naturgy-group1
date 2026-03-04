import type { Page, Locator } from '@playwright/test';

/**
 * Page Object for Tarifario (Tariffs) CRUD page.
 */
export class TariffsPO {
  private readonly page: Page;
  private readonly dataGrid: Locator;
  private readonly dialog: Locator;

  constructor(page: Page) {
    this.page = page;
    this.dataGrid = page.locator('.MuiDataGrid-root');
    this.dialog = page.locator('.MuiDialog-root');
  }

  // ── Actions ────────────────────────────────────────────────

  /** Click the "Nueva" / "Nuevo" button to open create form */
  async clickNew(): Promise<void> {
    await this.page.getByRole('button', { name: /Nuev/ }).click();
    await this.dialog.waitFor({ state: 'visible' });
  }

  /** Fill the tariff form fields */
  async fillForm(data: {
    nombre?: string;
    fijo?: string;
    variable?: string;
    vigencia?: string;
  }): Promise<void> {
    if (data.nombre !== undefined) {
      await this.dialog.getByLabel(/Nombre|Código/).fill(data.nombre);
    }
    if (data.fijo !== undefined) {
      await this.dialog.getByLabel(/Fijo|Término fijo/).fill(data.fijo);
    }
    if (data.variable !== undefined) {
      await this.dialog.getByLabel(/Variable|Término variable/).fill(data.variable);
    }
    if (data.vigencia !== undefined) {
      await this.dialog.getByLabel(/Vigencia|Fecha/).fill(data.vigencia);
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
    const progress = this.page.locator('.MuiLinearProgress-root');
    await progress.waitFor({ state: 'hidden', timeout: 10_000 }).catch(() => {
      // Progress bar may not appear if the list refresh is very fast.
    });

    const row = this.dataGrid.locator('.MuiDataGrid-row').filter({ hasText: text }).first();
    try {
      await row.waitFor({ state: 'visible', timeout: 10_000 });
      return true;
    } catch {
      return false;
    }
  }

  async getRowCount(): Promise<number> {
    return this.dataGrid.locator('.MuiDataGrid-row').count();
  }

  async isFormOpen(): Promise<boolean> {
    return this.dialog.isVisible();
  }

  /** Check if field-level validation errors are shown */
  async hasFieldErrors(): Promise<boolean> {
    const helpers = this.dialog.locator('.Mui-error');
    return (await helpers.count()) > 0;
  }
}
