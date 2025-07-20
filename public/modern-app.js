// Modern KD Family UI Application
const API_BASE = window.location.origin + '/api';

// Application State
let currentUser = null;
let authToken = localStorage.getItem('authToken');
let selectedAvatarUrl = null;
let achievementImageFile = null;
let currentAchievementPage = 1;

// Default avatar URL
const DEFAULT_AVATAR_URL = '/assets/default-avatar.svg';

// Avatar utility functions
function setAvatarWithFallback(imgElement, avatarUrl) {
    if (!imgElement) return;

    imgElement.src = avatarUrl || DEFAULT_AVATAR_URL;
    imgElement.onerror = function() {
        this.src = DEFAULT_AVATAR_URL;
        this.onerror = null; // Prevent infinite loop
    };
}

// Utility Functions
function showLoading() {
    document.getElementById('loadingOverlay').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loadingOverlay').style.display = 'none';
}

function showAlert(message, type = 'info') {
    // Try to show alert in modal first, then fall back to main container
    const modalAlertContainer = document.getElementById('modalAlertContainer');
    const alertContainer = modalAlertContainer || document.getElementById('alertContainer');
    
    if (!alertContainer) {
        console.error('No alert container found');
        return;
    }
    
    const alert = document.createElement('div');
    alert.className = `alert-modern alert-${type}`;
    
    const alertContent = document.createElement('div');
    alertContent.style.cssText = 'display: flex; align-items: center; justify-content: space-between;';
    
    const messageSpan = document.createElement('span');
    messageSpan.textContent = message;
    
    const closeButton = document.createElement('button');
    closeButton.textContent = '×';
    closeButton.style.cssText = 'background: none; border: none; font-size: 1.2rem; cursor: pointer; padding: 0; margin-left: 1rem; color: inherit; opacity: 0.7; transition: opacity 0.2s;';
    closeButton.addEventListener('click', function() {
        alert.remove();
    });
    closeButton.addEventListener('mouseenter', function() {
        closeButton.style.opacity = '1';
    });
    closeButton.addEventListener('mouseleave', function() {
        closeButton.style.opacity = '0.7';
    });
    
    alertContent.appendChild(messageSpan);
    alertContent.appendChild(closeButton);
    alert.appendChild(alertContent);
    
    alertContainer.appendChild(alert);
    
    // Auto remove after 8 seconds (longer for important messages)
    setTimeout(() => {
        if (alert.parentElement) {
            alert.remove();
        }
    }, 8000);
}

// API Helper
async function apiCall(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            ...(authToken && { 'Authorization': `Bearer ${authToken}` })
        }
    };

    if (options.body instanceof FormData) {
        delete defaultOptions.headers['Content-Type'];
    }
    
    try {
        const response = await fetch(url, { ...defaultOptions, ...options });
        
        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: response.statusText }));
            throw error;
        }
        
        return await response.json();
    } catch (error) {
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            showAlert('网络连接失败，请检查服务器是否运行', 'error');
            throw { error: '网络连接失败' };
        }
        throw error;
    }
}

// Navigation
function showSection(sectionName) {
    // Update navigation
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    const navBtn = document.getElementById(sectionName + 'Btn');
    if (navBtn) navBtn.classList.add('active');
    
    // Hide all sections
    document.querySelectorAll('.modern-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show target section with animation
    const targetSection = document.getElementById(sectionName);
    if (targetSection) {
        setTimeout(() => {
            targetSection.classList.add('active');
        }, 150);
    }

    // Load section data
    switch(sectionName) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'tasks':
            loadTasks();
            break;
        case 'leaderboard':
            loadLeaderboard();
            break;
        case 'achievements':
            loadAchievements(1);
            break;
        case 'profile':
            loadUserProfile();
            break;
        case 'admin':
            loadAdmin();
            break;
    }
}

// Authentication Functions
async function checkAuthStatus() {
    if (authToken) {
        try {
            const response = await apiCall('/auth/me');
            currentUser = response.user;
            updateUIAfterLogin();
            showSection('dashboard');
        } catch (error) {
            logout();
            showLoginForm();
        }
    } else {
        showLoginForm();
    }
}

