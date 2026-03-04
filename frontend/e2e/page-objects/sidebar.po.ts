import type { Page, Locator } from '@playwright/test';

/**
 * Page Object for the permanent MUI Drawer sidebar navigation.
 *
 * The Gas Billing app uses React state-based navigation (no URL routes).
 * All page navigation must go through sidebar clicks.
 */
export class SidebarPO {
  private readonly drawer: Locator;

  constructor(private readonly page: Page) {
    this.drawer = page.locator('.MuiDrawer-root');
  }

  /**
   * Navigate to a section by clicking its sidebar label.
   * @param label — Visible text in Spanish, e.g. "Puntos de Suministro"
   */
  async navigateTo(label: string): Promise<void> {
    // Use role-based selector to avoid matching section headers (Typography overline)
    // which share text with button labels (e.g. "Facturación" section vs button)
    const button = this.drawer.getByRole('button', { name: label });
    await button.click();
    // Wait for any loading indicator to appear and disappear
    // MUI LinearProgress is used across all pages
    const progress = this.page.locator('.MuiLinearProgress-root');
    // Give a small window for progress to appear, then wait for it to disappear
    await progress.waitFor({ state: 'hidden', timeout: 10_000 }).catch(() => {
      // Progress may never appear if data loads instantly — that's OK
    });
  }

  /** Navigate to Puntos de Suministro */
  async goToSupplyPoints(): Promise<void> {
    await this.navigateTo('Puntos de Suministro');
  }

  /** Navigate to Lecturas */
  async goToReadings(): Promise<void> {
    await this.navigateTo('Lecturas');
  }

  /** Navigate to Tarifario */
  async goToTariffs(): Promise<void> {
    await this.navigateTo('Tarifario');
  }

  /** Navigate to Factores Conversión */
  async goToConversionFactors(): Promise<void> {
    await this.navigateTo('Factores Conversión');
  }

  /** Navigate to Impuestos (IVA) */
  async goToTaxes(): Promise<void> {
    await this.navigateTo('Impuestos (IVA)');
  }

  /** Navigate to Facturación */
  async goToBilling(): Promise<void> {
    await this.navigateTo('Facturación');
  }

  /** Navigate to Facturas */
  async goToInvoices(): Promise<void> {
    await this.navigateTo('Facturas');
  }

  /** Navigate to Gráfico Consumo */
  async goToConsumptionChart(): Promise<void> {
    await this.navigateTo('Gráfico Consumo');
  }

  /** Navigate to Recomendador Tarifa */
  async goToTariffRecommender(): Promise<void> {
    await this.navigateTo('Recomendador Tarifa');
  }

  /** Check if a nav item is currently selected */
  async isSelected(label: string): Promise<boolean> {
    const button = this.drawer.getByRole('button', { name: label });
    const classList = await button.getAttribute('class');
    return classList?.includes('Mui-selected') ?? false;
  }
}
