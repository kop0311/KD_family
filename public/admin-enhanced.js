// 🏡 KD Family - 增强版管理后台 JavaScript

// 全局变量
const API_BASE = window.location.origin + '/api';
let authToken = localStorage.getItem('authToken');
let currentUser = null;
let currentView = 'dashboard';

// 初始化
document.addEventListener('DOMContentLoaded', initializeAdmin);

async function initializeAdmin() {
    try {
        showLoading();
        
        // 检查管理员权限
        await checkAdminAccess();
        
        // 设置事件监听器
        setupEventListeners();
        
        // 加载初始数据
        await loadDashboardData();
        
        hideLoading();
        showWelcomeMessage();
    } catch (error) {
        console.error('管理后台初始化失败:', error);
        showAlert('初始化失败，请重新登录', 'error');
        redirectToLogin();
    }
}

// 显示/隐藏加载遮罩
function showLoading() {
    document.getElementById('loadingOverlay').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loadingOverlay').style.display = 'none';
}

// 显示欢迎消息
function showWelcomeMessage() {
    const welcomeMessages = [
        '🏡 欢迎回到温馨的家庭管理中心！',
        '✨ 今天又是美好的一天，让我们一起管理这个温暖的家吧！',
        '🌟 家庭管理从这里开始，让爱更有序！',
        '💝 用心管理，用爱经营，KD之家因你而更美好！'
    ];
    
    const randomMessage = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];
    showAlert(randomMessage, 'success');
}

// 检查管理员权限
async function checkAdminAccess() {
    if (!authToken) {
        throw new Error('未找到认证令牌');
    }
    
    try {
        const response = await fetch(`${API_BASE}/auth/me`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (!response.ok) {
            throw new Error('认证失败');
        }
        
        const userData = await response.json();
        currentUser = userData.user;
        
        // 检查是否有管理员权限
        if (!['advisor', 'parent'].includes(currentUser.role)) {
            throw new Error('权限不足');
        }
        
        // 更新界面用户信息
        updateUserInfo();
        
    } catch (error) {
        throw new Error('权限验证失败: ' + error.message);
    }
}

// 更新用户信息显示
function updateUserInfo() {
    const adminName = document.getElementById('adminName');
    const adminAvatar = document.getElementById('adminAvatar');
    
    if (adminName && currentUser) {
        adminName.textContent = currentUser.full_name || currentUser.username;
    }
    
    if (adminAvatar && currentUser && currentUser.avatar_url) {
        adminAvatar.src = currentUser.avatar_url;
    }
}

// 设置事件监听器
function setupEventListeners() {
    // 导航按钮
    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.addEventListener('click', () => {
            const view = btn.dataset.view;
            if (view) {
                showView(view);
            }
        });
    });
    
    // 顶部操作按钮
    const backToHomeBtn = document.getElementById('backToHomeBtn');
    if (backToHomeBtn) {
        backToHomeBtn.addEventListener('click', () => {
            window.location.href = '/';
        });
    }
    
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // 快速操作按钮
    setupQuickActions();
}

// 设置快速操作
function setupQuickActions() {
    // 导出数据按钮
    window.exportFamilyData = function() {
        showAlert('📊 正在准备家庭数据导出...', 'info');
        // 这里可以添加实际的导出逻辑
        setTimeout(() => {
            showAlert('✅ 家庭数据导出完成！', 'success');
        }, 2000);
    };
}

// 视图切换
function showView(viewName) {
    // 隐藏所有视图
    document.querySelectorAll('.admin-view').forEach(view => {
        view.classList.remove('active');
    });
    
    // 移除所有导航项的活动状态
    document.querySelectorAll('.nav-item').forEach(nav => {
        nav.classList.remove('active');
    });
    
    // 显示目标视图
    const targetView = document.getElementById(viewName);
    if (targetView) {
        targetView.classList.add('active');
        currentView = viewName;
    }
    
    // 激活对应的导航项
    const targetNav = document.querySelector(`[data-view="${viewName}"]`);
    if (targetNav) {
        targetNav.classList.add('active');
    }
    
    // 加载视图数据
    loadViewData(viewName);
}

