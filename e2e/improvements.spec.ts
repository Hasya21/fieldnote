import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
test('guest compares products, preserves URL state, exports and passes accessibility checks', async ({
  page,
}) => {
  await page.goto('/login');
  await page.getByRole('button', { name: 'Explore the demo' }).click();
  await expect(page.locator('app-kpi')).toHaveCount(5);
  expect(
    (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze())
      .violations,
  ).toEqual([]);
  await page.getByRole('link', { name: 'Products', exact: true }).click();
  await expect(page.locator('tbody tr')).toHaveCount(8);
  await page.locator('tbody input[type=checkbox]').nth(0).check();
  await page.locator('tbody input[type=checkbox]').nth(1).check();
  await expect(page.getByRole('region', { name: 'Product comparison' })).toBeVisible();
  await expect(page.locator('.comparison-cards article')).toHaveCount(2);
  await page.locator('tbody input[type=checkbox]').nth(2).check();
  await expect(page.locator('tbody input[type=checkbox]').nth(3)).toBeDisabled();
  await expect(page).toHaveURL(/compare=/);
  await page.screenshot({ path: 'docs/screenshots/product-comparison.png', fullPage: true });
  expect(
    (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze())
      .violations,
  ).toEqual([]);
  await page.getByLabel('Region', { exact: true }).selectOption('North');
  await expect(page).toHaveURL(/region=North/);
  await page.getByRole('link', { name: 'Sales explorer' }).click();
  await expect(page.getByLabel('Region', { exact: true })).toHaveValue('North');
  await expect(page.locator('tbody tr')).toHaveCount(10);
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export matching orders (CSV)' }).click();
  expect((await download).suggestedFilename()).toMatch(/\.csv$/);
  await page.locator('tbody tr').first().getByRole('button').click();
  await expect(page.locator('tbody tr.selected')).toHaveCount(1);
  expect(
    (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze())
      .violations,
  ).toEqual([]);
});
test('mobile order sheet traps focus and closes with Escape', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/login?returnUrl=%2Fanalytics');
  await page.getByRole('button', { name: 'Explore the demo' }).click();
  await expect(page.locator('tbody tr')).toHaveCount(10);
  const row = page.locator('tbody tr').first().getByRole('button');
  await row.focus();
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog', { name: 'Order details' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Close order details' })).toBeFocused();
  expect(
    (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze())
      .violations,
  ).toEqual([]);
  await page.screenshot({ path: 'docs/screenshots/mobile-order.png', fullPage: true });
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(row).toBeFocused();
});
