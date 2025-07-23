const { test, expect } = require('@playwright/test');

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display login form on homepage', async ({ page }) => {
    // Check if login form is visible
    await expect(page.locator('#loginForm')).toBeVisible();
    await expect(page.locator('input[name="username"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should show registration form when clicking register link', async ({ page }) => {
    // Click register link
    await page.click('a[href="#register"]');
    
    // Check if registration form is visible
    await expect(page.locator('#registerForm')).toBeVisible();
    await expect(page.locator('input[name="username"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('select[name="role"]')).toBeVisible();
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    // Fill login form
    await page.fill('input[name="username"]', 'e2e_advisor');
    await page.fill('input[name="password"]', 'testpass123');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for navigation to dashboard
    await page.waitForURL('**/dashboard*', { timeout: 10000 });
    
    // Check if dashboard is loaded
    await expect(page.locator('.dashboard')).toBeVisible();
    await expect(page.locator('.user-info')).toContainText('e2e_advisor');
  });

  test('should show error message with invalid credentials', async ({ page }) => {
    // Fill login form with invalid credentials
    await page.fill('input[name="username"]', 'invalid_user');
    await page.fill('input[name="password"]', 'wrong_password');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for error message
    await expect(page.locator('.error-message')).toBeVisible();
    await expect(page.locator('.error-message')).toContainText('Invalid credentials');
  });

  test('should register new user successfully', async ({ page }) => {
    // Click register link
    await page.click('a[href="#register"]');
    
    // Fill registration form
    const timestamp = Date.now();
    await page.fill('input[name="username"]', `testuser_${timestamp}`);
    await page.fill('input[name="email"]', `testuser_${timestamp}@test.com`);
    await page.fill('input[name="password"]', 'testpass123');
    await page.selectOption('select[name="role"]', 'member');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for success message or redirect
    await expect(page.locator('.success-message')).toBeVisible();
  });

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.fill('input[name="username"]', 'e2e_advisor');
    await page.fill('input[name="password"]', 'testpass123');
    await page.click('button[type="submit"]');
    
    // Wait for dashboard
    await page.waitForURL('**/dashboard*', { timeout: 10000 });
    
    // Click logout button
    await page.click('.logout-btn');
    
    // Should redirect to homepage
    await page.waitForURL('/', { timeout: 10000 });
    await expect(page.locator('#loginForm')).toBeVisible();
  });
});
