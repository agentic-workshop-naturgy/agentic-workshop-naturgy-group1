/**
 * Page Object Model – Supply Points screen.
 */

import { type Page, type Locator } from '@playwright/test';

export class SupplyPointsPage {
  readonly newButton: Locator;
  readonly saveButton: Locator;
  readonly dataGrid: Locator;

  constructor(private readonly page: Page) {
    this.newButton = page.getByRole('button', { name: /nuevo/i });
    this.saveButton = page.getByRole('button', { name: /guardar/i });
    this.dataGrid = page.locator('[role="grid"]');
  }

  async goto() {
    await this.page.goto('/');
    // Navigate via sidebar
    await this.page.getByRole('link', { name: /puntos de suministro/i }).click();
  }

  async clickNew() {
    await this.newButton.click();
  }

  async fillForm(data: { cups: string; zona: string; tarifa: string; estado?: string }) {
    await this.page.getByLabel(/cups/i).fill(data.cups);
    await this.page.getByLabel(/zona/i).fill(data.zona);
    await this.page.getByLabel(/tarifa/i).fill(data.tarifa);
    if (data.estado) {
      await this.page.getByLabel(/estado/i).fill(data.estado);
    }
  }

  async save() {
    await this.saveButton.click();
  }

  /** Returns the number of rows currently shown in the grid */
  async rowCount(): Promise<number> {
    return this.page.locator('[role="row"]').count();
  }
}