function showLoginForm() {
    // Check if login modal already exists
    let loginModal = document.getElementById('loginModal');
    if (loginModal) {
        loginModal.style.display = 'flex';
        return;
    }

    // Create login modal
    loginModal = document.createElement('div');
    loginModal.className = 'modal-modern';
    loginModal.id = 'loginModal';
    loginModal.style.display = 'flex';
    loginModal.innerHTML = `
        <div class="modal-content-modern" style="max-width: 500px;">
            <div class="modal-header">
                <h3 class="modal-title">🏠 欢迎来到KD之家</h3>
            </div>
            
            <!-- Modal Alert Container -->
            <div id="modalAlertContainer" style="margin-bottom: 1rem;"></div>
            
            <div style="margin-bottom: 2rem;">
                <div style="display: flex; gap: 1rem; margin-bottom: 2rem;">
                    <button class="btn-primary btn-modern" id="loginTabBtn">登录</button>
                    <button class="btn-outline btn-modern" id="registerTabBtn">注册</button>
                </div>
                
                <!-- Login Form -->
                <div id="loginTab">
                    <form id="modalLoginForm">
                        <div class="form-group-modern">
                            <label class="form-label-modern">用户名</label>
                            <input type="text" id="modalLoginUsername" class="form-input-modern" required>
                        </div>
                        <div class="form-group-modern">
                            <label class="form-label-modern">密码</label>
                            <input type="password" id="modalLoginPassword" class="form-input-modern" required>
                        </div>
                        <button type="submit" class="btn-primary btn-modern" style="width: 100%;">🚀 登录</button>
                    </form>
                </div>

                <!-- Register Form -->
                <div id="registerTab" style="display: none;">
                    <form id="modalRegisterForm">
                        <div class="form-group-modern">
                            <label class="form-label-modern">用户名</label>
                            <input type="text" id="modalRegUsername" class="form-input-modern" required>
                        </div>
                        <div class="form-group-modern">
                            <label class="form-label-modern">邮箱</label>
                            <input type="email" id="modalRegEmail" class="form-input-modern" required>
                        </div>
                        <div class="form-group-modern">
                            <label class="form-label-modern">密码</label>
                            <input type="password" id="modalRegPassword" class="form-input-modern" required>
                        </div>
                        <div class="form-group-modern">
                            <label class="form-label-modern">全名</label>
                            <input type="text" id="modalRegFullName" class="form-input-modern" required>
                        </div>
                        <div class="form-group-modern">
                            <label class="form-label-modern">角色</label>
                            <select id="modalRegRole" class="form-input-modern">
                                <option value="member">家庭成员</option>
                                <option value="parent">家长</option>
                                <option value="advisor">顾问</option>
                            </select>
                        </div>
                        <button type="submit" class="btn-primary btn-modern" style="width: 100%;">✨ 注册</button>
                    </form>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(loginModal);
}

function closeLoginModal() {
    const loginModal = document.getElementById('loginModal');
    if (loginModal) {
        loginModal.style.display = 'none';
    }
}

function showLoginTab() {
    document.getElementById('loginTab').style.display = 'block';
    document.getElementById('registerTab').style.display = 'none';
    document.getElementById('loginTabBtn').className = 'btn-primary btn-modern';
    document.getElementById('registerTabBtn').className = 'btn-outline btn-modern';
}

function showRegisterTab() {
    document.getElementById('loginTab').style.display = 'none';
    document.getElementById('registerTab').style.display = 'block';
    document.getElementById('loginTabBtn').className = 'btn-outline btn-modern';
    document.getElementById('registerTabBtn').className = 'btn-primary btn-modern';
}

async function login(event) {
    event.preventDefault();

    const username = document.getElementById('modalLoginUsername').value;
    const password = document.getElementById('modalLoginPassword').value;

    if (!username || !password) {
        showAlert('请输入用户名和密码', 'error');
        return;
    }

    try {
        showLoading();
        const response = await apiCall('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });

        authToken = response.token;
        currentUser = response.user;
        localStorage.setItem('authToken', authToken);

        showAlert('登录成功！', 'success');
        updateUIAfterLogin();
        closeLoginModal();
        showSection('dashboard');
    } catch (error) {
        showAlert(error.error || '登录失败', 'error');
    } finally {
        hideLoading();
    }
}

async function register(event) {
    event.preventDefault();
    
    const userData = {
        username: document.getElementById('modalRegUsername').value.trim(),
        email: document.getElementById('modalRegEmail').value.trim(),
        password: document.getElementById('modalRegPassword').value,
        fullName: document.getElementById('modalRegFullName').value.trim(),
        role: document.getElementById('modalRegRole').value
    };
    
    // Client-side validation
    if (!userData.username || userData.username.length < 3) {
        showAlert('用户名至少需要3个字符', 'error');
        return;
    }
    
    if (!userData.email || !userData.email.includes('@')) {
        showAlert('请输入有效的邮箱地址', 'error');
        return;
    }
    
    if (!userData.password || userData.password.length < 6) {
        showAlert('密码至少需要6个字符', 'error');
        return;
    }
    
    if (!userData.fullName || userData.fullName.length < 2) {
        showAlert('全名至少需要2个字符', 'error');
        return;
    }
    
    // Registration validation passed, proceeding with API call
    
    try {
        showLoading();
        const response = await apiCall('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
        
        authToken = response.token;
        currentUser = response.user;
        localStorage.setItem('authToken', authToken);
        
        showAlert('注册成功！欢迎加入KD之家！', 'success');
        updateUIAfterLogin();
        closeLoginModal();
        showSection('dashboard');
    } catch (error) {
        console.error('Registration error:', error);
        let errorMessage = '注册失败';
        
        if (error.error) {
            if (error.error.includes('Username or email already exists')) {
                errorMessage = '用户名或邮箱已存在，请尝试其他用户名或邮箱。如果这是您的账户，请点击"登录"按钮。';
            } else if (error.error.includes('username')) {
                errorMessage = '用户名格式不正确（3-30个字符，只能包含字母和数字）';
            } else if (error.error.includes('email')) {
                errorMessage = '邮箱格式不正确';
            } else if (error.error.includes('password')) {
                errorMessage = '密码至少需要6个字符';
            } else if (error.error.includes('fullName')) {
                errorMessage = '全名至少需要2个字符';
            } else {
                errorMessage = error.error;
            }
        }
        
        showAlert(errorMessage, 'error');
    } finally {
        hideLoading();
    }
}



function logout() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('authToken');
    updateUIAfterLogout();
    showLoginForm();
    showAlert('已退出登录', 'info');
}

function updateUIAfterLogin() {
    const userInfo = document.getElementById('userInfo');
    const adminBtn = document.getElementById('adminBtn');

    userInfo.style.display = 'block';
    document.getElementById('userName').textContent = currentUser.fullName;
    document.getElementById('userRole').textContent = getRoleText(currentUser.role);
    document.getElementById('userPoints').textContent = currentUser.totalPoints || 0;

    // Set avatar with error handling
    const avatarImg = document.getElementById('userAvatar');
    setAvatarWithFallback(avatarImg, currentUser.avatar_url);
    
    // Show admin panel for admin users
    if (currentUser.role === 'advisor' || currentUser.role === 'parent') {
        adminBtn.style.display = 'block';
        document.getElementById('createTaskBtn').style.display = 'block';

        // Add admin dashboard link for advisors
        if (currentUser.role === 'advisor') {
            const userInfo = document.getElementById('userInfo');
            const existingAdminLink = document.getElementById('adminDashboardLink');
            if (!existingAdminLink && userInfo) {
                const adminLink = document.createElement('a');
                adminLink.id = 'adminDashboardLink';
                adminLink.href = './admin-dashboard.html';
                adminLink.className = 'btn-outline btn-modern';
                adminLink.innerHTML = '⚙️ 管理控制台';
                adminLink.style.marginLeft = '1rem';
                adminLink.style.fontSize = '0.875rem';
                adminLink.style.padding = '0.5rem 1rem';
                userInfo.appendChild(adminLink);
            }
        }
    }
}

function updateUIAfterLogout() {
    document.getElementById('userInfo').style.display = 'none';
    document.getElementById('adminBtn').style.display = 'none';
    document.getElementById('createTaskBtn').style.display = 'none';

    // Remove admin dashboard link
    const adminLink = document.getElementById('adminDashboardLink');
    if (adminLink) {
        adminLink.remove();
    }
}

function getRoleText(role) {
    const roles = { advisor: '顾问', parent: '家长', member: '家庭成员' };
    return roles[role] || role;
}

// Dashboard Functions
async function loadDashboard() {
    if (!currentUser) return;
    
    try {
        showLoading();
        const [profile, stats, myTasks] = await Promise.all([
            apiCall('/users/profile'),
            apiCall('/points/stats'),
            apiCall('/tasks/my')
        ]);
        
        // Update quick stats
        const quickStats = document.querySelectorAll('.glass-container p');
        if (quickStats.length >= 3) {
            quickStats[0].textContent = stats.stats.week_points || 0;
            quickStats[1].textContent = stats.stats.total_tasks || 0;
            quickStats[2].textContent = stats.stats.current_streak || 0;
        }
        
        // Update recent activities
        const activitiesDiv = document.getElementById('recentActivities');
        if (myTasks.tasks && myTasks.tasks.length > 0) {
            activitiesDiv.innerHTML = myTasks.tasks.slice(0, 5).map(task => `
                <div class="flex items-center gap-3 p-3 mb-2 bg-gray-50 rounded-lg">
                    <span style="font-size: 1.5rem;">${getTaskEmoji(task.status)}</span>
                    <div>
                        <p class="font-semibold">${task.title}</p>
                        <p class="text-sm text-gray-600">${getTaskStatusText(task.status)} · ${task.points}积分</p>
                    </div>
                </div>
            `).join('');
        }
        
    } catch (error) {
        showAlert('加载仪表板失败', 'error');
    } finally {
        hideLoading();
    }
}

// Task Management Functions
async function loadTasks() {
    if (!currentUser) return;
    
    try {
        showLoading();
        const [tasksResponse, usersResponse] = await Promise.all([
            apiCall('/tasks'),
            apiCall('/users/all')
        ]);

        const tasksList = document.getElementById('tasksList');
        const users = usersResponse.users;

        if (tasksResponse.tasks && tasksResponse.tasks.length > 0) {
            tasksList.innerHTML = tasksResponse.tasks.map(task => {
                const assignOptions = users.map(user => 
                    `<option value="${user.id}" ${task.assigned_to === user.id ? 'selected' : ''}>${user.full_name}</option>`
                ).join('');

                return `
                <div class="task-card-modern">
                    <div class="task-title">${task.title}</div>
                    <p style="color: var(--gray-600); margin-bottom: 1rem;">${task.description || '无描述'}</p>
                    
                    <div class="task-meta">
                        <span class="task-status-modern status-${task.status}">${getTaskStatusText(task.status)}</span>
                        <span style="background: var(--primary-gradient); color: white; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600;">
                            ${task.points}分
                        </span>
                        <span style="color: var(--gray-500); font-size: 0.875rem;">${task.task_type_name}</span>
                    </div>
                    
                    <div style="margin-top: 1rem; color: var(--gray-500); font-size: 0.875rem;">
                        分配给: ${task.assigned_full_name || '未分配'} | 创建者: ${task.created_by_full_name}
                        ${task.due_date ? ` | 截止: ${new Date(task.due_date).toLocaleDateString()}` : ''}
                    </div>
                    
                    <div style="margin-top: 1rem; display: flex; gap: 0.75rem; flex-wrap: wrap; align-items: center;">
                        ${generateTaskActions(task)}
                        ${(currentUser.role === 'advisor' || currentUser.role === 'parent') ? 
                            `<select class="form-input-modern assign-user-select" data-task-id="${task.id}" style="max-width: 200px;">
                                <option value="">指派给...</option>${assignOptions}
                            </select>` : ''}
                    </div>
                </div>
                `;
            }).join('');
        } else {
            tasksList.innerHTML = '<div class="glass-container" style="padding: 2rem; text-align: center;"><p>暂无任务</p></div>';
        }
        
        // Add event listeners for task actions
        addTaskEventListeners();
        
    } catch (error) {
        showAlert('加载任务失败', 'error');
    } finally {
        hideLoading();
    }
}

function generateTaskActions(task) {
    const actions = [];
    
    if (task.status === 'pending' && !task.assigned_to) {
        actions.push(`<button class="btn-primary btn-modern task-action-btn" data-action="claim" data-task-id="${task.id}">认领任务</button>`);
    }
    
    if (task.assigned_to === currentUser.id && task.status === 'claimed') {
        actions.push(`<button class="btn-success btn-modern task-action-btn" data-action="start" data-task-id="${task.id}">开始任务</button>`);
    }
    
    if (task.assigned_to === currentUser.id && task.status === 'in_progress') {
        actions.push(`<button class="btn-warning btn-modern task-action-btn" data-action="complete" data-task-id="${task.id}">完成任务</button>`);
    }
    
    if (task.status === 'completed' && (currentUser.role === 'advisor' || currentUser.role === 'parent')) {
        actions.push(`<button class="btn-secondary btn-modern task-action-btn" data-action="approve" data-task-id="${task.id}">批准任务</button>`);
    }
    
    return actions.join('');
}

function addTaskEventListeners() {
    // Task action buttons
    document.querySelectorAll('.task-action-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const action = e.target.getAttribute('data-action');
            const taskId = e.target.getAttribute('data-task-id');
            
            try {
                switch(action) {
                    case 'claim':
                        await apiCall(`/tasks/${taskId}/claim`, { method: 'PUT' });
                        showAlert('任务认领成功！', 'success');
                        break;
                    case 'start':
                        await apiCall(`/tasks/${taskId}/status`, {
                            method: 'PUT',
                            body: JSON.stringify({ status: 'in_progress' })
                        });
                        showAlert('任务已开始！', 'success');
                        break;
                    case 'complete':
                        await apiCall(`/tasks/${taskId}/status`, {
                            method: 'PUT',
                            body: JSON.stringify({ status: 'completed' })
                        });
                        showAlert('任务已完成！', 'success');
                        break;
                    case 'approve':
                        await apiCall(`/tasks/${taskId}/status`, {
                            method: 'PUT',
                            body: JSON.stringify({ status: 'approved' })
                        });
                        showAlert('任务已批准！', 'success');
                        break;
                }
                loadTasks(); // Refresh tasks
            } catch (error) {
                showAlert(error.error || '操作失败', 'error');
            }
        });
    });
    
    // Assignment dropdowns
    document.querySelectorAll('.assign-user-select').forEach(select => {
        select.addEventListener('change', async (e) => {
            const taskId = e.target.getAttribute('data-task-id');
            const userId = e.target.value;
            
            if (!userId) return;
            
            try {
                await apiCall(`/tasks/${taskId}/assign`, {
                    method: 'PUT',
                    body: JSON.stringify({ userId: parseInt(userId) })
                });
                showAlert('任务指派成功！', 'success');
                loadTasks();
            } catch (error) {
                showAlert(error.error || '指派失败', 'error');
            }
        });
    });
}

function showCreateTaskForm() {
    document.getElementById('createTaskForm').style.display = 'block';
    loadTaskAssignees();
}

function hideCreateTaskForm() {
    document.getElementById('createTaskForm').style.display = 'none';
    document.getElementById('taskTitle').value = '';
    document.getElementById('taskDescription').value = '';
    document.getElementById('taskPoints').value = '10';
    document.getElementById('taskDueDate').value = '';
}

async function loadTaskAssignees() {
    try {
        const response = await apiCall('/users/all');
        const select = document.getElementById('taskAssignee');
        select.innerHTML = '<option value="">无指定</option>' + 
            response.users.map(user => `<option value="${user.id}">${user.full_name}</option>`).join('');
    } catch (error) {
        console.error('Failed to load users:', error);
    }
}

async function createTask() {
    const taskData = {
        title: document.getElementById('taskTitle').value,
        description: document.getElementById('taskDescription').value,
        taskType: document.getElementById('taskType').value,
        points: parseInt(document.getElementById('taskPoints').value) || 10,
        assignedTo: document.getElementById('taskAssignee').value || null,
        dueDate: document.getElementById('taskDueDate').value || null
    };
    
    if (!taskData.title.trim()) {
        showAlert('请输入任务标题', 'error');
        return;
    }
    
    try {
        showLoading();
        await apiCall('/tasks', {
            method: 'POST',
            body: JSON.stringify(taskData)
        });
        showAlert('任务创建成功！', 'success');
        hideCreateTaskForm();
        loadTasks();
    } catch (error) {
        showAlert(error.error || '创建失败', 'error');
    } finally {
        hideLoading();
    }
}

function refreshTasks() {
    loadTasks();
}

function filterTasks() {
    const filter = document.getElementById('taskFilter').value;
    const taskCards = document.querySelectorAll('.task-card');
    
    taskCards.forEach(card => {
        const status = card.dataset.status || '';
        const category = card.dataset.category || '';
        
        let shouldShow = true;
        
        switch(filter) {
            case 'all':
                shouldShow = true;
                break;
            case 'pending':
                shouldShow = status === 'pending';
                break;
            case 'in_progress':
                shouldShow = status === 'in_progress';
                break;
            case 'completed':
                shouldShow = status === 'completed';
                break;
            case 'daily':
                shouldShow = category === 'daily';
                break;
            case 'weekly':
                shouldShow = category === 'weekly';
                break;
            default:
                shouldShow = true;
        }
        
        card.style.display = shouldShow ? 'block' : 'none';
    });
}

// Leaderboard Functions
async function loadLeaderboard(period = 'week') {
    if (!currentUser) return;
    
    try {
        showLoading();
        const response = await apiCall(`/points/leaderboard?period=${period}`);
        
        const leaderboardList = document.getElementById('leaderboardList');
        
        if (response.leaderboard && response.leaderboard.length > 0) {
            leaderboardList.innerHTML = response.leaderboard.map((user, index) => `
                <div class="leaderboard-card rank-${index + 1}">
                    <div class="rank-number">${index + 1}</div>
                    <div style="margin-bottom: 1rem;">
                        <h3 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 0.5rem;">${user.full_name}</h3>
                        <p style="color: var(--gray-600);">@${user.username || 'unknown'}</p>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <p style="font-size: 2rem; font-weight: 700; background: var(--primary-gradient); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
                                ${user.total_points || 0}
                            </p>
                            <p style="color: var(--gray-500); font-size: 0.875rem;">积分</p>
                        </div>
                        <div style="text-align: center;">
                            <p style="font-size: 1.5rem; font-weight: 600; color: var(--success-color);">${user.completed_tasks || 0}</p>
                            <p style="color: var(--gray-500); font-size: 0.875rem;">完成任务</p>
                        </div>
                    </div>
                </div>
            `).join('');
        } else {
            leaderboardList.innerHTML = '<div class="glass-container" style="padding: 2rem; text-align: center;"><p>暂无排行数据</p></div>';
        }
        
    } catch (error) {
        showAlert('加载排行榜失败', 'error');
    } finally {
        hideLoading();
    }
}

// Profile Functions
async function loadUserProfile() {
    if (!currentUser) return;
    
    try {
        const response = await apiCall('/users/profile');
        const user = response.user;
        
        document.getElementById('profileUsername').value = user.username;
        document.getElementById('profileFullName').value = user.full_name;
        document.getElementById('profileEmail').value = user.email || '';
        document.getElementById('currentAvatar').src = user.avatar_url || 'https://via.placeholder.com/80';
        
    } catch (error) {
        showAlert('加载个人信息失败', 'error');
    }
}

async function updateProfile() {
    const profileData = {
        fullName: document.getElementById('profileFullName').value,
        email: document.getElementById('profileEmail').value,
    };
    
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    
    if (newPassword && !currentPassword) {
        showAlert('修改密码需要输入当前密码', 'error');
        return;
    }
    
    if (currentPassword && newPassword) {
        profileData.currentPassword = currentPassword;
        profileData.newPassword = newPassword;
    }
    
    try {
        showLoading();
        await apiCall('/users/profile', {
            method: 'PUT',
            body: JSON.stringify(profileData)
        });
        
        showAlert('个人信息更新成功！', 'success');
        
        // Clear password fields
        document.getElementById('currentPassword').value = '';
        document.getElementById('newPassword').value = '';
        
        // Update current user data
        currentUser.full_name = profileData.fullName;
        currentUser.email = profileData.email;
        updateUIAfterLogin();
        
    } catch (error) {
        showAlert(error.error || '更新失败', 'error');
    } finally {
        hideLoading();
    }
}

// Admin Functions
async function loadAdmin() {
    if (!currentUser || (currentUser.role !== 'advisor' && currentUser.role !== 'parent')) {
        showAlert('权限不足', 'error');
        return;
    }
    
    // Admin content will be loaded on demand
    document.getElementById('adminContent').innerHTML = '';
}

async function loadAllUsers() {
    try {
        showLoading();
        const response = await apiCall('/users/all');
        
        const adminContent = document.getElementById('adminContent');
        adminContent.innerHTML = `
            <div class="glass-container" style="padding: 2rem;">
                <h3 style="font-size: 1.25rem; font-weight: 600; margin-bottom: 1.5rem;">👥 所有用户</h3>
                <div style="display: grid; gap: 1rem;">
                    ${response.users.map(user => `
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; background: var(--gray-50); border-radius: var(--radius-lg);">
                            <div>
                                <h4 style="font-weight: 600; margin-bottom: 0.25rem;">${user.full_name}</h4>
                                <p style="color: var(--gray-600); font-size: 0.875rem;">@${user.username} | ${getRoleText(user.role)}</p>
                            </div>
                            <button class="btn-danger btn-modern delete-user-btn" data-user-id="${user.id}" data-username="${user.username}" style="padding: 0.5rem 1rem; font-size: 0.875rem;">
                                🗑️ 删除
                            </button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    } catch (error) {
        showAlert('加载用户列表失败', 'error');
    } finally {
        hideLoading();
    }
}

async function loadSystemStats() {
    try {
        showLoading();
        const response = await apiCall('/admin/dashboard');
        
        const adminContent = document.getElementById('adminContent');
        adminContent.innerHTML = `
            <div class="glass-container" style="padding: 2rem;">
                <h3 style="font-size: 1.25rem; font-weight: 600; margin-bottom: 1.5rem;">📊 系统统计</h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem;">
                    <div style="text-align: center; padding: 1.5rem; background: var(--gray-50); border-radius: var(--radius-lg);">
                        <div style="font-size: 2rem; margin-bottom: 0.5rem;">👥</div>
                        <h4 style="font-size: 1.125rem; font-weight: 600;">总用户数</h4>
                        <p style="font-size: 2rem; font-weight: 700; color: var(--primary-color);">${response.stats.totalUsers}</p>
                    </div>
                    <div style="text-align: center; padding: 1.5rem; background: var(--gray-50); border-radius: var(--radius-lg);">
                        <div style="font-size: 2rem; margin-bottom: 0.5rem;">📋</div>
                        <h4 style="font-size: 1.125rem; font-weight: 600;">总任务数</h4>
                        <p style="font-size: 2rem; font-weight: 700; color: var(--success-color);">${response.stats.totalTasks}</p>
                    </div>
                    <div style="text-align: center; padding: 1.5rem; background: var(--gray-50); border-radius: var(--radius-lg);">
                        <div style="font-size: 2rem; margin-bottom: 0.5rem;">⏳</div>
                        <h4 style="font-size: 1.125rem; font-weight: 600;">待批准任务</h4>
                        <p style="font-size: 2rem; font-weight: 700; color: var(--warning-color);">${response.stats.pendingApprovals}</p>
                    </div>
                    <div style="text-align: center; padding: 1.5rem; background: var(--gray-50); border-radius: var(--radius-lg);">
                        <div style="font-size: 2rem; margin-bottom: 0.5rem;">🔥</div>
                        <h4 style="font-size: 1.125rem; font-weight: 600;">活跃用户</h4>
                        <p style="font-size: 2rem; font-weight: 700; color: var(--danger-color);">${response.stats.activeUsers}</p>
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        showAlert('加载系统统计失败', 'error');
    } finally {
        hideLoading();
    }
}

function showCreateUserForm() {
    const adminContent = document.getElementById('adminContent');
    adminContent.innerHTML = `
        <div class="glass-container" style="padding: 2rem;">
            <h3 style="font-size: 1.25rem; font-weight: 600; margin-bottom: 1.5rem;">➕ 创建用户</h3>
            <form id="createUserForm">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                    <div class="form-group-modern">
                        <label class="form-label-modern">用户名</label>
                        <input type="text" id="newUsername" class="form-input-modern" required>
                    </div>
                    <div class="form-group-modern">
                        <label class="form-label-modern">全名</label>
                        <input type="text" id="newFullName" class="form-input-modern" required>
                    </div>
                </div>
                <div class="form-group-modern">
                    <label class="form-label-modern">邮箱</label>
                    <input type="email" id="newEmail" class="form-input-modern">
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                    <div class="form-group-modern">
                        <label class="form-label-modern">密码</label>
                        <input type="password" id="newPassword" class="form-input-modern" required>
                    </div>
                    <div class="form-group-modern">
                        <label class="form-label-modern">角色</label>
                        <select id="newRole" class="form-input-modern">
                            <option value="member">家庭成员</option>
                            <option value="parent">家长</option>
                            <option value="advisor">顾问</option>
                        </select>
                    </div>
                </div>
                <div style="display: flex; gap: 1rem;">
                    <button type="submit" class="btn-primary btn-modern">✅ 创建用户</button>
                    <button type="button" class="btn-outline btn-modern" id="cancelCreateUserBtn">❌ 取消</button>
                </div>
            </form>
        </div>
    `;
}

async function createUser(event) {
    event.preventDefault();
    
    const userData = {
        username: document.getElementById('newUsername').value,
        fullName: document.getElementById('newFullName').value,
        email: document.getElementById('newEmail').value,
        password: document.getElementById('newPassword').value,
        role: document.getElementById('newRole').value
    };
    
    try {
        showLoading();
        await apiCall('/admin/users', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
        
        showAlert('用户创建成功！', 'success');
        document.getElementById('adminContent').innerHTML = '';
    } catch (error) {
        showAlert(error.error || '创建用户失败', 'error');
    } finally {
        hideLoading();
    }
}

async function deleteUser(userId, username) {
    if (!confirm(`确定要删除用户 "${username}" 吗？这个操作不可撤销。`)) {
        return;
    }
    
    try {
        showLoading();
        await apiCall(`/admin/users/${userId}`, {
            method: 'DELETE'
        });
        
        showAlert('用户删除成功！', 'success');
        loadAllUsers(); // Refresh the user list
    } catch (error) {
        showAlert(error.error || '删除用户失败', 'error');
    } finally {
        hideLoading();
    }
}

function exportData() {
    showAlert('数据导出功能开发中...', 'info');
}

// Avatar System Functions
function openAvatarModal() {
    document.getElementById('avatarModal').style.display = 'flex';
    loadRandomAvatars();
}

function closeAvatarModal() {
    document.getElementById('avatarModal').style.display = 'none';
    selectedAvatarUrl = null;
    document.getElementById('avatarActions').style.display = 'none';
}

async function loadRandomAvatars() {
    const gallery = document.getElementById('avatarGallery');
    const avatarStyles = ['adventurer', 'avataaars', 'bottts', 'croodles', 'fun-emoji', 'lorelei', 'micah', 'miniavs', 'pixel-art', 'notionists'];
    
    // Generate 10 random avatars
    const selectedStyles = [...avatarStyles].sort(() => 0.5 - Math.random()).slice(0, 10);
    const avatarUrls = selectedStyles.map(style => {
        const seed = Math.random().toString(36).substring(2, 15);
        return `https://api.dicebear.com/9.x/${style}/svg?seed=${seed}`;
    });
    
    gallery.innerHTML = avatarUrls.map((src, index) => `
        <div class="avatar-option" data-avatar-src="${src}">
            <img src="${src}" alt="Avatar ${index + 1}">
        </div>
    `).join('');
}

function selectAvatar(avatarUrl, element) {
    selectedAvatarUrl = avatarUrl;

    // Update selection UI
    document.querySelectorAll('.avatar-option').forEach(el => el.classList.remove('selected'));
    if (element) {
        element.classList.add('selected');
    }

    // Show action buttons
    const avatarActions = document.getElementById('avatarActions');
    if (avatarActions) {
        avatarActions.style.display = 'flex';
    }
}

async function confirmAvatarSelection() {
    if (!selectedAvatarUrl) {
        showAlert('请先选择一个头像', 'error');
        return;
    }
    
    try {
        showLoading();
        const response = await apiCall('/users/avatar', {
            method: 'POST',
            body: JSON.stringify({ avatarUrl: selectedAvatarUrl })
        });
        
        showAlert('头像更新成功！', 'success');
        
        // Update UI
        document.getElementById('userAvatar').src = selectedAvatarUrl;
        document.getElementById('currentAvatar').src = selectedAvatarUrl;
        
        if (currentUser) currentUser.avatar_url = selectedAvatarUrl;
        
        closeAvatarModal();
    } catch (error) {
        showAlert(error.error || '更新失败', 'error');
    } finally {
        hideLoading();
    }
}

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
        showAlert('请选择图片文件', 'error');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        document.getElementById('imagePreview').src = e.target.result;
        document.getElementById('imagePreviewSection').style.display = 'block';
    };
    reader.readAsDataURL(file);
}

