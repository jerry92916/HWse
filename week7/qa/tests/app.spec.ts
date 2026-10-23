import { test, expect } from '@playwright/test';

test('E2E @e2e shows the calculator and its default values', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveTitle('計算｜簡單計算機');
  await expect(page.getByRole('heading', { name: '今天要算什麼？' })).toBeVisible();
  await expect(page.getByLabel('第一個數字')).toHaveValue('2');
  await expect(page.getByLabel('第二個數字')).toHaveValue('3');
  await expect(page.getByRole('button', { name: /計算結果/ })).toBeVisible();
});

test('E2E @e2e submits operands and displays the sum', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('第一個數字').fill('100');
  await page.getByLabel('第二個數字').fill('300');
  await page.getByRole('button', { name: /計算結果/ }).click();

  await expect(page.locator('#result')).toHaveText('400');
  await expect(page.getByRole('alert')).toBeEmpty();
});

test('E2E @e2e displays a negative sum', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('第一個數字').fill('-8');
  await page.getByLabel('第二個數字').fill('-3');
  await page.getByRole('button', { name: /計算結果/ }).click();

  await expect(page.locator('#result')).toHaveText('-11');
});

test('E2E @e2e clears the previous result before showing the next one', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('第一個數字').fill('4');
  await page.getByLabel('第二個數字').fill('6');
  await page.getByRole('button', { name: /計算結果/ }).click();
  await expect(page.locator('#result')).toHaveText('10');

  await page.getByLabel('第一個數字').fill('7');
  await page.getByLabel('第二個數字').fill('8');
  await page.getByRole('button', { name: /計算結果/ }).click();

  await expect(page.locator('#result')).toHaveText('15');
});

test('E2E @e2e displays an error when the result is too large', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('第一個數字').fill('1e308');
  await page.getByLabel('第二個數字').fill('10');
  await page.getByLabel('乘法').check();
  await page.getByRole('button', { name: /計算結果/ }).click();

  await expect(page.getByRole('alert')).toHaveText('計算結果太大，超出可計算範圍。');
  await expect(page.locator('#result')).toHaveText('—');
});

test('E2E @e2e switches to subtraction', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('第一個數字').fill('12');
  await page.getByLabel('第二個數字').fill('5');
  await page.getByLabel('減法').check();
  await page.getByRole('button', { name: /計算結果/ }).click();

  await expect(page.locator('#result')).toHaveText('7');
});

test('E2E @e2e switches to multiplication', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('第一個數字').fill('6');
  await page.getByLabel('第二個數字').fill('7');
  await page.getByLabel('乘法').check();
  await page.getByRole('button', { name: /計算結果/ }).click();

  await expect(page.locator('#result')).toHaveText('42');
});

test('E2E @e2e divides decimals and explains division by zero', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('第一個數字').fill('7');
  await page.getByLabel('第二個數字').fill('2');
  await page.getByLabel('除法').check();
  await page.getByRole('button', { name: /計算結果/ }).click();
  await expect(page.locator('#result')).toHaveText('3.5');

  await page.getByLabel('第二個數字').fill('0');
  await page.getByRole('button', { name: /計算結果/ }).click();
  await expect(page.getByRole('alert')).toHaveText('除數不能是 0。');
});

test('E2E @e2e accepts decimal inputs', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('第一個數字').fill('0.1');
  await page.getByLabel('第二個數字').fill('0.2');
  await page.getByRole('button', { name: /計算結果/ }).click();

  await expect(page.locator('#result')).toHaveText('0.3');
});

test('E2E @e2e displays numbers larger than 32-bit integers', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('第一個數字').fill('2147483648');
  await page.getByLabel('第二個數字').fill('1');
  await page.getByRole('button', { name: /計算結果/ }).click();

  await expect(page.locator('#result')).toHaveText('2,147,483,649');
});

test('E2E @e2e swaps operands', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '交換兩個數字' }).click();

  await expect(page.getByLabel('第一個數字')).toHaveValue('3');
  await expect(page.getByLabel('第二個數字')).toHaveValue('2');
});

test('E2E @e2e adds a history entry and reloads it when selected', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('第一個數字').fill('8');
  await page.getByLabel('第二個數字').fill('4');
  await page.getByLabel('減法').check();
  await page.getByRole('button', { name: /計算結果/ }).click();

  const historyEntry = page.getByRole('button', { name: '載入 8 − 4 等於 4' });
  await expect(historyEntry).toBeVisible();
  await page.getByRole('button', { name: '清除', exact: true }).click();
  await historyEntry.click();

  await expect(page.getByLabel('第一個數字')).toHaveValue('8');
  await expect(page.getByLabel('第二個數字')).toHaveValue('4');
  await expect(page.getByLabel('減法')).toBeChecked();
  await expect(page.locator('#result')).toHaveText('4');
});

test('E2E @e2e clears calculation history', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /計算結果/ }).click();
  await expect(page.getByRole('button', { name: /載入 2 \+ 3 等於 5/ })).toBeVisible();

  await page.getByRole('button', { name: '清除紀錄' }).click();

  await expect(page.getByRole('button', { name: /載入/ })).toHaveCount(0);
  await expect(page.getByText(/完成計算後，紀錄會出現在這裡/)).toBeVisible();
});

test('E2E @e2e clears input and result', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /計算結果/ }).click();
  await expect(page.locator('#result')).toHaveText('5');
  await page.getByRole('button', { name: '清除', exact: true }).click();

  await expect(page.getByLabel('第一個數字')).toHaveValue('');
  await expect(page.getByLabel('第二個數字')).toHaveValue('');
  await expect(page.locator('#result')).toHaveText('—');
});
