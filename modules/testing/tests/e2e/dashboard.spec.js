const { test, expect } = require('@playwright/test');

test.describe('Dashboard Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Login as advisor
    await page.goto('/');
    await page.fill('input[name="username"]', 'e2e_advisor');
    await page.fill('input[name="password"]', 'testpass123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard*', { timeout: 10000 });
  });

  test('should display dashboard components', async ({ page }) => {
    // Check main dashboard elements
    await expect(page.locator('.dashboard')).toBeVisible();
    await expect(page.locator('.user-info')).toBeVisible();
    await expect(page.locator('.navigation-menu')).toBeVisible();
    await expect(page.locator('.main-content')).toBeVisible();
  });

  test('should display user statistics', async ({ page }) => {
    // Check if statistics cards are visible
    await expect(page.locator('.stats-card')).toBeVisible();
    
    // Check for specific stat types
    await expect(page.locator('.total-points')).toBeVisible();
    await expect(page.locator('.completed-tasks')).toBeVisible();
    await expect(page.locator('.pending-tasks')).toBeVisible();
  });

  test('should display recent activities', async ({ page }) => {
    // Check if recent activities section exists
    await expect(page.locator('.recent-activities')).toBeVisible();
    await expect(page.locator('.activity-list')).toBeVisible();
  });

  test('should navigate between sections', async ({ page }) => {
    // Test navigation to tasks
    await page.click('a[href="#tasks"]');
    await expect(page.locator('.tasks-section')).toBeVisible();
    
    // Test navigation to leaderboard
    await page.click('a[href="#leaderboard"]');
    await expect(page.locator('.leaderboard-section')).toBeVisible();
    
    // Test navigation to profile
    await page.click('a[href="#profile"]');
    await expect(page.locator('.profile-section')).toBeVisible();
    
    // Test navigation back to dashboard
    await page.click('a[href="#dashboard"]');
    await expect(page.locator('.dashboard-overview')).toBeVisible();
  });

  test('should display leaderboard', async ({ page }) => {
    // Navigate to leaderboard
    await page.click('a[href="#leaderboard"]');
    
    // Check leaderboard components
    await expect(page.locator('.leaderboard-section')).toBeVisible();
    await expect(page.locator('.leaderboard-table')).toBeVisible();
    await expect(page.locator('.user-rank')).toBeVisible();
  });

  test('should update profile information', async ({ page }) => {
    // Navigate to profile
    await page.click('a[href="#profile"]');
    
    // Check profile form
    await expect(page.locator('.profile-form')).toBeVisible();
    await expect(page.locator('input[name="username"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    
    // Update profile information
    await page.fill('input[name="username"]', 'e2e_advisor_updated');
    
    // Save changes
    await page.click('.save-profile-btn');
    
    // Wait for success message
    await expect(page.locator('.success-message')).toBeVisible();
  });

  test('should handle avatar selection', async ({ page }) => {
    // Navigate to profile
    await page.click('a[href="#profile"]');
    
    // Check if avatar section exists
    await expect(page.locator('.avatar-section')).toBeVisible();
    
    // Click avatar selection button
    await page.click('.select-avatar-btn');
    
    // Check if avatar options are displayed
    await expect(page.locator('.avatar-options')).toBeVisible();
    
    // Select an avatar
    await page.click('.avatar-option').first();
    
    // Save avatar selection
    await page.click('.save-avatar-btn');
    
    // Wait for success message
    await expect(page.locator('.success-message')).toBeVisible();
  });

  test('should display responsive design on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check if mobile navigation is visible
    await expect(page.locator('.mobile-nav-toggle')).toBeVisible();
    
    // Click mobile menu toggle
    await page.click('.mobile-nav-toggle');
    
    // Check if mobile menu is expanded
    await expect(page.locator('.mobile-nav-menu')).toBeVisible();
  });
});