function adjustImageSize() {
    const slider = document.getElementById('imageSizeSlider');
    const preview = document.getElementById('imagePreview');
    const size = slider.value + 'px';
    
    preview.style.width = size;
    preview.style.height = size;
}

async function uploadCustomAvatar() {
    const fileInput = document.getElementById('avatarFileInput');
    const file = fileInput.files[0];
    
    if (!file) {
        showAlert('请先选择文件', 'error');
        return;
    }
    
    const formData = new FormData();
    formData.append('avatar', file);
    
    try {
        showLoading();
        const response = await apiCall('/users/avatar', {
            method: 'POST',
            body: formData
        });
        
        showAlert('头像上传成功！', 'success');
        
        // Update UI
        document.getElementById('userAvatar').src = response.avatarUrl;
        document.getElementById('currentAvatar').src = response.avatarUrl;
        
        if (currentUser) currentUser.avatar_url = response.avatarUrl;
        
        closeAvatarModal();
    } catch (error) {
        showAlert(error.error || '上传失败', 'error');
    } finally {
        hideLoading();
    }
}

function cancelFileUpload() {
    document.getElementById('avatarFileInput').value = '';
    document.getElementById('imagePreviewSection').style.display = 'none';
}

// Utility Functions for UI
function getTaskEmoji(status) {
    const emojis = {
        pending: '⏳',
        claimed: '🎯',
        in_progress: '🔄',
        completed: '✅',
        approved: '🎉'
    };
    return emojis[status] || '📋';
}

