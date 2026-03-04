import type { Page, Locator } from '@playwright/test';

/**
 * Page Object for Puntos de Suministro (Supply Points) CRUD page.
 * Encapsulates MUI DataGrid + Dialog form interactions.
 */
export class SupplyPointsPO {
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
    await this.page.getByRole('button', { name: 'Nuevo' }).click();
    await this.dialog.waitFor({ state: 'visible' });
  }

  /** Fill the supply point form fields */
  async fillForm(data: {
    cups?: string;
    zona?: string;
    tarifa?: string;
    estado?: string;
  }): Promise<void> {
    if (data.cups !== undefined) {
      await this.dialog.getByLabel('CUPS').fill(data.cups);
    }
    if (data.zona !== undefined) {
      await this.dialog.getByLabel('Zona').fill(data.zona);
    }
    if (data.tarifa !== undefined) {
      await this.dialog.getByLabel('Tarifa').fill(data.tarifa);
    }
    if (data.estado !== undefined) {
      await this.dialog.getByLabel('Estado').click();
      await this.page.getByRole('option', { name: data.estado, exact: true }).click();
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

  /** Click the edit button for a row identified by CUPS */
  async clickEdit(cups: string): Promise<void> {
    const row = this.dataGrid.getByRole('row').filter({ hasText: cups });
    await row.getByRole('button', { name: 'editar' }).click();
    await this.dialog.waitFor({ state: 'visible' });
  }

  /** Click the delete button for a row identified by CUPS */
  async clickDelete(cups: string): Promise<void> {
    const row = this.dataGrid.getByRole('row').filter({ hasText: cups });
    await row.getByRole('button', { name: 'eliminar' }).click();
  }

  /** Confirm deletion in the ConfirmDialog */
  async confirmDelete(): Promise<void> {
    const confirmDialog = this.page.locator('.MuiDialog-root').last();
    await confirmDialog.getByRole('button', { name: 'Eliminar' }).click();
  }

  /** Cancel deletion in the ConfirmDialog */
  async cancelDelete(): Promise<void> {
    const confirmDialog = this.page.locator('.MuiDialog-root').last();
    await confirmDialog.getByRole('button', { name: 'Cancelar' }).click();
  }

  // ── Assertions / Queries ───────────────────────────────────

  /** Get the success snackbar message */
  async getSuccessMessage(): Promise<string> {
    const alert = this.page.locator('.MuiSnackbar-root .MuiAlert-message');
    await alert.waitFor({ state: 'visible', timeout: 5_000 });
    return alert.textContent() as Promise<string>;
  }

  /** Get the error alert message (page-level) */
  async getErrorMessage(): Promise<string> {
    const alert = this.page.locator('.MuiAlert-standardError .MuiAlert-message');
    await alert.waitFor({ state: 'visible', timeout: 5_000 });
    return alert.textContent() as Promise<string>;
  }

  /** Get form-level error message (inside dialog) */
  async getFormError(): Promise<string> {
    const alert = this.dialog.locator('.MuiAlert-standardError .MuiAlert-message');
    await alert.waitFor({ state: 'visible', timeout: 5_000 });
    return alert.textContent() as Promise<string>;
  }

  /** Check if a row with the given CUPS is visible in the DataGrid */
  async isRowVisible(cups: string): Promise<boolean> {
    const row = this.dataGrid.getByRole('row').filter({ hasText: cups });
    return row.isVisible();
  }

  /** Get the number of data rows in the DataGrid */
  async getRowCount(): Promise<number> {
    const rows = this.dataGrid.locator('.MuiDataGrid-row');
    return rows.count();
  }

  /** Check if the create/edit dialog is visible */
  async isFormOpen(): Promise<boolean> {
    return this.dialog.isVisible();
  }

  /** Get field validation error by field label */
  async getFieldError(label: string): Promise<string | null> {
    const field = this.dialog.locator(`.MuiFormControl-root:has([aria-label="${label}"]), .MuiTextField-root:has(label:text("${label}"))`);
    const helperText = field.locator('.MuiFormHelperText-root');
    if (await helperText.isVisible()) {
      return helperText.textContent();
    }
    return null;
  }
}