// 加载视图数据
async function loadViewData(viewName) {
    switch (viewName) {
        case 'dashboard':
            await loadDashboardData();
            break;
        case 'members':
            await loadMembersData();
            break;
        case 'tasks':
            await loadTasksData();
            break;
        case 'achievements':
            await loadAchievementsData();
            break;
        case 'analytics':
            loadAnalyticsPlaceholder();
            break;
        default:
            // 其他视图显示占位符
            break;
    }
}

// 加载仪表板数据
async function loadDashboardData() {
    try {
        // 加载统计数据
        await Promise.all([
            loadFamilyStats(),
            loadRecentActivities(),
            loadWeeklyLeaderboard()
        ]);
    } catch (error) {
        console.error('加载仪表板数据失败:', error);
        showAlert('部分数据加载失败', 'warning');
    }
}

// 加载家庭统计
async function loadFamilyStats() {
    try {
        // 模拟数据 - 实际应用中从API获取
        const stats = {
            totalMembers: 5,
            completedTasks: 28,
            totalPoints: 1250,
            activeStreaks: 3
        };
        
        // 更新统计显示
        updateStatCard('totalMembers', stats.totalMembers);
        updateStatCard('completedTasks', stats.completedTasks);
        updateStatCard('totalPoints', stats.totalPoints);
        updateStatCard('activeStreaks', stats.activeStreaks);
        
    } catch (error) {
        console.error('加载家庭统计失败:', error);
    }
}

// 更新统计卡片
function updateStatCard(id, value) {
    const element = document.getElementById(id);
    if (element) {
        // 数字动画效果
        animateNumber(element, 0, value, 1000);
    }
}

// 数字动画
function animateNumber(element, start, end, duration) {
    const startTime = performance.now();
    
    function updateNumber(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // 使用缓动函数
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const current = Math.round(start + (end - start) * easeOutQuart);
        
        element.textContent = current;
        
        if (progress < 1) {
            requestAnimationFrame(updateNumber);
        }
    }
    
    requestAnimationFrame(updateNumber);
}

// 加载最近活动
async function loadRecentActivities() {
    const container = document.getElementById('recentActivities');
    if (!container) return;
    
    // 模拟活动数据
    const activities = [
        {
            icon: '✅',
            text: '小明完成了"整理房间"任务',
            time: '2小时前',
            type: 'task_completed'
        },
        {
            icon: '🏆',
            text: '小红获得了"连续完成任务"成就',
            time: '4小时前',
            type: 'achievement_earned'
        },
        {
            icon: '👤',
            text: '新成员小李加入了家庭',
            time: '1天前',
            type: 'member_joined'
        },
        {
            icon: '📝',
            text: '爸爸创建了新任务"准备晚餐"',
            time: '2天前',
            type: 'task_created'
        }
    ];
    
    container.innerHTML = activities.map(activity => `
        <div class="activity-item">
            <div class="activity-icon">${activity.icon}</div>
            <div class="activity-content">
                <div class="activity-text">${activity.text}</div>
                <div class="activity-time">${activity.time}</div>
            </div>
        </div>
    `).join('');
}

// 加载周排行榜
async function loadWeeklyLeaderboard() {
    const container = document.getElementById('weeklyLeaderboard');
    if (!container) return;
    
    // 模拟排行榜数据
    const leaderboard = [
        {
            rank: 1,
            name: '小明',
            avatar: '/assets/default-avatar.svg',
            points: 180
        },
        {
            rank: 2,
            name: '小红',
            avatar: '/assets/default-avatar.svg',
            points: 165
        },
        {
            rank: 3,
            name: '爸爸',
            avatar: '/assets/default-avatar.svg',
            points: 145
        }
    ];
    
    container.innerHTML = leaderboard.map(member => `
        <div class="leaderboard-item">
            <div class="rank-number rank-${member.rank}">${member.rank}</div>
            <img src="${member.avatar}" alt="${member.name}" class="member-avatar">
            <div class="member-info">
                <div class="member-name">${member.name}</div>
                <div class="member-points">${member.points} 积分</div>
            </div>
        </div>
    `).join('');
}

