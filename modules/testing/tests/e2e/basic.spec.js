const { test, expect } = require('@playwright/test');

test.describe('Basic Browser Tests', () => {
  test('should be able to navigate to external sites', async ({ page }) => {
    // Test basic browser functionality
    await page.goto('https://example.com');
    await expect(page).toHaveTitle(/Example Domain/);
    await expect(page.locator('h1')).toContainText('Example Domain');
  });

  test('should handle JavaScript execution', async ({ page }) => {
    await page.goto('data:text/html,<html><body><h1 id="title">Initial</h1><script>setTimeout(() => document.getElementById("title").textContent = "Updated", 100)</script></body></html>');
    
    // Wait for JavaScript to execute
    await page.waitForTimeout(200);
    await expect(page.locator('#title')).toContainText('Updated');
  });

  test('should handle form interactions', async ({ page }) => {
    await page.goto('data:text/html,<html><body><form><input type="text" id="input" placeholder="Enter text"><button type="submit" id="submit">Submit</button></form></body></html>');
    
    // Test form interaction
    await page.fill('#input', 'Test input');
    await expect(page.locator('#input')).toHaveValue('Test input');
    
    // Test button click
    await page.click('#submit');
  });

  test('should handle CSS and styling', async ({ page }) => {
    await page.goto('data:text/html,<html><head><style>.test { color: red; font-size: 20px; }</style></head><body><div class="test" id="styled">Styled Text</div></body></html>');
    
    // Check if CSS is applied
    const styledElement = page.locator('#styled');
    await expect(styledElement).toHaveCSS('color', 'rgb(255, 0, 0)');
    await expect(styledElement).toHaveCSS('font-size', '20px');
  });

  test('should handle responsive design', async ({ page }) => {
    await page.goto('data:text/html,<html><head><meta name="viewport" content="width=device-width, initial-scale=1"><style>@media (max-width: 600px) { .responsive { display: none; } }</style></head><body><div class="responsive" id="responsive">Responsive Element</div></body></html>');
    
    // Test desktop view
    await page.setViewportSize({ width: 1200, height: 800 });
    await expect(page.locator('#responsive')).toBeVisible();
    
    // Test mobile view
    await page.setViewportSize({ width: 400, height: 600 });
    await expect(page.locator('#responsive')).toBeHidden();
  });
});
