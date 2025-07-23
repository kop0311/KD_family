import { test, expect } from '@playwright/test';

test.describe('任务管理功能', () => {
  test.beforeEach(async ({ page }) => {
    // 模拟登录状态
    await page.goto('/');
    
    // 如果有登录页面，进行登录
    const loginButton = page.locator('text=登录');
    if (await loginButton.isVisible()) {
      await page.fill('[placeholder*="用户名"]', 'testuser');
      await page.fill('[placeholder*="密码"]', 'password123');
      await page.click('button[type="submit"]');
      await page.waitForURL('/dashboard');
    }
  });

  test('应该能够查看任务列表', async ({ page }) => {
    await page.goto('/tasks');
    
    // 检查页面标题
    await expect(page.locator('h1')).toContainText('任务管理');
    
    // 检查是否有创建任务按钮
    await expect(page.locator('text=创建任务')).toBeVisible();
    
    // 检查搜索框
    await expect(page.locator('[placeholder*="搜索任务"]')).toBeVisible();
    
    // 检查过滤器
    await expect(page.locator('select')).toBeVisible();
  });

  test('应该能创建新任务', async ({ page }) => {
    await page.goto('/tasks');
    
    // 点击创建任务按钮
    await page.click('text=创建任务');
    await page.waitForURL('/tasks/create');

    // 填写任务表单
    await page.fill('[placeholder*="输入任务标题"]', '测试任务');
    await page.fill('[placeholder*="详细描述任务内容"]', '这是一个测试任务的详细描述');
    
    // 选择任务类型
    await page.selectOption('select[name="taskType"]', 'PM');
    
    // 设置积分
    await page.fill('input[type="number"]', '15');
    
    // 设置截止日期
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateString = tomorrow.toISOString().slice(0, 16);
    await page.fill('input[type="datetime-local"]', dateString);

    // 提交表单
    await page.click('button[type="submit"]');
    
    // 等待跳转到任务列表
    await page.waitForURL('/tasks');
    
    // 验证任务已创建
    await expect(page.locator('text=测试任务')).toBeVisible();
  });

  test('应该能搜索任务', async ({ page }) => {
    await page.goto('/tasks');
    
    // 在搜索框中输入搜索词
    await page.fill('[placeholder*="搜索任务"]', '测试');
    
    // 等待搜索结果
    await page.waitForTimeout(500);
    
    // 验证搜索结果
    const taskCards = page.locator('[data-testid="task-card"]');
    const count = await taskCards.count();
    
    if (count > 0) {
      // 如果有结果，验证包含搜索词
      const firstTask = taskCards.first();
      const taskText = await firstTask.textContent();
      expect(taskText?.toLowerCase()).toContain('测试');
    }
  });

  test('应该能过滤任务', async ({ page }) => {
    await page.goto('/tasks');
    
    // 选择过滤器
    await page.selectOption('select', 'pending');
    
    // 等待过滤结果
    await page.waitForTimeout(500);
    
    // 验证过滤结果
    const statusBadges = page.locator('text=待认领');
    const count = await statusBadges.count();
    
    // 如果有待认领任务，验证状态
    if (count > 0) {
      await expect(statusBadges.first()).toBeVisible();
    }
  });

  test('应该能认领任务', async ({ page }) => {
    await page.goto('/tasks');
    
    // 查找待认领的任务
    const pendingTask = page.locator('[data-testid="task-card"]').filter({
      hasText: '待认领'
    }).first();
    
    if (await pendingTask.isVisible()) {
      // 点击认领按钮
      await pendingTask.locator('text=认领任务').click();
      
      // 等待状态更新
      await page.waitForTimeout(1000);
      
      // 验证状态已更新
      await expect(pendingTask.locator('text=已认领')).toBeVisible();
      await expect(pendingTask.locator('text=开始执行')).toBeVisible();
    }
  });

  test('应该能完成任务', async ({ page }) => {
    await page.goto('/tasks');
    
    // 查找进行中的任务
    const inProgressTask = page.locator('[data-testid="task-card"]').filter({
      hasText: '进行中'
    }).first();
    
    if (await inProgressTask.isVisible()) {
      // 点击完成任务按钮
      await inProgressTask.locator('text=完成任务').click();
      
      // 等待成功动画
      await expect(page.locator('[data-testid="success-animation"]')).toBeVisible();
      
      // 等待状态更新
      await page.waitForTimeout(2000);
      
      // 验证状态已更新
      await expect(inProgressTask.locator('text=已完成')).toBeVisible();
    }
  });

  test('应该显示任务详情', async ({ page }) => {
    await page.goto('/tasks');
    
    // 查找第一个任务卡片
    const firstTask = page.locator('[data-testid="task-card"]').first();
    
    if (await firstTask.isVisible()) {
      // 验证任务卡片包含必要信息
      await expect(firstTask.locator('h3')).toBeVisible(); // 任务标题
      await expect(firstTask.locator('text=积分')).toBeVisible(); // 积分信息
      await expect(firstTask.locator('text=创建于')).toBeVisible(); // 创建时间
      
      // 验证任务类型标签
      const taskTypeBadge = firstTask.locator('[class*="bg-blue-500/20"]');
      await expect(taskTypeBadge).toBeVisible();
    }
  });

  test('应该响应式显示', async ({ page }) => {
    // 测试桌面视图
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto('/tasks');
    
    // 验证桌面布局
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('text=创建任务')).toBeVisible();
    
    // 测试移动视图
    await page.setViewportSize({ width: 375, height: 667 });
    
    // 验证移动布局仍然可用
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('text=创建任务')).toBeVisible();
    
    // 验证搜索框在移动设备上的显示
    await expect(page.locator('[placeholder*="搜索任务"]')).toBeVisible();
  });

  test('应该处理空状态', async ({ page }) => {
    await page.goto('/tasks');
    
    // 搜索不存在的任务
    await page.fill('[placeholder*="搜索任务"]', 'nonexistent-task-12345');
    await page.waitForTimeout(500);
    
    // 验证空状态显示
    await expect(page.locator('text=没有找到匹配的任务')).toBeVisible();
    
    // 清空搜索
    await page.fill('[placeholder*="搜索任务"]', '');
    await page.waitForTimeout(500);
  });

  test('应该显示加载状态', async ({ page }) => {
    // 拦截API请求以模拟慢速加载
    await page.route('/api/tasks*', async route => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await route.continue();
    });
    
    await page.goto('/tasks');
    
    // 验证加载状态
    const loadingElements = page.locator('.animate-pulse');
    await expect(loadingElements.first()).toBeVisible();
    
    // 等待加载完成
    await page.waitForTimeout(1500);
  });

  test('应该处理错误状态', async ({ page }) => {
    // 拦截API请求并返回错误
    await page.route('/api/tasks*', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' })
      });
    });
    
    await page.goto('/tasks');
    
    // 验证错误状态显示
    await expect(page.locator('text=加载失败')).toBeVisible();
  });
});
