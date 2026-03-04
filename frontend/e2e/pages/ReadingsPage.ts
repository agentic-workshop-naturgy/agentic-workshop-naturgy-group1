/**
 * Page Object Model – Readings screen.
 */

import { type Page, type Locator } from '@playwright/test';

export class ReadingsPage {
  readonly newButton: Locator;
  readonly saveButton: Locator;
  readonly cupsFilter: Locator;
  readonly searchButton: Locator;
  readonly dataGrid: Locator;

  constructor(private readonly page: Page) {
    this.newButton = page.getByRole('button', { name: /nuevo/i });
    this.saveButton = page.getByRole('button', { name: /guardar/i });
    this.cupsFilter = page.getByLabel(/cups/i);
    this.searchButton = page.getByRole('button', { name: /buscar/i });
    this.dataGrid = page.locator('[role="grid"]');
  }

  async goto() {
    await this.page.goto('/');
    await this.page.getByRole('link', { name: /lecturas/i }).click();
  }

  async clickNew() {
    await this.newButton.click();
  }

  async fillForm(data: { cups: string; fecha: string; lectura: string }) {
    await this.page.getByLabel(/cups/i).fill(data.cups);
    await this.page.getByLabel(/fecha/i).fill(data.fecha);
    await this.page.getByLabel(/lectura/i).fill(data.lectura);
  }

  async save() {
    await this.saveButton.click();
  }

  async filterByCups(cups: string) {
    await this.cupsFilter.fill(cups);
    await this.searchButton.click();
  }
}
