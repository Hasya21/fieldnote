import { test, expect, type Page } from '@playwright/test';
async function login(page: Page) {
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/login/);
  await page.getByLabel('Email address').fill(process.env['E2E_EMAIL'] ?? '');
  await page.getByLabel('Password', { exact: true }).fill(process.env['E2E_PASSWORD'] ?? '');
  await page.getByRole('button', { name: 'Open workspace' }).click();
  await expect(page.getByRole('heading', { name: 'Performance overview' })).toBeVisible();
  await expect(page.locator('app-kpi')).toHaveCount(5);
}
test('analyst explores the dashboard, filters, products, sales and logout', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await login(page);
  await expect(page.locator('canvas')).toHaveCount(5);
  await page.screenshot({ path: 'docs/screenshots/dashboard.png', fullPage: true });
  const revenue = await page.locator('app-kpi').first().locator('strong').textContent();
  await page.getByLabel('Category', { exact: true }).selectOption('Pantry');
  await expect(page.locator('app-kpi').first().locator('strong')).not.toHaveText(revenue ?? '');
  await page.getByLabel('Region', { exact: true }).selectOption('North');
  await page.getByLabel('Retailer', { exact: true }).selectOption('Daily Basket');
  await page.getByLabel('Segment', { exact: true }).selectOption('Value seekers');
  await expect(page.locator('canvas')).toHaveCount(5);
  await page.getByRole('link', { name: 'Products', exact: true }).click();
  await expect(page.locator('tbody tr')).toHaveCount(4);
  await page
    .getByRole('columnheader', { name: 'Revenue', exact: true })
    .getByRole('button')
    .click();
  await expect(page.getByRole('columnheader', { name: 'Revenue', exact: true })).toHaveAttribute(
    'aria-sort',
    'ascending',
  );
  await page.getByRole('button', { name: /Harvest Granola/ }).click();
  await expect(page.getByRole('heading', { name: 'Harvest Granola' })).toBeVisible();
  await page.getByRole('link', { name: 'Back to products' }).click();
  await page.getByRole('button', { name: 'Reset all filters' }).click();
  await expect(page.locator('tbody tr')).toHaveCount(8);
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByText('Page 2 of 2')).toBeVisible();
  await page.getByLabel('Search products').fill('not-a-product');
  await expect(page.getByText('No matching records', { exact: false })).toBeVisible();
  await page.getByRole('link', { name: 'Sales explorer' }).click();
  await expect(page.locator('tbody tr')).toHaveCount(10);
  await expect(page.getByRole('heading', { name: 'Transaction ledger' })).toBeVisible();
  const orderButton = page.locator('tbody tr').first().getByRole('button');
  const orderId = (await orderButton.innerText()).match(/order-\d+/)?.[0] ?? '';
  expect(orderId).not.toBe('');
  await orderButton.click();
  await expect(page.getByRole('complementary', { name: 'Transaction inspector' })).toContainText(
    orderId,
  );
  await expect(page.getByRole('link', { name: 'View product performance' })).toBeVisible();
  await page.screenshot({ path: 'docs/screenshots/sales-explorer.png', fullPage: true });
  await page.getByLabel('Search transactions').fill(orderId);
  await expect(page.locator('tbody tr')).toHaveCount(1);
  await page.getByLabel('Search transactions').fill('missing-order');
  await expect(page.getByText('No matching records', { exact: false })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Follow a single sale' })).toBeVisible();
  await page.getByRole('button', { name: 'Sign out' }).click();
  await expect(page).toHaveURL(/login/);
  expect(errors).toEqual([]);
});
test('mobile layout, invalid date selection and recoverable server errors', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page);
  await page.screenshot({ path: 'docs/screenshots/mobile.png', fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.getByLabel('From', { exact: true }).fill('2025-12-31');
  await page.getByLabel('To', { exact: true }).fill('2025-01-01');
  await expect(page.getByText('Filters have not been applied.', { exact: false })).toBeVisible();

  await page.getByRole('button', { name: 'Reset all filters' }).click();
  await expect(page.getByLabel('From', { exact: true })).toHaveValue('2025-07-01');
  await page.route('**/api/dashboard?**', (route) =>
    route.fulfill({ status: 503, json: { message: 'Unavailable' } }),
  );
  await page.getByRole('button', { name: 'Refresh data' }).click();
  await expect(page.getByRole('alert')).toContainText('temporarily unavailable');
  await page.unroute('**/api/dashboard?**');
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(page.locator('app-kpi')).toHaveCount(5);
  await page.getByRole('button', { name: 'Toggle navigation' }).click();
  await page.getByRole('link', { name: 'Products', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Product performance' })).toBeVisible();
});
