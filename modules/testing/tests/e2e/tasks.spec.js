const { test, expect } = require('@playwright/test');

test.describe('Task Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login as advisor
    await page.goto('/');
    await page.fill('input[name="username"]', 'e2e_advisor');
    await page.fill('input[name="password"]', 'testpass123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard*', { timeout: 10000 });
  });

  test('should display tasks dashboard', async ({ page }) => {
    // Navigate to tasks section
    await page.click('a[href="#tasks"]');
    
    // Check if tasks section is visible
    await expect(page.locator('.tasks-section')).toBeVisible();
    await expect(page.locator('.task-list')).toBeVisible();
    await expect(page.locator('.create-task-btn')).toBeVisible();
  });

  test('should create new task successfully', async ({ page }) => {
    // Navigate to tasks section
    await page.click('a[href="#tasks"]');
    
    // Click create task button
    await page.click('.create-task-btn');
    
    // Fill task form
    const timestamp = Date.now();
    await page.fill('input[name="title"]', `Test Task ${timestamp}`);
    await page.fill('textarea[name="description"]', 'This is a test task description');
    await page.selectOption('select[name="taskType"]', 'PM');
    await page.fill('input[name="points"]', '25');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for success message
    await expect(page.locator('.success-message')).toBeVisible();
    
    // Check if task appears in list
    await expect(page.locator('.task-list')).toContainText(`Test Task ${timestamp}`);
  });

  test('should assign task to user', async ({ page }) => {
    // Navigate to tasks section
    await page.click('a[href="#tasks"]');
    
    // Find first available task
    const taskCard = page.locator('.task-card').first();
    await expect(taskCard).toBeVisible();
    
    // Click assign button
    await taskCard.locator('.assign-btn').click();
    
    // Select user from dropdown
    await page.selectOption('select[name="assignedTo"]', 'e2e_member');
    
    // Confirm assignment
    await page.click('.confirm-assign-btn');
    
    // Wait for success message
    await expect(page.locator('.success-message')).toBeVisible();
  });

  test('should update task status', async ({ page }) => {
    // Navigate to tasks section
    await page.click('a[href="#tasks"]');
    
    // Find first task
    const taskCard = page.locator('.task-card').first();
    await expect(taskCard).toBeVisible();
    
    // Click status dropdown
    await taskCard.locator('.status-dropdown').click();
    
    // Select new status
    await page.click('option[value="in_progress"]');
    
    // Wait for status update
    await expect(taskCard.locator('.status-badge')).toContainText('In Progress');
  });

  test('should filter tasks by status', async ({ page }) => {
    // Navigate to tasks section
    await page.click('a[href="#tasks"]');
    
    // Click filter dropdown
    await page.click('.filter-dropdown');
    
    // Select pending filter
    await page.click('option[value="pending"]');
    
    // Check if only pending tasks are shown
    const taskCards = page.locator('.task-card');
    const count = await taskCards.count();
    
    for (let i = 0; i < count; i++) {
      await expect(taskCards.nth(i).locator('.status-badge')).toContainText('Pending');
    }
  });

  test('should search tasks by title', async ({ page }) => {
    // Navigate to tasks section
    await page.click('a[href="#tasks"]');
    
    // Use search box
    await page.fill('.search-input', 'Test Task');
    
    // Wait for search results
    await page.waitForTimeout(1000);
    
    // Check if search results contain the search term
    const taskCards = page.locator('.task-card');
    const count = await taskCards.count();
    
    if (count > 0) {
      for (let i = 0; i < count; i++) {
        await expect(taskCards.nth(i).locator('.task-title')).toContainText('Test Task');
      }
    }
  });
});