function getTaskStatusText(status) {
    const statuses = {
        pending: '待认领',
        claimed: '已认领',
        in_progress: '进行中',
        completed: '已完成',
        approved: '已批准'
    };
    return statuses[status] || status;
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    // Add smooth scrolling
    document.documentElement.style.scrollBehavior = 'smooth';
    
    // Add intersection observer for animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // Observe all cards for animation
    document.querySelectorAll('.glass-container, .modern-section').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
        observer.observe(el);
    });
    
    // Setup all event listeners
    setupEventListeners();
    
    // Initialize the app
    checkAuthStatus();
});

// Event Listeners Setup
function setupEventListeners() {
    // Navigation buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const section = this.getAttribute('data-section');
            if (section) {
                showSection(section);
            }
        });
    });
    
    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
    
    // Task management buttons
    const createTaskBtn = document.getElementById('createTaskBtn');
    if (createTaskBtn) {
        createTaskBtn.addEventListener('click', showCreateTaskForm);
    }
    
    const refreshTasksBtn = document.getElementById('refreshTasksBtn');
    if (refreshTasksBtn) {
        refreshTasksBtn.addEventListener('click', refreshTasks);
    }
    
    const taskFilter = document.getElementById('taskFilter');
    if (taskFilter) {
        taskFilter.addEventListener('change', filterTasks);
    }
    
    const submitTaskBtn = document.getElementById('submitTaskBtn');
    if (submitTaskBtn) {
        submitTaskBtn.addEventListener('click', createTask);
    }
    
    const cancelTaskBtn = document.getElementById('cancelTaskBtn');
    if (cancelTaskBtn) {
        cancelTaskBtn.addEventListener('click', hideCreateTaskForm);
    }
    
    // Leaderboard buttons
    document.querySelectorAll('.leaderboard-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const period = this.getAttribute('data-period');
            if (period) {
                loadLeaderboard(period);
            }
        });
    });
    
    // Profile buttons
    const changeAvatarBtn = document.getElementById('changeAvatarBtn');
    if (changeAvatarBtn) {
        changeAvatarBtn.addEventListener('click', openAvatarModal);
    }
    
    const saveProfileBtn = document.getElementById('saveProfileBtn');
    if (saveProfileBtn) {
        saveProfileBtn.addEventListener('click', updateProfile);
    }
    
    const resetProfileBtn = document.getElementById('resetProfileBtn');
    if (resetProfileBtn) {
        resetProfileBtn.addEventListener('click', loadUserProfile);
    }
    
    // Admin buttons
    const loadUsersBtn = document.getElementById('loadUsersBtn');
    if (loadUsersBtn) {
        loadUsersBtn.addEventListener('click', loadAllUsers);
    }
    
    const createUserBtn = document.getElementById('createUserBtn');
    if (createUserBtn) {
        createUserBtn.addEventListener('click', showCreateUserForm);
    }
    
    const loadStatsBtn = document.getElementById('loadStatsBtn');
    if (loadStatsBtn) {
        loadStatsBtn.addEventListener('click', loadSystemStats);
    }
    
    const exportDataBtn = document.getElementById('exportDataBtn');
    if (exportDataBtn) {
        exportDataBtn.addEventListener('click', exportData);
    }
    
    // Avatar modal buttons
    const closeAvatarModalBtn = document.getElementById('closeAvatarModalBtn');
    if (closeAvatarModalBtn) {
        closeAvatarModalBtn.addEventListener('click', closeAvatarModal);
    }
    
    const uploadAvatarBtn = document.getElementById('uploadAvatarBtn');
    if (uploadAvatarBtn) {
        uploadAvatarBtn.addEventListener('click', uploadCustomAvatar);
    }
    
    const cancelUploadBtn = document.getElementById('cancelUploadBtn');
    if (cancelUploadBtn) {
        cancelUploadBtn.addEventListener('click', cancelFileUpload);
    }
    
    const imageSizeSlider = document.getElementById('imageSizeSlider');
    if (imageSizeSlider) {
        imageSizeSlider.addEventListener('change', adjustImageSize);
    }
    
    const confirmAvatarBtn = document.getElementById('confirmAvatarBtn');
    if (confirmAvatarBtn) {
        confirmAvatarBtn.addEventListener('click', confirmAvatarSelection);
    }
    
    const cancelAvatarBtn = document.getElementById('cancelAvatarBtn');
    if (cancelAvatarBtn) {
        cancelAvatarBtn.addEventListener('click', closeAvatarModal);
    }
    
    const randomAvatarsBtn = document.getElementById('randomAvatarsBtn');
    if (randomAvatarsBtn) {
        randomAvatarsBtn.addEventListener('click', loadRandomAvatars);
    }

    const refreshGalleryBtn = document.getElementById('refreshGalleryBtn');
    if (refreshGalleryBtn) {
        refreshGalleryBtn.addEventListener('click', loadRandomAvatars);
    }

    // Achievement Wall event listeners
    const uploadAchievementBtn = document.getElementById('uploadAchievementBtn');
    if (uploadAchievementBtn) {
        uploadAchievementBtn.addEventListener('click', uploadAchievement);
    }

    const cancelAchievementBtn = document.getElementById('cancelAchievementBtn');
    if (cancelAchievementBtn) {
        cancelAchievementBtn.addEventListener('click', resetAchievementForm);
    }

    const refreshAchievementsBtn = document.getElementById('refreshAchievementsBtn');
    if (refreshAchievementsBtn) {
        refreshAchievementsBtn.addEventListener('click', () => loadAchievements(1));
    }

    const loadMoreAchievementsBtn = document.getElementById('loadMoreAchievementsBtn');
    if (loadMoreAchievementsBtn) {
        loadMoreAchievementsBtn.addEventListener('click', () => loadAchievements(currentAchievementPage + 1));
    }

    const achievementFilter = document.getElementById('achievementFilter');
    if (achievementFilter) {
        achievementFilter.addEventListener('change', (e) => loadAchievements(1, e.target.value));
    }

    // Setup achievement upload functionality
    setupAchievementUpload();

    // Group management event listeners
    const loadGroupsBtn = document.getElementById('loadGroupsBtn');
    if (loadGroupsBtn) {
        loadGroupsBtn.addEventListener('click', loadGroups);
    }

    const createGroupBtn = document.getElementById('createGroupBtn');
    if (createGroupBtn) {
        createGroupBtn.addEventListener('click', showCreateGroupForm);
    }

    // Role management event listeners
    const manageRolesBtn = document.getElementById('manageRolesBtn');
    if (manageRolesBtn) {
        manageRolesBtn.addEventListener('click', loadRoleManagement);
    }
    
    // File input for avatar upload
    const avatarFileInput = document.getElementById('avatarFileInput');
    if (avatarFileInput) {
        avatarFileInput.addEventListener('change', handleFileSelect);
    }
    
    // Event delegation for dynamically created elements
    document.addEventListener('click', function(e) {
        // Login/Register tab buttons
        if (e.target && e.target.id === 'loginTabBtn') {
            showLoginTab();
        } else if (e.target && e.target.id === 'registerTabBtn') {
            showRegisterTab();
        }
        
        // Delete user buttons
        else if (e.target && e.target.classList.contains('delete-user-btn')) {
            const userId = e.target.getAttribute('data-user-id');
            const username = e.target.getAttribute('data-username');
            if (userId && username) {
                deleteUser(userId, username);
            }
        }
        
        // Cancel create user button
        else if (e.target && e.target.id === 'cancelCreateUserBtn') {
            document.getElementById('adminContent').innerHTML = '';
        }
        
        // Avatar selection
        else if (e.target && e.target.closest('.avatar-option')) {
            const avatarOption = e.target.closest('.avatar-option');
            const avatarSrc = avatarOption.getAttribute('data-avatar-src');
            if (avatarSrc) {
                selectAvatar(avatarSrc, avatarOption);
            }
        }
    });
    
    // Event delegation for form submissions
    document.addEventListener('submit', function(e) {
        if (e.target && (e.target.id === 'loginForm' || e.target.id === 'modalLoginForm')) {
            e.preventDefault();
            login(e);
        } else if (e.target && (e.target.id === 'registerForm' || e.target.id === 'modalRegisterForm')) {
            e.preventDefault();
            register(e);
        } else if (e.target && e.target.id === 'createUserForm') {
            e.preventDefault();
            createUser(e);
        }
    });
}

