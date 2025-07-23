import { test, expect } from '@playwright/test';

test.describe('Next.js Application', () => {
  test('should load the login page', async ({ page }) => {
    await page.goto('http://localhost:3001/login');
    
    // Check if the page title is correct
    await expect(page).toHaveTitle(/登录 - KD之家/);
    
    // Check if the login form is present
    await expect(page.locator('h1')).toContainText('欢迎回到 KD之家');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should redirect to dashboard when accessing root', async ({ page }) => {
    await page.goto('http://localhost:3001/');
    
    // Should redirect to dashboard (but will redirect to login if not authenticated)
    await expect(page).toHaveURL(/\/(login|dashboard)/);
  });

  test('should show glass-morphism design elements', async ({ page }) => {
    await page.goto('http://localhost:3001/login');
    
    // Check for glass-morphism container
    const glassContainer = page.locator('.bg-white\\/70, .backdrop-blur-sm');
    await expect(glassContainer).toBeVisible();
  });

  test('should handle form validation', async ({ page }) => {
    await page.goto('http://localhost:3001/login');
    
    // Try to submit empty form
    await page.click('button[type="submit"]');
    
    // Check for HTML5 validation or custom validation messages
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    
    await expect(emailInput).toHaveAttribute('required');
    await expect(passwordInput).toHaveAttribute('required');
  });

  test('should be responsive', async ({ page }) => {
    // Test desktop view
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto('http://localhost:3001/login');
    
    const container = page.locator('.max-w-md');
    await expect(container).toBeVisible();
    
    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(container).toBeVisible();
  });

  test('should load with proper meta tags', async ({ page }) => {
    await page.goto('http://localhost:3001/login');
    
    // Check meta tags
    const description = page.locator('meta[name="description"]');
    await expect(description).toHaveAttribute('content', /登录到KD之家家务积分系统/);
    
    // Check viewport meta tag
    const viewport = page.locator('meta[name="viewport"]');
    await expect(viewport).toHaveAttribute('content', /width=device-width/);
  });

  test('should have proper accessibility attributes', async ({ page }) => {
    await page.goto('http://localhost:3001/login');
    
    // Check form labels
    const emailLabel = page.locator('label[for="email"]');
    const passwordLabel = page.locator('label[for="password"]');
    
    await expect(emailLabel).toBeVisible();
    await expect(passwordLabel).toBeVisible();
    
    // Check button accessibility
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toBeEnabled();
  });

  test('should handle navigation between pages', async ({ page }) => {
    await page.goto('http://localhost:3001/login');
    
    // Check if we can navigate to different routes (even if they redirect to login)
    const routes = ['/dashboard', '/tasks', '/leaderboard', '/profile'];
    
    for (const route of routes) {
      await page.goto(`http://localhost:3001${route}`);
      // Should either show the page or redirect to login
      await expect(page).toHaveURL(/\/(login|dashboard|tasks|leaderboard|profile)/);
    }
  });

  test('should load static assets correctly', async ({ page }) => {
    await page.goto('http://localhost:3001/login');
    
    // Check if CSS is loaded (by checking if styles are applied)
    const body = page.locator('body');
    await expect(body).toHaveClass(/antialiased/);
    
    // Check if the page has the expected background gradient
    const mainDiv = page.locator('.min-h-screen').first();
    await expect(mainDiv).toHaveClass(/bg-gradient-to-br/);
  });

  test('should work with JavaScript disabled', async ({ browser }) => {
    const context = await browser.newContext({
      javaScriptEnabled: false
    });
    const page = await context.newPage();
    
    await page.goto('http://localhost:3001/login');
    
    // Basic HTML should still be visible
    await expect(page.locator('h1')).toContainText('欢迎回到 KD之家');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    
    await context.close();
  });
});
