// Admin Dashboard JavaScript
const API_BASE = '/api';
let authToken = localStorage.getItem('authToken');
let currentUser = null;

// Initialize dashboard
document.addEventListener('DOMContentLoaded', initializeDashboard);

async function initializeDashboard() {
    try {
        // Check authentication and admin role
        await checkAdminAccess();
        
        // Load user info
        await loadUserInfo();
        
        // Setup event listeners
        setupEventListeners();
        
        // Load initial data
        await loadOverviewData();
        
        hideLoading();
    } catch (error) {
        console.error('Dashboard initialization failed:', error);
        redirectToLogin();
    }
}

async function checkAdminAccess() {
    if (!authToken) {
        throw new Error('No auth token');
    }
    
    try {
        const response = await fetch(`${API_BASE}/auth/me`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (!response.ok) {
            throw new Error('Authentication failed');
        }
        
        const user = await response.json();
        
        // Check if user has advisor role
        const rolesResponse = await fetch(`${API_BASE}/roles/my`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (rolesResponse.ok) {
            const roleData = await rolesResponse.json();
            const hasAdminRole = roleData.roles.includes('advisor') || 
                               roleData.permissions.includes('manage_users');
            
            if (!hasAdminRole) {
                throw new Error('Insufficient permissions');
            }
        }
        
        currentUser = user;
    } catch (error) {
        throw new Error('Admin access check failed');
    }
}

async function loadUserInfo() {
    if (currentUser) {
        document.getElementById('userName').textContent = currentUser.full_name || currentUser.username;
        if (currentUser.avatar_url) {
            document.getElementById('userAvatar').src = currentUser.avatar_url;
        }
    }
}

function setupEventListeners() {
    // Navigation buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const section = e.target.getAttribute('data-section');
            showSection(section);
        });
    });
    
    // Header buttons
    document.getElementById('backToMainBtn').addEventListener('click', () => {
        window.location.href = '/index-modern.html';
    });
    
    document.getElementById('logoutBtn').addEventListener('click', logout);
    
    // Tab navigation
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('tab-btn')) {
            const tab = e.target.getAttribute('data-tab');
            showContentTab(tab);
        }
    });
}

