import { expect, Page } from '@playwright/test';

export async function openApp(page: Page): Promise<void> {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 6 })).toBeVisible();
}

export async function goToModule(page: Page, moduleName: RegExp | string): Promise<void> {
  const navButton = page.getByRole('button', { name: moduleName }).first();
  await navButton.click();
}

export async function saveDialog(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Guardar' }).click();
}

export async function cancelDialog(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Cancelar' }).click();
}

export async function confirmDelete(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Eliminar' }).click();
}
