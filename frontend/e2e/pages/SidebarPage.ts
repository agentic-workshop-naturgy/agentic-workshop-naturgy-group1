/**
 * Page Object Model – Sidebar navigation.
 *
 * Encapsulates the navigation logic so test files stay concise.
 */

import { type Page } from '@playwright/test';

export class SidebarPage {
  constructor(private readonly page: Page) {}

  async goToSupplyPoints() {
    await this.page.getByRole('link', { name: /puntos de suministro/i }).click();
  }

  async goToReadings() {
    await this.page.getByRole('link', { name: /lecturas/i }).click();
  }

  async goToTariffs() {
    await this.page.getByRole('link', { name: /tarifa(rio)?/i }).click();
  }

  async goToConversionFactors() {
    await this.page.getByRole('link', { name: /factores de conversión/i }).click();
  }

  async goToTaxes() {
    await this.page.getByRole('link', { name: /impuestos/i }).click();
  }

  async goToBilling() {
    await this.page.getByRole('link', { name: /factura(ción)?/i }).click();
  }

  async goToClientes() {
    await this.page.getByRole('link', { name: /clientes/i }).click();
  }
}