// ===== Achievement Wall Functions =====
async function loadAchievements(page = 1, filter = '') {
    try {
        showLoading();
        const params = new URLSearchParams({ page, limit: 12 });
        if (filter) params.append('filter', filter);

        const response = await apiCall(`/achievements?${params}`);

        if (page === 1) {
            document.getElementById('achievementGallery').innerHTML = '';
        }

        renderAchievements(response.achievements);

        // Show/hide load more button
        const loadMoreBtn = document.getElementById('loadMoreAchievementsBtn');
        if (response.pagination.page < response.pagination.pages) {
            loadMoreBtn.style.display = 'block';
            currentAchievementPage = page;
        } else {
            loadMoreBtn.style.display = 'none';
        }

    } catch (error) {
        showAlert('加载成就失败: ' + (error.error || error.message), 'error');
    } finally {
        hideLoading();
    }
}

function renderAchievements(achievements) {
    const gallery = document.getElementById('achievementGallery');

    achievements.forEach(achievement => {
        const achievementCard = document.createElement('div');
        achievementCard.className = 'achievement-card';

        const imageHtml = achievement.image_url
            ? `<img src="${achievement.image_url}" alt="${achievement.title}" class="achievement-image">`
            : `<div class="achievement-image" style="display: flex; align-items: center; justify-content: center; background: var(--gray-100); color: var(--gray-400); font-size: 3rem;">📷</div>`;

        achievementCard.innerHTML = `
            ${imageHtml}
            <div class="achievement-content">
                <h3 class="achievement-title">${achievement.title}</h3>
                ${achievement.description ? `<p class="achievement-description">${achievement.description}</p>` : ''}
                <div class="achievement-meta">
                    <div class="achievement-user">
                        <img src="${achievement.avatar_url || '/assets/default-avatar.svg'}" alt="${achievement.full_name}">
                        <div>
                            <span>${achievement.full_name || achievement.username}</span>
                            <div class="achievement-date">${formatDate(achievement.created_at)}</div>
                        </div>
                    </div>
                    ${achievement.points_earned > 0 ? `<div class="achievement-points">+${achievement.points_earned}</div>` : ''}
                </div>
            </div>
        `;

        gallery.appendChild(achievementCard);
    });
}