// 加载成员数据
async function loadMembersData() {
    try {
        const response = await fetch(`${API_BASE}/users`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (response.ok) {
            const users = await response.json();
            displayMembersTable(users);
        } else {
            throw new Error('加载成员数据失败');
        }
    } catch (error) {
        console.error('加载成员数据失败:', error);
        showAlert('成员数据加载失败', 'error');
        
        // 显示模拟数据
        displayMembersTable([
            {
                id: 1,
                username: 'admin',
                full_name: '管理员',
                email: 'admin@kdfamily.com',
                role: 'advisor',
                avatar_url: '/assets/default-avatar.svg',
                created_at: '2024-01-01',
                status: 'active'
            }
        ]);
    }
}

// 显示成员表格
function displayMembersTable(members) {
    const tbody = document.getElementById('membersTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = members.map(member => `
        <tr>
            <td>
                <img src="${member.avatar_url || '/assets/default-avatar.svg'}" 
                     alt="${member.full_name}" 
                     style="width: 40px; height: 40px; border-radius: 50%;">
            </td>
            <td>
                <div>
                    <strong>${member.full_name || member.username}</strong>
                    <br>
                    <small style="color: var(--neutral-500);">${member.email}</small>
                </div>
            </td>
            <td>
                <span class="role-badge role-${member.role}">
                    ${getRoleDisplayName(member.role)}
                </span>
            </td>
            <td>-</td>
            <td>${formatDate(member.created_at)}</td>
            <td>
                <span class="status-badge status-active">活跃</span>
            </td>
            <td>
                <button class="btn-outline btn-sm" onclick="editMember(${member.id})">编辑</button>
            </td>
        </tr>
    `).join('');
}

// 获取角色显示名称
function getRoleDisplayName(role) {
    const roleNames = {
        'advisor': '🧭 家庭顾问',
        'parent': '👨‍👩‍👧‍👦 家长',
        'member': '👤 成员'
    };
    return roleNames[role] || role;
}

// 格式化日期
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN');
}

// 加载任务数据
async function loadTasksData() {
    try {
        // 加载任务统计
        await loadTaskStats();
        
        // 加载任务列表
        await loadTasksList();
    } catch (error) {
        console.error('加载任务数据失败:', error);
        showAlert('任务数据加载失败', 'error');
    }
}

// 加载任务统计
async function loadTaskStats() {
    // 模拟任务统计数据
    const stats = {
        pending: 8,
        progress: 3,
        completed: 25,
        overdue: 2
    };
    
    // 更新任务统计显示
    updateElement('pendingTasks', stats.pending);
    updateElement('progressTasks', stats.progress);
    updateElement('completedTasksCount', stats.completed);
    updateElement('overdueTasks', stats.overdue);
}

// 加载任务列表
async function loadTasksList() {
    const container = document.getElementById('tasksContainer');
    if (!container) return;
    
    // 模拟任务数据
    const tasks = [
        {
            id: 1,
            title: '整理房间',
            description: '整理自己的卧室，包括叠被子、收拾桌面',
            assignee: '小明',
            status: 'pending',
            priority: 'medium',
            due_date: '2024-01-20',
            points: 20
        },
        {
            id: 2,
            title: '洗碗',
            description: '晚餐后清洗所有餐具',
            assignee: '小红',
            status: 'in_progress',
            priority: 'high',
            due_date: '2024-01-19',
            points: 15
        },
        {
            id: 3,
            title: '倒垃圾',
            description: '把厨房和客厅的垃圾清理干净',
            assignee: '爸爸',
            status: 'completed',
            priority: 'low',
            due_date: '2024-01-18',
            points: 10
        }
    ];
    
    container.innerHTML = `
        <div class="tasks-grid">
            ${tasks.map(task => createTaskCard(task)).join('')}
        </div>
    `;
}

// 创建任务卡片
function createTaskCard(task) {
    const statusClass = task.status.replace('_', '-');
    const priorityClass = task.priority;
    
    return `
        <div class="task-card ${statusClass}" data-task-id="${task.id}">
            <div class="task-header">
                <h4 class="task-title">${task.title}</h4>
                <div class="task-meta">
                    <span class="task-priority priority-${priorityClass}">${getPriorityDisplay(task.priority)}</span>
                    <span class="task-points">${task.points} 积分</span>
                </div>
            </div>
            <p class="task-description">${task.description}</p>
            <div class="task-footer">
                <div class="task-assignee">
                    <span class="assignee-label">负责人:</span>
                    <span class="assignee-name">${task.assignee}</span>
                </div>
                <div class="task-due">
                    <span class="due-label">截止:</span>
                    <span class="due-date">${formatDate(task.due_date)}</span>
                </div>
                <div class="task-status">
                    <span class="status-badge status-${statusClass}">${getStatusDisplay(task.status)}</span>
                </div>
            </div>
            <div class="task-actions">
                <button class="btn-outline btn-sm" onclick="editTask(${task.id})">编辑</button>
                <button class="btn-primary btn-sm" onclick="updateTaskStatus(${task.id})">更新状态</button>
            </div>
        </div>
    `;
}

// 获取优先级显示
function getPriorityDisplay(priority) {
    const priorities = {
        'low': '🟢 低',
        'medium': '🟡 中',
        'high': '🔴 高'
    };
    return priorities[priority] || priority;
}

// 获取状态显示
function getStatusDisplay(status) {
    const statuses = {
        'pending': '⏳ 待办',
        'in_progress': '🔄 进行中',
        'completed': '✅ 已完成',
        'overdue': '⚠️ 已逾期'
    };
    return statuses[status] || status;
}

// 加载成就数据
async function loadAchievementsData() {
    const container = document.getElementById('achievementsContent');
    if (!container) return;
    
    container.innerHTML = `
        <div class="achievements-placeholder">
            <div class="placeholder-icon">🏆</div>
            <h3>成就系统开发中</h3>
            <p>我们正在为您的家庭设计独特的成就系统，让每个家庭成员都能获得应有的认可！</p>
            <div style="margin-top: 2rem;">
                <button class="btn-primary" onclick="showAlert('功能即将上线！', 'info')">
                    期待上线
                </button>
            </div>
        </div>
    `;
}

// 分析占位符
function loadAnalyticsPlaceholder() {
    // 分析功能的占位符已在HTML中定义
}

// 通用工具函数
function updateElement(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value;
    }
}

// 显示通知
function showAlert(message, type = 'info') {
    const container = document.getElementById('alertContainer');
    if (!container) return;
    
    const alert = document.createElement('div');
    alert.className = `alert-modern alert-${type}`;
    
    alert.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between;">
            <span>${message}</span>
            <button onclick="this.parentElement.parentElement.remove()" 
                    style="background: none; border: none; font-size: 1.2rem; cursor: pointer; 
                           color: inherit; opacity: 0.7; margin-left: 1rem;">×</button>
        </div>
    `;
    
    container.appendChild(alert);
    
    // 自动移除
    setTimeout(() => {
        if (alert.parentElement) {
            alert.remove();
        }
    }, 5000);
}

// 处理退出登录
async function handleLogout() {
    try {
        showLoading();
        
        // 调用退出登录API
        await fetch(`${API_BASE}/auth/logout`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        // 清除本地存储
        localStorage.removeItem('authToken');
        
        // 显示告别消息
        showAlert('👋 感谢您的使用，期待下次见面！', 'success');
        
        // 延迟跳转
        setTimeout(() => {
            window.location.href = '/';
        }, 1500);
        
    } catch (error) {
        console.error('退出登录失败:', error);
        // 即使API调用失败，也清除本地存储并跳转
        localStorage.removeItem('authToken');
        window.location.href = '/';
    }
}

// 重定向到登录页
function redirectToLogin() {
    window.location.href = '/';
}

// 编辑成员（占位符函数）
window.editMember = function(memberId) {
    showAlert(`📝 编辑成员功能开发中... (ID: ${memberId})`, 'info');
};

// 编辑任务（占位符函数）
window.editTask = function(taskId) {
    showAlert(`📝 编辑任务功能开发中... (ID: ${taskId})`, 'info');
};

// 更新任务状态（占位符函数）
window.updateTaskStatus = function(taskId) {
    showAlert(`🔄 更新任务状态功能开发中... (ID: ${taskId})`, 'info');
};

// 暴露showView函数到全局
window.showView = showView;

// 添加CSS动态样式
const style = document.createElement('style');
style.textContent = `
    .role-badge {
        padding: 0.25rem 0.5rem;
        border-radius: var(--radius-friendly);
        font-size: 0.75rem;
        font-weight: var(--font-weight-friendly);
    }
    
    .role-advisor {
        background: var(--role-advisor-bg);
        color: var(--role-advisor);
    }
    
    .role-parent {
        background: var(--role-parent-bg);
        color: var(--role-parent);
    }
    
    .role-member {
        background: var(--role-member-bg);
        color: var(--role-member);
    }
    
    .status-badge {
        padding: 0.25rem 0.5rem;
        border-radius: var(--radius-friendly);
        font-size: 0.75rem;
        font-weight: var(--font-weight-friendly);
    }
    
    .status-active {
        background: var(--family-secondary-100);
        color: var(--family-secondary-700);
    }
    
    .tasks-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: var(--space-friendly);
    }
    
    .task-card {
        background: var(--surface-primary);
        border-radius: var(--radius-welcoming);
        padding: var(--space-friendly);
        border-left: 4px solid;
        box-shadow: var(--shadow-warm);
        transition: all 0.3s ease;
    }
    
    .task-card:hover {
        transform: translateY(-2px);
        box-shadow: var(--shadow-cozy);
    }
    
    .task-card.pending {
        border-color: var(--task-pending);
    }
    
    .task-card.in-progress {
        border-color: var(--task-progress);
    }
    
    .task-card.completed {
        border-color: var(--task-completed);
    }
    
    .task-card.overdue {
        border-color: var(--task-overdue);
    }
    
    .task-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: var(--space-cozy);
    }
    
    .task-title {
        font-size: 1.1rem;
        font-weight: var(--font-weight-warm);
        color: var(--neutral-700);
        margin: 0;
    }
    
    .task-meta {
        display: flex;
        flex-direction: column;
        gap: var(--space-1);
        align-items: flex-end;
    }
    
    .task-priority,
    .task-points {
        font-size: 0.75rem;
        padding: 0.25rem 0.5rem;
        border-radius: var(--radius-friendly);
        font-weight: var(--font-weight-friendly);
    }
    
    .task-points {
        background: var(--celebration-gradient);
        color: white;
    }
    
    .priority-low {
        background: var(--family-secondary-100);
        color: var(--family-secondary-700);
    }
    
    .priority-medium {
        background: var(--task-pending-bg);
        color: var(--task-pending);
    }
    
    .priority-high {
        background: var(--task-overdue-bg);
        color: var(--task-overdue);
    }
    
    .task-description {
        color: var(--neutral-600);
        font-size: 0.875rem;
        margin-bottom: var(--space-friendly);
        line-height: 1.5;
    }
    
    .task-footer {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--space-cozy);
        margin-bottom: var(--space-friendly);
        font-size: 0.75rem;
    }
    
    .task-assignee,
    .task-due {
        display: flex;
        flex-direction: column;
        gap: var(--space-1);
    }
    
    .task-status {
        grid-column: 1 / -1;
    }
    
    .assignee-label,
    .due-label {
        color: var(--neutral-500);
        font-weight: var(--font-weight-friendly);
    }
    
    .assignee-name,
    .due-date {
        color: var(--neutral-700);
        font-weight: var(--font-weight-warm);
    }
    
    .task-actions {
        display: flex;
        gap: var(--space-cozy);
    }
    
    .btn-sm {
        padding: 0.375rem 0.75rem;
        font-size: 0.75rem;
    }
    
    .achievements-placeholder {
        text-align: center;
        padding: var(--space-gathering);
        color: var(--neutral-500);
    }
    
    .achievements-placeholder .placeholder-icon {
        font-size: 4rem;
        margin-bottom: var(--space-friendly);
        opacity: 0.7;
    }
    
    .achievements-placeholder h3 {
        color: var(--neutral-600);
        margin-bottom: var(--space-cozy);
    }
`;

document.head.appendChild(style);