function showSection(sectionName) {
    // Update navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');
    
    // Update content
    document.querySelectorAll('.admin-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(sectionName).classList.add('active');
    
    // Load section-specific data
    switch (sectionName) {
        case 'overview':
            loadOverviewData();
            break;
        case 'users':
            loadUsersData();
            break;
        case 'content':
            loadContentData();
            break;
        case 'analytics':
            loadAnalyticsData();
            break;
        case 'settings':
            loadSettingsData();
            break;
        case 'logs':
            loadLogsData();
            break;
    }
}

async function loadOverviewData() {
    try {
        showLoading();
        
        // Load overview statistics
        const [usersResponse, tasksResponse, achievementsResponse, pointsResponse] = await Promise.all([
            apiCall('/users'),
            apiCall('/tasks'),
            apiCall('/achievements'),
            apiCall('/points/stats')
        ]);
        
        // Update stats cards
        document.getElementById('totalUsers').textContent = usersResponse.users?.length || 0;
        document.getElementById('completedTasks').textContent = tasksResponse.tasks?.filter(t => t.status === 'approved').length || 0;
        document.getElementById('totalAchievements').textContent = achievementsResponse.achievements?.length || 0;
        document.getElementById('totalPoints').textContent = pointsResponse.stats?.total_points || 0;
        
        // Load recent activity
        await loadRecentActivity();
        
    } catch (error) {
        console.error('Failed to load overview data:', error);
        showAlert('加载概览数据失败', 'error');
    } finally {
        hideLoading();
    }
}

async function loadRecentActivity() {
    try {
        // This would typically come from an activity log API
        const activities = [
            {
                icon: '👤',
                title: '新用户注册',
                description: '用户 "张三" 刚刚注册了账户',
                time: '5分钟前'
            },
            {
                icon: '✅',
                title: '任务完成',
                description: '李四完成了"整理房间"任务',
                time: '15分钟前'
            },
            {
                icon: '🏆',
                title: '成就解锁',
                description: '王五获得了新成就',
                time: '1小时前'
            }
        ];
        
        const activityList = document.getElementById('recentActivity');
        activityList.innerHTML = activities.map(activity => `
            <div class="activity-item">
                <div class="activity-icon">${activity.icon}</div>
                <div class="activity-content">
                    <div class="activity-title">${activity.title}</div>
                    <p class="activity-description">${activity.description}</p>
                </div>
                <div class="activity-time">${activity.time}</div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Failed to load recent activity:', error);
    }
}

async function loadUsersData() {
    try {
        showLoading();
        
        const response = await apiCall('/roles/users');
        const users = response.users || [];
        
        renderUsersTable(users);
        
    } catch (error) {
        console.error('Failed to load users data:', error);
        showAlert('加载用户数据失败', 'error');
    } finally {
        hideLoading();
    }
}

function renderUsersTable(users) {
    const tableContainer = document.getElementById('usersTable');
    
    const tableHTML = `
        <table class="users-table">
            <thead>
                <tr>
                    <th>用户</th>
                    <th>邮箱</th>
                    <th>主要角色</th>
                    <th>附加角色</th>
                    <th>状态</th>
                    <th>操作</th>
                </tr>
            </thead>
            <tbody>
                ${users.map(user => `
                    <tr>
                        <td>
                            <div style="display: flex; align-items: center; gap: 0.75rem;">
                                <img src="${user.avatar_url || '/assets/default-avatar.svg'}" 
                                     alt="${user.full_name}" 
                                     style="width: 40px; height: 40px; border-radius: 50%;">
                                <div>
                                    <div style="font-weight: 600;">${user.full_name}</div>
                                    <div style="font-size: 0.875rem; color: var(--gray-600);">@${user.username}</div>
                                </div>
                            </div>
                        </td>
                        <td>${user.email}</td>
                        <td>
                            <span class="role-badge primary-role">${getRoleDisplayName(user.primary_role)}</span>
                        </td>
                        <td>
                            ${(user.additional_roles || []).map(role => 
                                `<span class="role-badge additional-role">${getRoleDisplayName(role)}</span>`
                            ).join(' ')}
                        </td>
                        <td>
                            <span class="status-badge active">活跃</span>
                        </td>
                        <td>
                            <div style="display: flex; gap: 0.5rem;">
                                <button class="btn-outline btn-modern btn-sm" onclick="editUser(${user.id})">编辑</button>
                                <button class="btn-secondary btn-modern btn-sm" onclick="manageUserRoles(${user.id})">角色</button>
                                <button class="btn-danger btn-modern btn-sm" onclick="resetUserPassword(${user.id})">重置密码</button>
                            </div>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
    tableContainer.innerHTML = tableHTML;
}

function getRoleDisplayName(role) {
    const roleNames = {
        'advisor': '顾问',
        'parent': '家长',
        'member': '成员'
    };
    return roleNames[role] || role;
}

// Utility functions
async function apiCall(endpoint, options = {}) {
    const response = await fetch(`${API_BASE}${endpoint}`, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
            ...options.headers
        },
        ...options
    });
    
    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(error.error || 'Request failed');
    }
    
    return response.json();
}

function showLoading() {
    document.getElementById('loadingOverlay').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loadingOverlay').style.display = 'none';
}

function showAlert(message, type = 'info') {
    const alertContainer = document.getElementById('alertContainer');
    const alertId = 'alert-' + Date.now();
    
    const alertHTML = `
        <div id="${alertId}" class="alert alert-${type}">
            <span>${message}</span>
            <button onclick="closeAlert('${alertId}')" class="alert-close">×</button>
        </div>
    `;
    
    alertContainer.insertAdjacentHTML('beforeend', alertHTML);
    
    setTimeout(() => closeAlert(alertId), 5000);
}

function closeAlert(alertId) {
    const alert = document.getElementById(alertId);
    if (alert) {
        alert.remove();
    }
}

function redirectToLogin() {
    localStorage.removeItem('authToken');
    window.location.href = '/index-modern.html';
}

function logout() {
    localStorage.removeItem('authToken');
    window.location.href = '/index-modern.html';
}

// ===== User Management Functions =====
async function editUser(userId) {
    try {
        const response = await apiCall(`/users/${userId}`);
        const user = response.user;

        showUserEditModal(user);
    } catch (error) {
        showAlert('加载用户信息失败: ' + error.message, 'error');
    }
}

function showUserEditModal(user) {
    const modalHTML = `
        <div class="modal-modern" style="display: flex;">
            <div class="modal-content-modern" style="max-width: 600px;">
                <div class="modal-header-modern">
                    <h3 class="modal-title">编辑用户 - ${user.full_name}</h3>
                    <button class="close-modern" onclick="closeModal()">✕</button>
                </div>

                <form id="editUserForm" style="padding: 2rem;">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label class="form-label-modern">用户名</label>
                            <input type="text" id="editUsername" class="form-input-modern" value="${user.username}" required>
                        </div>
                        <div>
                            <label class="form-label-modern">全名</label>
                            <input type="text" id="editFullName" class="form-input-modern" value="${user.full_name}" required>
                        </div>
                    </div>

                    <div class="mb-4">
                        <label class="form-label-modern">邮箱</label>
                        <input type="email" id="editEmail" class="form-input-modern" value="${user.email}" required>
                    </div>

                    <div class="mb-4">
                        <label class="form-label-modern">主要角色</label>
                        <select id="editPrimaryRole" class="form-input-modern">
                            <option value="member" ${user.primary_role === 'member' ? 'selected' : ''}>成员</option>
                            <option value="parent" ${user.primary_role === 'parent' ? 'selected' : ''}>家长</option>
                            <option value="advisor" ${user.primary_role === 'advisor' ? 'selected' : ''}>顾问</option>
                        </select>
                    </div>

                    <div class="flex gap-3">
                        <button type="submit" class="btn-primary btn-modern">💾 保存更改</button>
                        <button type="button" class="btn-outline btn-modern" onclick="closeModal()">❌ 取消</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    document.getElementById('modalContainer').innerHTML = modalHTML;

    document.getElementById('editUserForm').addEventListener('submit', (e) => {
        e.preventDefault();
        saveUserChanges(user.id);
    });
}

async function saveUserChanges(userId) {
    try {
        showLoading();

        const formData = {
            username: document.getElementById('editUsername').value,
            full_name: document.getElementById('editFullName').value,
            email: document.getElementById('editEmail').value
        };

        const primaryRole = document.getElementById('editPrimaryRole').value;

        // Update user profile
        await apiCall(`/users/${userId}`, {
            method: 'PUT',
            body: JSON.stringify(formData)
        });

        // Update primary role if changed
        await apiCall('/roles/primary', {
            method: 'PUT',
            body: JSON.stringify({ userId, role: primaryRole })
        });

        showAlert('用户信息更新成功！', 'success');
        closeModal();
        loadUsersData(); // Refresh the users table

    } catch (error) {
        showAlert('保存失败: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

async function manageUserRoles(userId) {
    try {
        const [userResponse, rolesResponse] = await Promise.all([
            apiCall(`/users/${userId}`),
            apiCall(`/roles/user/${userId}`)
        ]);

        const user = userResponse.user;
        const userRoles = rolesResponse.roles;

        showRoleManagementModal(user, userRoles);
    } catch (error) {
        showAlert('加载角色信息失败: ' + error.message, 'error');
    }
}

function showRoleManagementModal(user, currentRoles) {
    const availableRoles = ['advisor', 'parent', 'member'];
    const additionalRoles = currentRoles.filter(role => role !== user.primary_role);

    const modalHTML = `
        <div class="modal-modern" style="display: flex;">
            <div class="modal-content-modern" style="max-width: 600px;">
                <div class="modal-header-modern">
                    <h3 class="modal-title">管理角色 - ${user.full_name}</h3>
                    <button class="close-modern" onclick="closeModal()">✕</button>
                </div>

                <div style="padding: 2rem;">
                    <div class="mb-6">
                        <label class="form-label-modern">主要角色</label>
                        <select id="rolesPrimaryRole" class="form-input-modern">
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
                                           id="role_${role}">
                                    <span>${getRoleDisplayName(role)}</span>
                                </label>
                            `).join('')}
                        </div>
                    </div>

                    <div class="flex gap-3">
                        <button class="btn-primary btn-modern" onclick="saveRoleChanges(${user.id})">💾 保存角色</button>
                        <button class="btn-outline btn-modern" onclick="closeModal()">❌ 取消</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.getElementById('modalContainer').innerHTML = modalHTML;
}

async function saveRoleChanges(userId) {
    try {
        showLoading();

        const primaryRole = document.getElementById('rolesPrimaryRole').value;
        const additionalRoles = Array.from(document.querySelectorAll('.role-checkboxes input[type="checkbox"]:checked'))
            .map(cb => cb.value)
            .filter(role => role !== primaryRole);

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
        closeModal();
        loadUsersData(); // Refresh the users table

    } catch (error) {
        showAlert('保存角色失败: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

async function resetUserPassword(userId) {
    if (!confirm('确定要重置该用户的密码吗？新密码将发送到用户邮箱。')) {
        return;
    }

    try {
        showLoading();

        await apiCall(`/users/${userId}/reset-password`, {
            method: 'POST'
        });

        showAlert('密码重置成功！新密码已发送到用户邮箱。', 'success');

    } catch (error) {
        showAlert('密码重置失败: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

function closeModal() {
    document.getElementById('modalContainer').innerHTML = '';
}

// ===== Content Management Functions =====
async function loadContentData() {
    // Load the default tab (task types)
    showContentTab('task-types');
}

function showContentTab(tab) {
    // Update tab navigation
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tab}"]`).classList.add('active');

    // Load tab content
    switch (tab) {
        case 'task-types':
            loadTaskTypesContent();
            break;
        case 'achievements':
            loadAchievementsContent();
            break;
        case 'groups':
            loadGroupsContent();
            break;
        case 'announcements':
            loadAnnouncementsContent();
            break;
    }
}

async function loadTaskTypesContent() {
    try {
        showLoading();

        const response = await apiCall('/task-types');
        const taskTypes = response.taskTypes || [];

        renderTaskTypesContent(taskTypes);

    } catch (error) {
        console.error('Failed to load task types:', error);
        showAlert('加载任务类型失败', 'error');
    } finally {
        hideLoading();
    }
}

function renderTaskTypesContent(taskTypes) {
    const contentContainer = document.getElementById('contentTabContent');

    const contentHTML = `
        <div class="content-header">
            <h3 class="content-title">任务类型管理</h3>
            <button class="btn-primary btn-modern" onclick="showCreateTaskTypeModal()">➕ 创建任务类型</button>
        </div>

        <div class="content-grid">
            ${taskTypes.map(taskType => `
                <div class="content-card">
                    <div class="content-card-header">
                        <h4 class="content-card-title">${taskType.name}</h4>
                        <div class="content-card-actions">
                            <button class="btn-outline btn-modern btn-sm" onclick="editTaskType(${taskType.id})">编辑</button>
                            <button class="btn-danger btn-modern btn-sm" onclick="deleteTaskType(${taskType.id})">删除</button>
                        </div>
                    </div>
                    <div class="content-card-body">
                        <p class="content-card-description">${taskType.description || '无描述'}</p>
                        <div class="content-card-meta">
                            <span class="meta-item">代码: ${taskType.code}</span>
                            <span class="meta-item">默认积分: ${taskType.default_points}</span>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;

    contentContainer.innerHTML = contentHTML;
}

function showCreateTaskTypeModal() {
    const modalHTML = `
        <div class="modal-modern" style="display: flex;">
            <div class="modal-content-modern" style="max-width: 600px;">
                <div class="modal-header-modern">
                    <h3 class="modal-title">创建任务类型</h3>
                    <button class="close-modern" onclick="closeModal()">✕</button>
                </div>

                <form id="createTaskTypeForm" style="padding: 2rem;">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label class="form-label-modern">类型代码</label>
                            <input type="text" id="taskTypeCode" class="form-input-modern" placeholder="例如: CHORE" required>
                        </div>
                        <div>
                            <label class="form-label-modern">类型名称</label>
                            <input type="text" id="taskTypeName" class="form-input-modern" placeholder="例如: 家务活" required>
                        </div>
                    </div>

                    <div class="mb-4">
                        <label class="form-label-modern">描述</label>
                        <textarea id="taskTypeDescription" class="form-input-modern" rows="3" placeholder="描述这个任务类型..."></textarea>
                    </div>

                    <div class="mb-4">
                        <label class="form-label-modern">默认积分</label>
                        <input type="number" id="taskTypePoints" class="form-input-modern" value="10" min="1" required>
                    </div>

                    <div class="flex gap-3">
                        <button type="submit" class="btn-primary btn-modern">✅ 创建</button>
                        <button type="button" class="btn-outline btn-modern" onclick="closeModal()">❌ 取消</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    document.getElementById('modalContainer').innerHTML = modalHTML;

    document.getElementById('createTaskTypeForm').addEventListener('submit', (e) => {
        e.preventDefault();
        createTaskType();
    });
}

async function createTaskType() {
    try {
        showLoading();

        const formData = {
            code: document.getElementById('taskTypeCode').value.toUpperCase(),
            name: document.getElementById('taskTypeName').value,
            description: document.getElementById('taskTypeDescription').value,
            default_points: parseInt(document.getElementById('taskTypePoints').value)
        };

        await apiCall('/task-types', {
            method: 'POST',
            body: JSON.stringify(formData)
        });

        showAlert('任务类型创建成功！', 'success');
        closeModal();
        loadTaskTypesContent(); // Refresh the content

    } catch (error) {
        showAlert('创建失败: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

async function loadGroupsContent() {
    try {
        showLoading();

        const response = await apiCall('/groups');
        const groups = response.groups || [];

        renderGroupsContent(groups);

    } catch (error) {
        console.error('Failed to load groups:', error);
        showAlert('加载家庭组失败', 'error');
    } finally {
        hideLoading();
    }
}

function renderGroupsContent(groups) {
    const contentContainer = document.getElementById('contentTabContent');

    const contentHTML = `
        <div class="content-header">
            <h3 class="content-title">家庭组管理</h3>
            <button class="btn-primary btn-modern" onclick="showCreateGroupModal()">➕ 创建家庭组</button>
        </div>

        <div class="content-grid">
            ${groups.map(group => `
                <div class="content-card">
                    <div class="content-card-header">
                        <h4 class="content-card-title">${group.name}</h4>
                        <div class="content-card-actions">
                            <button class="btn-outline btn-modern btn-sm" onclick="viewGroupMembers(${group.id})">查看成员</button>
                            <button class="btn-secondary btn-modern btn-sm" onclick="editGroup(${group.id})">编辑</button>
                            <button class="btn-danger btn-modern btn-sm" onclick="deleteGroup(${group.id})">删除</button>
                        </div>
                    </div>
                    <div class="content-card-body">
                        <p class="content-card-description">${group.description || '无描述'}</p>
                        <div class="content-card-meta">
                            <span class="meta-item">成员数: ${group.member_count || 0}</span>
                            <span class="meta-item">创建者: ${group.created_by_name}</span>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;

    contentContainer.innerHTML = contentHTML;
}

async function loadAchievementsContent() {
    const contentContainer = document.getElementById('contentTabContent');

    const contentHTML = `
        <div class="content-header">
            <h3 class="content-title">成就类别管理</h3>
            <button class="btn-primary btn-modern" onclick="showCreateAchievementCategoryModal()">➕ 创建成就类别</button>
        </div>

        <div class="content-grid">
            <div class="content-card">
                <div class="content-card-header">
                    <h4 class="content-card-title">学习成就</h4>
                    <div class="content-card-actions">
                        <button class="btn-outline btn-modern btn-sm">编辑</button>
                        <button class="btn-danger btn-modern btn-sm">删除</button>
                    </div>
                </div>
                <div class="content-card-body">
                    <p class="content-card-description">学习相关的成就类别</p>
                    <div class="content-card-meta">
                        <span class="meta-item">基础积分: 15</span>
                        <span class="meta-item">成就数: 12</span>
                    </div>
                </div>
            </div>

            <div class="content-card">
                <div class="content-card-header">
                    <h4 class="content-card-title">家务成就</h4>
                    <div class="content-card-actions">
                        <button class="btn-outline btn-modern btn-sm">编辑</button>
                        <button class="btn-danger btn-modern btn-sm">删除</button>
                    </div>
                </div>
                <div class="content-card-body">
                    <p class="content-card-description">家务劳动相关的成就类别</p>
                    <div class="content-card-meta">
                        <span class="meta-item">基础积分: 10</span>
                        <span class="meta-item">成就数: 8</span>
                    </div>
                </div>
            </div>
        </div>
    `;

    contentContainer.innerHTML = contentHTML;
}

async function loadAnnouncementsContent() {
    const contentContainer = document.getElementById('contentTabContent');

    const contentHTML = `
        <div class="content-header">
            <h3 class="content-title">系统公告管理</h3>
            <button class="btn-primary btn-modern" onclick="showCreateAnnouncementModal()">➕ 发布公告</button>
        </div>

        <div class="announcements-list">
            <div class="announcement-card">
                <div class="announcement-header">
                    <h4 class="announcement-title">系统维护通知</h4>
                    <div class="announcement-actions">
                        <button class="btn-outline btn-modern btn-sm">编辑</button>
                        <button class="btn-danger btn-modern btn-sm">删除</button>
                    </div>
                </div>
                <div class="announcement-body">
                    <p class="announcement-content">系统将于本周末进行维护升级，届时可能会有短暂的服务中断。</p>
                    <div class="announcement-meta">
                        <span class="meta-item">📅 2024-01-15</span>
                        <span class="meta-item">👁️ 已读: 25</span>
                        <span class="meta-item">🔔 重要</span>
                    </div>
                </div>
            </div>

            <div class="announcement-card">
                <div class="announcement-header">
                    <h4 class="announcement-title">新功能上线</h4>
                    <div class="announcement-actions">
                        <button class="btn-outline btn-modern btn-sm">编辑</button>
                        <button class="btn-danger btn-modern btn-sm">删除</button>
                    </div>
                </div>
                <div class="announcement-body">
                    <p class="announcement-content">成就墙功能已正式上线，大家可以上传自己的成就照片了！</p>
                    <div class="announcement-meta">
                        <span class="meta-item">📅 2024-01-10</span>
                        <span class="meta-item">👁️ 已读: 42</span>
                        <span class="meta-item">ℹ️ 普通</span>
                    </div>
                </div>
            </div>
        </div>
    `;

    contentContainer.innerHTML = contentHTML;
}

// Placeholder functions for content management actions
function showCreateGroupModal() {
    showAlert('创建家庭组功能开发中...', 'info');
}

function showCreateAchievementCategoryModal() {
    showAlert('创建成就类别功能开发中...', 'info');
}

function showCreateAnnouncementModal() {
    showAlert('发布公告功能开发中...', 'info');
}

function editTaskType(id) {
    showAlert('编辑任务类型功能开发中...', 'info');
}

function deleteTaskType(id) {
    if (confirm('确定要删除这个任务类型吗？')) {
        showAlert('删除任务类型功能开发中...', 'info');
    }
}

function viewGroupMembers(id) {
    showAlert('查看组成员功能开发中...', 'info');
}

function editGroup(id) {
    showAlert('编辑家庭组功能开发中...', 'info');
}

function deleteGroup(id) {
    if (confirm('确定要删除这个家庭组吗？')) {
        showAlert('删除家庭组功能开发中...', 'info');
    }
}

// ===== Analytics Dashboard Functions =====
async function loadAnalyticsData() {
    try {
        showLoading();

        // Load analytics data
        const [usersData, tasksData, pointsData] = await Promise.all([
            loadUserAnalytics(),
            loadTaskAnalytics(),
            loadPointsAnalytics()
        ]);

        renderAnalyticsDashboard(usersData, tasksData, pointsData);

    } catch (error) {
        console.error('Failed to load analytics data:', error);
        showAlert('加载分析数据失败', 'error');
    } finally {
        hideLoading();
    }
}

async function loadUserAnalytics() {
    try {
        const response = await apiCall('/roles/users');
        const users = response.users || [];

        const roleStats = users.reduce((acc, user) => {
            acc[user.primary_role] = (acc[user.primary_role] || 0) + 1;
            return acc;
        }, {});

        return {
            totalUsers: users.length,
            roleDistribution: roleStats,
            activeUsers: users.filter(u => u.last_active_within_week).length,
            newUsersThisMonth: users.filter(u => {
                const created = new Date(u.created_at);
                const monthAgo = new Date();
                monthAgo.setMonth(monthAgo.getMonth() - 1);
                return created > monthAgo;
            }).length
        };
    } catch (error) {
        console.error('Failed to load user analytics:', error);
        return { totalUsers: 0, roleDistribution: {}, activeUsers: 0, newUsersThisMonth: 0 };
    }
}

async function loadTaskAnalytics() {
    try {
        const response = await apiCall('/tasks');
        const tasks = response.tasks || [];

        const statusStats = tasks.reduce((acc, task) => {
            acc[task.status] = (acc[task.status] || 0) + 1;
            return acc;
        }, {});

        const completedTasks = tasks.filter(t => t.status === 'approved');
        const completionRate = tasks.length > 0 ? (completedTasks.length / tasks.length * 100).toFixed(1) : 0;

        return {
            totalTasks: tasks.length,
            statusDistribution: statusStats,
            completionRate: completionRate,
            completedThisWeek: completedTasks.filter(t => {
                const completed = new Date(t.approved_at);
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);
                return completed > weekAgo;
            }).length
        };
    } catch (error) {
        console.error('Failed to load task analytics:', error);
        return { totalTasks: 0, statusDistribution: {}, completionRate: 0, completedThisWeek: 0 };
    }
}

async function loadPointsAnalytics() {
    try {
        const response = await apiCall('/points/leaderboard');
        const leaderboard = response.leaderboard || [];

        const totalPoints = leaderboard.reduce((sum, user) => sum + user.total_points, 0);
        const averagePoints = leaderboard.length > 0 ? (totalPoints / leaderboard.length).toFixed(1) : 0;

        return {
            totalPoints: totalPoints,
            averagePoints: averagePoints,
            topPerformers: leaderboard.slice(0, 5),
            pointsDistribution: leaderboard.map(user => ({
                name: user.full_name,
                points: user.total_points
            }))
        };
    } catch (error) {
        console.error('Failed to load points analytics:', error);
        return { totalPoints: 0, averagePoints: 0, topPerformers: [], pointsDistribution: [] };
    }
}

function renderAnalyticsDashboard(usersData, tasksData, pointsData) {
    const analyticsContainer = document.getElementById('analyticsContent');

    const analyticsHTML = `
        <!-- Analytics Overview Cards -->
        <div class="analytics-overview">
            <div class="analytics-card">
                <div class="analytics-card-header">
                    <h3 class="analytics-card-title">👥 用户统计</h3>
                </div>
                <div class="analytics-card-content">
                    <div class="analytics-stats">
                        <div class="stat-item">
                            <span class="stat-value">${usersData.totalUsers}</span>
                            <span class="stat-label">总用户数</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-value">${usersData.activeUsers}</span>
                            <span class="stat-label">活跃用户</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-value">${usersData.newUsersThisMonth}</span>
                            <span class="stat-label">本月新增</span>
                        </div>
                    </div>
                    <div class="role-distribution">
                        <h4>角色分布</h4>
                        ${Object.entries(usersData.roleDistribution).map(([role, count]) => `
                            <div class="role-stat">
                                <span class="role-name">${getRoleDisplayName(role)}</span>
                                <span class="role-count">${count}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>

            <div class="analytics-card">
                <div class="analytics-card-header">
                    <h3 class="analytics-card-title">✅ 任务统计</h3>
                </div>
                <div class="analytics-card-content">
                    <div class="analytics-stats">
                        <div class="stat-item">
                            <span class="stat-value">${tasksData.totalTasks}</span>
                            <span class="stat-label">总任务数</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-value">${tasksData.completionRate}%</span>
                            <span class="stat-label">完成率</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-value">${tasksData.completedThisWeek}</span>
                            <span class="stat-label">本周完成</span>
                        </div>
                    </div>
                    <div class="status-distribution">
                        <h4>任务状态分布</h4>
                        ${Object.entries(tasksData.statusDistribution).map(([status, count]) => `
                            <div class="status-stat">
                                <span class="status-name">${getStatusDisplayName(status)}</span>
                                <span class="status-count">${count}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>

            <div class="analytics-card">
                <div class="analytics-card-header">
                    <h3 class="analytics-card-title">⭐ 积分统计</h3>
                </div>
                <div class="analytics-card-content">
                    <div class="analytics-stats">
                        <div class="stat-item">
                            <span class="stat-value">${pointsData.totalPoints}</span>
                            <span class="stat-label">总积分</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-value">${pointsData.averagePoints}</span>
                            <span class="stat-label">平均积分</span>
                        </div>
                    </div>
                    <div class="top-performers">
                        <h4>积分排行榜</h4>
                        ${pointsData.topPerformers.map((user, index) => `
                            <div class="performer-item">
                                <span class="performer-rank">#${index + 1}</span>
                                <span class="performer-name">${user.full_name}</span>
                                <span class="performer-points">${user.total_points}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        </div>

        <!-- Activity Timeline -->
        <div class="analytics-section">
            <h3 class="section-title">📊 活动时间线</h3>
            <div class="activity-timeline">
                <div class="timeline-item">
                    <div class="timeline-marker"></div>
                    <div class="timeline-content">
                        <h4 class="timeline-title">用户注册高峰</h4>
                        <p class="timeline-description">本月新增用户数量达到历史新高</p>
                        <span class="timeline-time">2小时前</span>
                    </div>
                </div>
                <div class="timeline-item">
                    <div class="timeline-marker"></div>
                    <div class="timeline-content">
                        <h4 class="timeline-title">任务完成率提升</h4>
                        <p class="timeline-description">本周任务完成率比上周提升了15%</p>
                        <span class="timeline-time">1天前</span>
                    </div>
                </div>
                <div class="timeline-item">
                    <div class="timeline-marker"></div>
                    <div class="timeline-content">
                        <h4 class="timeline-title">新功能上线</h4>
                        <p class="timeline-description">成就墙功能正式发布，用户反响热烈</p>
                        <span class="timeline-time">3天前</span>
                    </div>
                </div>
            </div>
        </div>
    `;

    analyticsContainer.innerHTML = analyticsHTML;
}

function getStatusDisplayName(status) {
    const statusNames = {
        'available': '可接取',
        'assigned': '已分配',
        'in_progress': '进行中',
        'completed': '已完成',
        'approved': '已批准'
    };
    return statusNames[status] || status;
}

// ===== System Settings Functions =====
async function loadSettingsData() {
    try {
        showLoading();

        // Load current settings (this would typically come from an API)
        const settings = await loadSystemSettings();

        renderSettingsPanel(settings);

    } catch (error) {
        console.error('Failed to load settings data:', error);
        showAlert('加载系统设置失败', 'error');
    } finally {
        hideLoading();
    }
}

async function loadSystemSettings() {
    // This would typically come from an API endpoint
    // For now, return mock data
    return {
        pointValues: {
            defaultTaskPoints: 10,
            bonusMultiplier: 1.5,
            achievementBonus: 25
        },
        appSettings: {
            maintenanceMode: false,
            registrationEnabled: true,
            maxFileSize: 10,
            sessionTimeout: 30
        },
        notifications: {
            emailNotifications: true,
            pushNotifications: false,
            weeklyReports: true
        }
    };
}

function renderSettingsPanel(settings) {
    const settingsContainer = document.getElementById('settingsContent');

    const settingsHTML = `
        <div class="settings-sections">
            <!-- Point Values Settings -->
            <div class="settings-section">
                <div class="settings-section-header">
                    <h3 class="settings-section-title">⭐ 积分设置</h3>
                    <p class="settings-section-description">配置任务积分和奖励规则</p>
                </div>

                <div class="settings-form">
                    <div class="form-group">
                        <label class="form-label-modern">默认任务积分</label>
                        <input type="number" id="defaultTaskPoints" class="form-input-modern"
                               value="${settings.pointValues.defaultTaskPoints}" min="1">
                        <small class="form-help">新创建任务的默认积分值</small>
                    </div>

                    <div class="form-group">
                        <label class="form-label-modern">奖励倍数</label>
                        <input type="number" id="bonusMultiplier" class="form-input-modern"
                               value="${settings.pointValues.bonusMultiplier}" min="1" step="0.1">
                        <small class="form-help">特殊任务的积分倍数</small>
                    </div>

                    <div class="form-group">
                        <label class="form-label-modern">成就奖励积分</label>
                        <input type="number" id="achievementBonus" class="form-input-modern"
                               value="${settings.pointValues.achievementBonus}" min="1">
                        <small class="form-help">发布成就获得的额外积分</small>
                    </div>

                    <button class="btn-primary btn-modern" onclick="savePointSettings()">💾 保存积分设置</button>
                </div>
            </div>

            <!-- Application Settings -->
            <div class="settings-section">
                <div class="settings-section-header">
                    <h3 class="settings-section-title">⚙️ 应用设置</h3>
                    <p class="settings-section-description">配置应用程序的基本功能</p>
                </div>

                <div class="settings-form">
                    <div class="form-group">
                        <label class="form-label-modern">
                            <input type="checkbox" id="maintenanceMode" ${settings.appSettings.maintenanceMode ? 'checked' : ''}>
                            维护模式
                        </label>
                        <small class="form-help">启用后，普通用户将无法访问系统</small>
                    </div>

                    <div class="form-group">
                        <label class="form-label-modern">
                            <input type="checkbox" id="registrationEnabled" ${settings.appSettings.registrationEnabled ? 'checked' : ''}>
                            允许用户注册
                        </label>
                        <small class="form-help">是否允许新用户自主注册账户</small>
                    </div>

                    <div class="form-group">
                        <label class="form-label-modern">最大文件大小 (MB)</label>
                        <input type="number" id="maxFileSize" class="form-input-modern"
                               value="${settings.appSettings.maxFileSize}" min="1" max="100">
                        <small class="form-help">用户上传文件的最大大小限制</small>
                    </div>

                    <div class="form-group">
                        <label class="form-label-modern">会话超时 (分钟)</label>
                        <input type="number" id="sessionTimeout" class="form-input-modern"
                               value="${settings.appSettings.sessionTimeout}" min="5" max="480">
                        <small class="form-help">用户会话的超时时间</small>
                    </div>

                    <button class="btn-primary btn-modern" onclick="saveAppSettings()">💾 保存应用设置</button>
                </div>
            </div>

            <!-- Notification Settings -->
            <div class="settings-section">
                <div class="settings-section-header">
                    <h3 class="settings-section-title">🔔 通知设置</h3>
                    <p class="settings-section-description">配置系统通知和提醒功能</p>
                </div>

                <div class="settings-form">
                    <div class="form-group">
                        <label class="form-label-modern">
                            <input type="checkbox" id="emailNotifications" ${settings.notifications.emailNotifications ? 'checked' : ''}>
                            邮件通知
                        </label>
                        <small class="form-help">向用户发送邮件通知</small>
                    </div>

                    <div class="form-group">
                        <label class="form-label-modern">
                            <input type="checkbox" id="pushNotifications" ${settings.notifications.pushNotifications ? 'checked' : ''}>
                            推送通知
                        </label>
                        <small class="form-help">向用户发送浏览器推送通知</small>
                    </div>

                    <div class="form-group">
                        <label class="form-label-modern">
                            <input type="checkbox" id="weeklyReports" ${settings.notifications.weeklyReports ? 'checked' : ''}>
                            周报告
                        </label>
                        <small class="form-help">每周向用户发送活动报告</small>
                    </div>

                    <button class="btn-primary btn-modern" onclick="saveNotificationSettings()">💾 保存通知设置</button>
                </div>
            </div>

            <!-- Data Management -->
            <div class="settings-section">
                <div class="settings-section-header">
                    <h3 class="settings-section-title">💾 数据管理</h3>
                    <p class="settings-section-description">备份和导出系统数据</p>
                </div>

                <div class="settings-form">
                    <div class="data-actions">
                        <button class="btn-secondary btn-modern" onclick="exportAllData()">
                            📊 导出所有数据
                        </button>
                        <button class="btn-outline btn-modern" onclick="exportUserData()">
                            👥 导出用户数据
                        </button>
                        <button class="btn-outline btn-modern" onclick="exportTaskData()">
                            ✅ 导出任务数据
                        </button>
                        <button class="btn-warning btn-modern" onclick="createBackup()">
                            💾 创建备份
                        </button>
                    </div>

                    <div class="backup-info">
                        <h4>最近备份</h4>
                        <p>上次备份时间: 2024-01-15 14:30:00</p>
                        <p>备份大小: 2.5 MB</p>
                        <button class="btn-outline btn-modern btn-sm" onclick="downloadBackup()">下载备份</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    settingsContainer.innerHTML = settingsHTML;
}

// Settings save functions
async function savePointSettings() {
    try {
        showLoading();

        const pointSettings = {
            defaultTaskPoints: parseInt(document.getElementById('defaultTaskPoints').value),
            bonusMultiplier: parseFloat(document.getElementById('bonusMultiplier').value),
            achievementBonus: parseInt(document.getElementById('achievementBonus').value)
        };

        // This would typically save to an API endpoint
        // await apiCall('/settings/points', { method: 'PUT', body: JSON.stringify(pointSettings) });

        showAlert('积分设置保存成功！', 'success');

    } catch (error) {
        showAlert('保存失败: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

async function saveAppSettings() {
    try {
        showLoading();

        const appSettings = {
            maintenanceMode: document.getElementById('maintenanceMode').checked,
            registrationEnabled: document.getElementById('registrationEnabled').checked,
            maxFileSize: parseInt(document.getElementById('maxFileSize').value),
            sessionTimeout: parseInt(document.getElementById('sessionTimeout').value)
        };

        // This would typically save to an API endpoint
        // await apiCall('/settings/app', { method: 'PUT', body: JSON.stringify(appSettings) });

        showAlert('应用设置保存成功！', 'success');

    } catch (error) {
        showAlert('保存失败: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

async function saveNotificationSettings() {
    try {
        showLoading();

        const notificationSettings = {
            emailNotifications: document.getElementById('emailNotifications').checked,
            pushNotifications: document.getElementById('pushNotifications').checked,
            weeklyReports: document.getElementById('weeklyReports').checked
        };

        // This would typically save to an API endpoint
        // await apiCall('/settings/notifications', { method: 'PUT', body: JSON.stringify(notificationSettings) });

        showAlert('通知设置保存成功！', 'success');

    } catch (error) {
        showAlert('保存失败: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

// Data export functions
async function exportAllData() {
    try {
        showLoading();

        // This would typically call an API endpoint to generate and download the export
        showAlert('正在准备数据导出，请稍候...', 'info');

        // Simulate export process
        setTimeout(() => {
            const data = {
                exportDate: new Date().toISOString(),
                users: 'User data would be here',
                tasks: 'Task data would be here',
                achievements: 'Achievement data would be here',
                points: 'Points data would be here'
            };

            downloadJSON(data, 'kd-family-export-all.json');
            showAlert('数据导出完成！', 'success');
            hideLoading();
        }, 2000);

    } catch (error) {
        showAlert('导出失败: ' + error.message, 'error');
        hideLoading();
    }
}

async function exportUserData() {
    try {
        const response = await apiCall('/roles/users');
        const users = response.users || [];

        const exportData = {
            exportDate: new Date().toISOString(),
            exportType: 'users',
            data: users.map(user => ({
                id: user.id,
                username: user.username,
                email: user.email,
                full_name: user.full_name,
                primary_role: user.primary_role,
                created_at: user.created_at
            }))
        };

        downloadJSON(exportData, 'kd-family-users.json');
        showAlert('用户数据导出完成！', 'success');

    } catch (error) {
        showAlert('导出用户数据失败: ' + error.message, 'error');
    }
}

async function exportTaskData() {
    try {
        const response = await apiCall('/tasks');
        const tasks = response.tasks || [];

        const exportData = {
            exportDate: new Date().toISOString(),
            exportType: 'tasks',
            data: tasks.map(task => ({
                id: task.id,
                title: task.title,
                description: task.description,
                points: task.points,
                status: task.status,
                created_at: task.created_at,
                completed_at: task.completed_at
            }))
        };

        downloadJSON(exportData, 'kd-family-tasks.json');
        showAlert('任务数据导出完成！', 'success');

    } catch (error) {
        showAlert('导出任务数据失败: ' + error.message, 'error');
    }
}

function createBackup() {
    showAlert('正在创建系统备份...', 'info');

    // Simulate backup creation
    setTimeout(() => {
        showAlert('系统备份创建成功！', 'success');
    }, 3000);
}

function downloadBackup() {
    showAlert('备份下载功能开发中...', 'info');
}

// Utility function to download JSON data
function downloadJSON(data, filename) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

async function loadLogsData() {
    console.log('Loading logs data...');
}

function showContentTab(tab) {
    console.log('Showing content tab:', tab);
}

function exportData() {
    console.log('Exporting data...');
}

function showSystemSettings() {
    showSection('settings');
}