function setupAchievementUpload() {
    const dropZone = document.getElementById('achievementDropZone');
    const fileInput = document.getElementById('achievementImageInput');
    const selectBtn = document.getElementById('selectImageBtn');
    const form = document.getElementById('achievementForm');
    const previewImage = document.getElementById('previewImage');

    // Click to select file
    selectBtn.addEventListener('click', () => fileInput.click());
    dropZone.addEventListener('click', () => fileInput.click());

    // File input change
    fileInput.addEventListener('change', handleImageSelect);

    // Drag and drop
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleImageFile(files[0]);
        }
    });
}

function handleImageSelect(event) {
    const file = event.target.files[0];
    if (file) {
        handleImageFile(file);
    }
}

function handleImageFile(file) {
    // Validate file type
    if (!file.type.startsWith('image/')) {
        showAlert('请选择图片文件', 'error');
        return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
        showAlert('图片文件不能超过 10MB', 'error');
        return;
    }

    achievementImageFile = file;

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
        document.getElementById('previewImage').src = e.target.result;
        document.getElementById('achievementForm').style.display = 'block';
    };
    reader.readAsDataURL(file);
}

async function uploadAchievement() {
    try {
        const title = document.getElementById('achievementTitle').value.trim();
        const description = document.getElementById('achievementDescription').value.trim();
        const points = document.getElementById('achievementPoints').value;

        if (!title) {
            showAlert('请输入成就标题', 'error');
            return;
        }

        if (!achievementImageFile) {
            showAlert('请选择图片', 'error');
            return;
        }

        showLoading();

        const formData = new FormData();
        formData.append('image', achievementImageFile);
        formData.append('title', title);
        if (description) formData.append('description', description);
        if (points) formData.append('pointsEarned', points);

        const response = await fetch(`${API_BASE}/achievements`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`
            },
            body: formData
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Upload failed');
        }

        showAlert('成就发布成功！', 'success');
        resetAchievementForm();
        loadAchievements(1); // Reload achievements

    } catch (error) {
        showAlert('发布失败: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

function resetAchievementForm() {
    document.getElementById('achievementForm').style.display = 'none';
    document.getElementById('achievementTitle').value = '';
    document.getElementById('achievementDescription').value = '';
    document.getElementById('achievementPoints').value = '0';
    document.getElementById('achievementImageInput').value = '';
    achievementImageFile = null;
}

// ===== Group Management Functions =====
async function loadGroups() {
    try {
        showLoading();
        const response = await apiCall('/groups');
        renderGroupsList(response.groups);
    } catch (error) {
        showAlert('加载家庭组失败: ' + (error.error || error.message), 'error');
    } finally {
        hideLoading();
    }
}

function renderGroupsList(groups) {
    const adminContent = document.getElementById('adminContent');

    let html = `
        <div class="glass-container" style="padding: 2rem;">
            <div class="flex justify-between items-center mb-6">
                <h3 style="font-size: 1.25rem; font-weight: 600;">家庭组列表</h3>
                <button class="btn-primary btn-modern" onclick="showCreateGroupForm()">➕ 创建新组</button>
            </div>

            <div class="grid gap-4">
    `;

    if (groups.length === 0) {
        html += `
            <div class="text-center py-8">
                <p class="text-gray-500">暂无家庭组</p>
            </div>
        `;
    } else {
        groups.forEach(group => {
            html += `
                <div class="group-card" style="border: 1px solid var(--gray-200); border-radius: var(--radius-lg); padding: 1.5rem; background: rgba(255, 255, 255, 0.8);">
                    <div class="flex justify-between items-start">
                        <div>
                            <h4 style="font-size: 1.125rem; font-weight: 600; margin-bottom: 0.5rem;">${group.name}</h4>
                            ${group.description ? `<p style="color: var(--gray-600); margin-bottom: 1rem;">${group.description}</p>` : ''}
                            <div class="flex gap-4 text-sm text-gray-500">
                                <span>👥 ${group.member_count} 成员</span>
                                <span>👤 创建者: ${group.created_by_name}</span>
                                <span>📅 ${formatDate(group.created_at)}</span>
                            </div>
                        </div>
                        <div class="flex gap-2">
                            <button class="btn-outline btn-modern" onclick="viewGroupDetails(${group.id})">查看详情</button>
                            <button class="btn-secondary btn-modern" onclick="editGroup(${group.id})">编辑</button>
                            <button class="btn-danger btn-modern" onclick="deleteGroup(${group.id})">删除</button>
                        </div>
                    </div>
                </div>
            `;
        });
    }

    html += `
            </div>
        </div>
    `;

    adminContent.innerHTML = html;
}

function showCreateGroupForm() {
    const adminContent = document.getElementById('adminContent');

    adminContent.innerHTML = `
        <div class="glass-container" style="padding: 2rem;">
            <div class="flex justify-between items-center mb-6">
                <h3 style="font-size: 1.25rem; font-weight: 600;">创建新家庭组</h3>
                <button class="btn-outline btn-modern" onclick="loadGroups()">返回列表</button>
            </div>

            <form id="createGroupForm" class="space-y-4">
                <div>
                    <label class="form-label-modern">组名称</label>
                    <input type="text" id="groupName" class="form-input-modern" placeholder="输入组名称" required>
                </div>
                <div>
                    <label class="form-label-modern">组描述</label>
                    <textarea id="groupDescription" class="form-input-modern" rows="3" placeholder="描述这个家庭组的用途..."></textarea>
                </div>
                <div class="flex gap-3">
                    <button type="submit" class="btn-primary btn-modern">✅ 创建组</button>
                    <button type="button" class="btn-outline btn-modern" onclick="loadGroups()">❌ 取消</button>
                </div>
            </form>
        </div>
    `;

    // Add form submit handler
    document.getElementById('createGroupForm').addEventListener('submit', createGroup);
}

async function createGroup(event) {
    event.preventDefault();

    try {
        const name = document.getElementById('groupName').value.trim();
        const description = document.getElementById('groupDescription').value.trim();

        if (!name) {
            showAlert('请输入组名称', 'error');
            return;
        }

        showLoading();

        await apiCall('/groups', {
            method: 'POST',
            body: JSON.stringify({ name, description })
        });

        showAlert('家庭组创建成功！', 'success');
        loadGroups();

    } catch (error) {
        showAlert('创建失败: ' + (error.error || error.message), 'error');
    } finally {
        hideLoading();
    }
}

async function viewGroupDetails(groupId) {
    try {
        showLoading();
        const response = await apiCall(`/groups/${groupId}`);
        renderGroupDetails(response.group, response.members);
    } catch (error) {
        showAlert('加载组详情失败: ' + (error.error || error.message), 'error');
    } finally {
        hideLoading();
    }
}

function renderGroupDetails(group, members) {
    const adminContent = document.getElementById('adminContent');

    let membersHtml = '';
    if (members.length === 0) {
        membersHtml = '<p class="text-gray-500 text-center py-4">暂无成员</p>';
    } else {
        membersHtml = members.map(member => `
            <div class="member-card" style="border: 1px solid var(--gray-200); border-radius: var(--radius-lg); padding: 1rem; background: rgba(255, 255, 255, 0.8);">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <img src="${member.avatar_url || '/assets/default-avatar.svg'}" alt="${member.full_name}" style="width: 40px; height: 40px; border-radius: 50%;">
                        <div>
                            <h5 style="font-weight: 600;">${member.full_name}</h5>
                            <p style="font-size: 0.875rem; color: var(--gray-600);">${member.username} • ${member.primary_role}</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-3">
                        <span class="achievement-points">+${member.total_points}</span>
                        <button class="btn-danger btn-modern" onclick="removeFromGroup(${group.id}, ${member.id})">移除</button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    adminContent.innerHTML = `
        <div class="glass-container" style="padding: 2rem;">
            <div class="flex justify-between items-center mb-6">
                <h3 style="font-size: 1.25rem; font-weight: 600;">${group.name} - 详情</h3>
                <button class="btn-outline btn-modern" onclick="loadGroups()">返回列表</button>
            </div>

            <div class="mb-6">
                ${group.description ? `<p style="color: var(--gray-600); margin-bottom: 1rem;">${group.description}</p>` : ''}
                <div class="flex gap-4 text-sm text-gray-500">
                    <span>👤 创建者: ${group.created_by_name}</span>
                    <span>📅 创建时间: ${formatDate(group.created_at)}</span>
                </div>
            </div>

            <div class="flex justify-between items-center mb-4">
                <h4 style="font-size: 1.125rem; font-weight: 600;">组成员 (${members.length})</h4>
                <button class="btn-secondary btn-modern" onclick="showAddMemberForm(${group.id})">➕ 添加成员</button>
            </div>

            <div class="grid gap-3">
                ${membersHtml}
            </div>
        </div>
    `;
}

// ===== Role Management Functions =====
async function loadRoleManagement() {
    try {
        showLoading();
        const response = await apiCall('/roles/users');
        renderRoleManagement(response.users);
    } catch (error) {
        showAlert('加载角色管理失败: ' + (error.error || error.message), 'error');
    } finally {
        hideLoading();
    }
}

function renderRoleManagement(users) {
    const adminContent = document.getElementById('adminContent');

    let html = `
        <div class="glass-container" style="padding: 2rem;">
            <div class="flex justify-between items-center mb-6">
                <h3 style="font-size: 1.25rem; font-weight: 600;">用户角色管理</h3>
                <button class="btn-outline btn-modern" onclick="loadAdmin()">返回管理面板</button>
            </div>

            <div class="grid gap-4">
    `;

    users.forEach(user => {
        const additionalRoles = user.additional_roles || [];
        const allRoles = [user.primary_role, ...additionalRoles].filter((role, index, arr) => arr.indexOf(role) === index);

        html += `
            <div class="user-role-card" style="border: 1px solid var(--gray-200); border-radius: var(--radius-lg); padding: 1.5rem; background: rgba(255, 255, 255, 0.8);">
                <div class="flex justify-between items-start">
                    <div class="flex items-center gap-3">
                        <img src="${user.avatar_url || '/assets/default-avatar.svg'}" alt="${user.full_name}" style="width: 50px; height: 50px; border-radius: 50%;">
                        <div>
                            <h4 style="font-size: 1.125rem; font-weight: 600;">${user.full_name}</h4>
                            <p style="color: var(--gray-600); font-size: 0.875rem;">@${user.username} • ${user.email}</p>
                            <div class="flex gap-2 mt-2">
                                <span class="role-badge primary-role">主要: ${getRoleDisplayName(user.primary_role)}</span>
                                ${additionalRoles.map(role => `<span class="role-badge additional-role">${getRoleDisplayName(role)}</span>`).join('')}
                            </div>
                        </div>
                    </div>
                    <div class="flex gap-2">
                        <button class="btn-secondary btn-modern" onclick="editUserRoles(${user.id})">编辑角色</button>
                        <button class="btn-outline btn-modern" onclick="viewUserPermissions(${user.id})">查看权限</button>
                    </div>
                </div>
            </div>
        `;
    });

    html += `
            </div>
        </div>
    `;

    adminContent.innerHTML = html;
}

function getRoleDisplayName(role) {
    const roleNames = {
        'advisor': '顾问',
        'parent': '家长',
        'member': '成员'
    };
    return roleNames[role] || role;
}

async function editUserRoles(userId) {
    try {
        showLoading();
        const userResponse = await apiCall(`/roles/user/${userId}`);
        const allUsers = await apiCall('/roles/users');
        const targetUser = allUsers.users.find(u => u.id === userId);

        showRoleEditModal(targetUser, userResponse.roles, userResponse.permissions);
    } catch (error) {
        showAlert('加载用户角色失败: ' + (error.error || error.message), 'error');
    } finally {
        hideLoading();
    }
}

function showRoleEditModal(user, currentRoles, currentPermissions) {
    const modal = document.createElement('div');
    modal.className = 'modal-modern';
    modal.style.display = 'flex';

    const availableRoles = ['advisor', 'parent', 'member'];
    const additionalRoles = currentRoles.filter(role => role !== user.primary_role);

    modal.innerHTML = `
        <div class="modal-content-modern" style="max-width: 600px;">
            <div class="modal-header-modern">
                <h3 class="modal-title">编辑用户角色 - ${user.full_name}</h3>
                <button class="close-modern" onclick="closeRoleEditModal()">✕</button>
            </div>

            <div style="padding: 2rem;">
                <div class="mb-6">
                    <label class="form-label-modern">主要角色</label>
                    <select id="primaryRole" class="form-input-modern">
                        ${availableRoles.map(role => `
                            <option value="${role}" ${role === user.primary_role ? 'selected' : ''}>
                                ${getRoleDisplayName(role)}
                            </option>
                        `).join('')}
                    </select>
                </div>

                <div class="mb-6">
                    <label class="form-label-modern">附加角色</label>
                    <div class="role-checkboxes" style="display: grid; gap: 0.5rem; margin-top: 0.5rem;">
                        ${availableRoles.map(role => `
                            <label style="display: flex; align-items: center; gap: 0.5rem;">
                                <input type="checkbox" value="${role}" ${additionalRoles.includes(role) ? 'checked' : ''}
                                       onchange="updateRolePreview()" id="role_${role}">
                                <span>${getRoleDisplayName(role)}</span>
                            </label>
                        `).join('')}
                    </div>
                </div>

                <div class="mb-6">
                    <h4 style="font-weight: 600; margin-bottom: 1rem;">当前权限预览</h4>
                    <div id="permissionsPreview" class="permissions-preview" style="background: var(--gray-50); padding: 1rem; border-radius: var(--radius-lg); font-size: 0.875rem;">
                        ${currentPermissions.map(perm => `<span class="permission-tag">${perm}</span>`).join('')}
                    </div>
                </div>

                <div class="flex gap-3">
                    <button class="btn-primary btn-modern" onclick="saveUserRoles(${user.id})">💾 保存更改</button>
                    <button class="btn-outline btn-modern" onclick="closeRoleEditModal()">❌ 取消</button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Add primary role change handler
    document.getElementById('primaryRole').addEventListener('change', updateRolePreview);
}

async function saveUserRoles(userId) {
    try {
        const primaryRole = document.getElementById('primaryRole').value;
        const additionalRoles = Array.from(document.querySelectorAll('.role-checkboxes input[type="checkbox"]:checked'))
            .map(cb => cb.value)
            .filter(role => role !== primaryRole);

        showLoading();

        // Update primary role
        await apiCall('/roles/primary', {
            method: 'PUT',
            body: JSON.stringify({ userId, role: primaryRole })
        });

        // Get current additional roles to compare
        const currentRolesResponse = await apiCall(`/roles/user/${userId}`);
        const currentAdditionalRoles = currentRolesResponse.roles.filter(role => role !== primaryRole);

        // Remove roles that are no longer selected
        for (const role of currentAdditionalRoles) {
            if (!additionalRoles.includes(role)) {
                await apiCall('/roles/remove', {
                    method: 'DELETE',
                    body: JSON.stringify({ userId, role })
                });
            }
        }

        // Add new roles
        for (const role of additionalRoles) {
            if (!currentAdditionalRoles.includes(role)) {
                await apiCall('/roles/assign', {
                    method: 'POST',
                    body: JSON.stringify({ userId, role })
                });
            }
        }

        showAlert('用户角色更新成功！', 'success');
        closeRoleEditModal();
        loadRoleManagement();

    } catch (error) {
        showAlert('保存失败: ' + (error.error || error.message), 'error');
    } finally {
        hideLoading();
    }
}

function closeRoleEditModal() {
    const modal = document.querySelector('.modal-modern');
    if (modal) {
        modal.remove();
    }
}

async function updateRolePreview() {
    // This would update the permissions preview based on selected roles
    // For now, just a placeholder
    // Role preview functionality placeholder
}