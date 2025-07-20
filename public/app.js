const API_BASE = window.location.origin + '/api';
let currentUser = null;
let authToken = localStorage.getItem('authToken');

// ============ 头像模块 - 重新设计 ============
let selectedAvatarUrl = null;
let currentAvatarFile = null;
let currentRotation = 0;
let avatarEventsInitialized = false;

// 头像样式配置
const avatarStyles = ['adventurer', 'avataaars', 'bottts', 'croodles', 'fun-emoji', 'lorelei', 'micah', 'miniavs', 'pixel-art', 'notionists'];

// 头像模块入口函数
function openAvatarModal() {
    console.log('🎭 Opening avatar modal...');
    const modal = document.getElementById('avatarModal');
    if (!modal) {
        console.error('Avatar modal not found!');
        return;
    }
    
    modal.style.display = 'block';
    resetModalState();
    loadRandomAvatars();
    console.log('✅ Avatar modal opened successfully');
}

function closeAvatarModal() {
    console.log('🔒 Closing avatar modal...');
    const modal = document.getElementById('avatarModal');
    if (modal) {
        modal.style.display = 'none';
        resetModalState();
        console.log('✅ Avatar modal closed successfully');
    }
}

function resetModalState() {
    console.log('🔄 Resetting modal state...');
    selectedAvatarUrl = null;
    currentAvatarFile = null;
    currentRotation = 0;
    
    // 隐藏操作按钮
    const actions = document.getElementById('avatarActions');
    if (actions) actions.style.display = 'none';
    
    // 隐藏预览区域
    const preview = document.getElementById('imagePreviewSection');
    if (preview) preview.classList.add('hidden');
    
    // 重置文件输入
    const fileInput = document.getElementById('modalAvatarInput');
    if (fileInput) fileInput.value = '';
    
    // 禁用上传按钮
    const uploadBtn = document.getElementById('uploadAvatarBtn');
    if (uploadBtn) uploadBtn.disabled = true;
    
    // 清除头像选择状态
    document.querySelectorAll('.avatar-option').forEach(img => {
        img.classList.remove('selected');
        img.style.borderColor = 'transparent';
        img.style.borderWidth = '2px';
    });
}

// 加载随机头像
function loadRandomAvatars() {
    console.log('🎲 Loading random avatars...');
    const gallery = document.getElementById('avatarGallery');
    const loading = document.getElementById('avatarLoading');
    
    if (!gallery || !loading) {
        console.error('Avatar gallery elements not found!');
        return;
    }
    
    // 重置状态
    selectedAvatarUrl = null;
    const actions = document.getElementById('avatarActions');
    if (actions) actions.style.display = 'none';
    
    // 显示加载状态
    loading.classList.remove('hidden');
    
    // 生成10个随机头像
    const selectedStyles = [...avatarStyles].sort(() => 0.5 - Math.random()).slice(0, 10);
    const avatarUrls = selectedStyles.map(style => {
        const seed = Math.random().toString(36).substring(2, 15);
        return `https://api.dicebear.com/9.x/${style}/svg?seed=${seed}`;
    });
    
    // 创建头像HTML
    gallery.innerHTML = avatarUrls.map((src, index) => `
        <img src="${src}" 
             data-src="${src}" 
             data-index="${index}"
             alt="Avatar ${index + 1}" 
             class="avatar-option"
             style="width: 80px; height: 80px; cursor: pointer; border: 2px solid transparent; border-radius: 50%; transition: all 0.2s; margin: 5px;">
    `).join('');
    
    loading.classList.add('hidden');
    
    // 重新绑定头像点击事件
    bindAvatarClickEvents();
    console.log(`✅ Loaded ${avatarUrls.length} random avatars`);
}

// 绑定头像点击事件
function bindAvatarClickEvents() {
    const avatars = document.querySelectorAll('.avatar-option');
    console.log(`🔗 Binding click events to ${avatars.length} avatars...`);
    
    avatars.forEach((img, index) => {
        // 移除旧的事件监听器（如果有的话）
        img.replaceWith(img.cloneNode(true));
        const newImg = document.querySelectorAll('.avatar-option')[index];
        
        // 添加点击事件
        newImg.addEventListener('click', (e) => {
            console.log(`🖱️ Avatar ${index + 1} clicked`);
            selectOnlineAvatar(e);
        });
        
        // 添加鼠标悬停效果
        newImg.addEventListener('mouseenter', () => {
            if (!newImg.classList.contains('selected')) {
                newImg.style.borderColor = '#007bff';
            }
        });
        
        newImg.addEventListener('mouseleave', () => {
            if (!newImg.classList.contains('selected')) {
                newImg.style.borderColor = 'transparent';
            }
        });
    });
}

// 选择在线头像
function selectOnlineAvatar(event) {
    const imgElement = event.target;
    const avatarUrl = imgElement.dataset.src;
    console.log(`✨ Avatar selected: ${avatarUrl}`);
    
    // 清除其他选择
    document.querySelectorAll('.avatar-option').forEach(img => {
        img.classList.remove('selected');
        img.style.borderColor = 'transparent';
        img.style.borderWidth = '2px';
    });
    
    // 设置当前选择
    imgElement.classList.add('selected');
    imgElement.style.borderColor = '#28a745';
    imgElement.style.borderWidth = '3px';
    
    selectedAvatarUrl = avatarUrl;
    
    // 显示操作按钮
    const actions = document.getElementById('avatarActions');
    if (actions) {
        actions.style.display = 'block';
        console.log('✅ Avatar actions shown');
    }
}

// 确认头像选择
async function confirmAvatarSelection() {
    console.log('💾 Confirming avatar selection...');
    
    if (!selectedAvatarUrl) {
        showMessage('请先选择一个头像', 'error');
        console.warn('⚠️ No avatar selected');
        return;
    }
    
    try {
        showMessage('正在更新头像...', 'info');
        console.log(`📤 Uploading avatar: ${selectedAvatarUrl}`);
        
        const response = await apiCall('/users/avatar', {
            method: 'POST',
            body: JSON.stringify({ avatarUrl: selectedAvatarUrl }),
        });
        
        showMessage('头像更新成功！', 'success');
        
        // 更新页面上的头像
        const userAvatar = document.getElementById('userAvatar');
        if (userAvatar) userAvatar.src = selectedAvatarUrl;
        
        if (currentUser) currentUser.avatar_url = selectedAvatarUrl;
        
        closeAvatarModal();
        console.log('✅ Avatar updated successfully');
    } catch (error) {
        console.error('❌ Avatar update error:', error);
        showMessage(error.error || '更新失败', 'error');
    }
}

// 取消头像选择
function cancelAvatarSelection() {
    console.log('❌ Canceling avatar selection...');
    selectedAvatarUrl = null;
    
    const actions = document.getElementById('avatarActions');
    if (actions) actions.style.display = 'none';
    
    document.querySelectorAll('.avatar-option').forEach(img => {
        img.classList.remove('selected');
        img.style.borderColor = 'transparent';
        img.style.borderWidth = '2px';
    });
    
    console.log('✅ Avatar selection canceled');
}

// 文件选择处理
function handleFileSelect(event) {
    console.log('📁 File selection triggered...');
    const file = event.target.files[0];
    
    if (!file) {
        console.log('❌ No file selected');
        const uploadBtn = document.getElementById('uploadAvatarBtn');
        if (uploadBtn) uploadBtn.disabled = true;
        return;
    }
    
    if (!file.type.startsWith('image/')) {
        console.error('❌ Invalid file type:', file.type);
        showMessage('请选择图片文件', 'error');
        event.target.value = '';
        const uploadBtn = document.getElementById('uploadAvatarBtn');
        if (uploadBtn) uploadBtn.disabled = true;
        return;
    }
    
    console.log('✅ Valid image file selected:', file.name);
    currentAvatarFile = file;
    
    const uploadBtn = document.getElementById('uploadAvatarBtn');
    if (uploadBtn) uploadBtn.disabled = false;
    
    // 立即显示预览
    showImagePreview(file);
}

// 显示图片预览
function showImagePreview(file) {
    console.log('🖼️ Showing image preview...');
    const reader = new FileReader();
    
    reader.onload = function(e) {
        const preview = document.getElementById('imagePreview');
        const section = document.getElementById('imagePreviewSection');
        const slider = document.getElementById('imageSizeSlider');
        const sizeValue = document.getElementById('sizeValue');
        
        if (preview && section) {
            preview.src = e.target.result;
            preview.style.transform = `rotate(${currentRotation}deg)`;
            section.classList.remove('hidden');
            
            if (slider) slider.value = 100;
            if (sizeValue) sizeValue.textContent = '100%';
            
            preview.style.width = '150px';
            preview.style.height = '150px';
            
            console.log('✅ Image preview displayed');
        }
    };
    
    reader.readAsDataURL(file);
}

// 处理尺寸变化
function handleSizeChange(event) {
    const value = event.target.value;
    const sizeValue = document.getElementById('sizeValue');
    const preview = document.getElementById('imagePreview');
    
    if (sizeValue) sizeValue.textContent = value + '%';
    if (preview) {
        const size = Math.round(150 * value / 100);
        preview.style.width = size + 'px';
        preview.style.height = size + 'px';
    }
}

// 旋转图片
function rotateImage() {
    console.log('🔄 Rotating image...');
    currentRotation = (currentRotation + 90) % 360;
    const preview = document.getElementById('imagePreview');
    if (preview) {
        preview.style.transform = `rotate(${currentRotation}deg)`;
        console.log(`✅ Image rotated to ${currentRotation} degrees`);
    }
}

// 确认上传
async function confirmUpload() {
    console.log('📤 Confirming upload...');
    
    if (!currentAvatarFile) {
        showMessage('请先选择文件', 'error');
        console.warn('⚠️ No file to upload');
        return;
    }
    
    const formData = new FormData();
    formData.append('avatar', currentAvatarFile);
    
    try {
        showMessage('正在上传头像...', 'info');
        console.log('📤 Uploading file:', currentAvatarFile.name);
        
        const response = await apiCall('/users/avatar', {
            method: 'POST',
            body: formData,
        });
        
        showMessage('头像上传成功！', 'success');
        
        // 更新页面上的头像
        const userAvatar = document.getElementById('userAvatar');
        if (userAvatar) userAvatar.src = response.avatarUrl;
        
        if (currentUser) currentUser.avatar_url = response.avatarUrl;
        
        closeAvatarModal();
        console.log('✅ File uploaded successfully');
    } catch (error) {
        console.error('❌ Upload error:', error);
        showMessage(error.error || '上传失败', 'error');
    }
}

// 取消上传
function cancelUpload() {
    console.log('❌ Canceling upload...');
    const section = document.getElementById('imagePreviewSection');
    const fileInput = document.getElementById('modalAvatarInput');
    const uploadBtn = document.getElementById('uploadAvatarBtn');
    
    if (section) section.classList.add('hidden');
    if (fileInput) fileInput.value = '';
    if (uploadBtn) uploadBtn.disabled = true;
    
    currentAvatarFile = null;
    currentRotation = 0;
    
    console.log('✅ Upload canceled');
}

// 主要事件绑定函数
function setupAvatarModalEvents() {
    console.log('🔧 Setting up avatar modal events...');
    
    // 1. 模态窗口基本控制
    setupModalControls();
    
    // 2. 在线头像相关按钮
    setupOnlineAvatarButtons();
    
    // 3. 文件上传相关控件
    setupFileUploadControls();
    
    console.log('✅ All avatar modal events set up successfully');
}

function setupModalControls() {
    const modal = document.getElementById('avatarModal');
    if (!modal) {
        console.error('❌ Avatar modal not found!');
        return;
    }
    
    // 点击外部关闭
    modal.addEventListener('click', (event) => {
        if (event.target === modal) {
            console.log('🖱️ Modal backdrop clicked');
            closeAvatarModal();
        }
    });
    
    // ESC键关闭
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && modal.style.display === 'block') {
            console.log('⌨️ ESC key pressed');
            closeAvatarModal();
        }
    });
    
    // 关闭按钮
    const closeBtn = modal.querySelector('.close');
    if (closeBtn) {
        closeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('🖱️ Close button clicked');
            closeAvatarModal();
        });
        console.log('✅ Close button event bound');
    } else {
        console.warn('⚠️ Close button not found');
    }
}

function setupOnlineAvatarButtons() {
    // 换一批按钮
    const refreshBtn = document.getElementById('refreshAvatarsBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('🔄 Refresh button clicked');
            loadRandomAvatars();
        });
        console.log('✅ Refresh button event bound');
    } else {
        console.warn('⚠️ Refresh button not found');
    }
    
    // 确认选择按钮
    const confirmBtn = document.getElementById('confirmAvatarBtn');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('✅ Confirm button clicked');
            confirmAvatarSelection();
        });
        console.log('✅ Confirm button event bound');
    } else {
        console.warn('⚠️ Confirm button not found');
    }
    
    // 取消选择按钮
    const cancelBtn = document.getElementById('cancelAvatarBtn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('❌ Cancel button clicked');
            cancelAvatarSelection();
        });
        console.log('✅ Cancel button event bound');
    } else {
        console.warn('⚠️ Cancel button not found');
    }
}

function setupFileUploadControls() {
    // 文件选择输入
    const fileInput = document.getElementById('modalAvatarInput');
    if (fileInput) {
        fileInput.addEventListener('change', handleFileSelect);
        console.log('✅ File input event bound');
    } else {
        console.warn('⚠️ File input not found');
    }
    
    // 上传按钮 - 只显示预览，不直接上传
    const uploadBtn = document.getElementById('uploadAvatarBtn');
    if (uploadBtn) {
        uploadBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('📁 Upload button clicked');
            if (currentAvatarFile) {
                const section = document.getElementById('imagePreviewSection');
                if (section) section.classList.remove('hidden');
            } else {
                showMessage('请先选择文件', 'error');
            }
        });
        console.log('✅ Upload button event bound');
    } else {
        console.warn('⚠️ Upload button not found');
    }
    
    // 尺寸滑块
    const sizeSlider = document.getElementById('imageSizeSlider');
    if (sizeSlider) {
        sizeSlider.addEventListener('input', handleSizeChange);
        console.log('✅ Size slider event bound');
    } else {
        console.warn('⚠️ Size slider not found');
    }
    
    // 确认上传按钮
    const confirmUploadBtn = document.getElementById('confirmUploadBtn');
    if (confirmUploadBtn) {
        confirmUploadBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('💾 Confirm upload button clicked');
            confirmUpload();
        });
        console.log('✅ Confirm upload button event bound');
    } else {
        console.warn('⚠️ Confirm upload button not found');
    }
    
    // 取消上传按钮
    const cancelUploadBtn = document.getElementById('cancelUploadBtn');
    if (cancelUploadBtn) {
        cancelUploadBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('❌ Cancel upload button clicked');
            cancelUpload();
        });
        console.log('✅ Cancel upload button event bound');
    } else {
        console.warn('⚠️ Cancel upload button not found');
    }
    
    // 旋转图片按钮
    const rotateBtn = document.getElementById('rotateImageBtn');
    if (rotateBtn) {
        rotateBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('🔄 Rotate button clicked');
            rotateImage();
        });
        console.log('✅ Rotate button event bound');
    } else {
        console.warn('⚠️ Rotate button not found');
    }
}


// 工具函数
function showMessage(message, type = 'success') {
    const messagesDiv = document.getElementById('messages');
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    messagesDiv.appendChild(alertDiv);
    setTimeout(() => alertDiv.remove(), 5000);
    console.log(`Message: ${message} (${type})`);
}

function apiCall(endpoint, options = {}) {
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
    
    console.log(`API Call: ${url}`, options);
    
    return fetch(url, { ...defaultOptions, ...options })
        .then(response => {
            console.log(`API Response: ${response.status}`, response);
            if (!response.ok) {
                return response.json().then(err => {
                    console.error('API Error:', err);
                    return Promise.reject(err);
                }).catch(() => {
                    console.error('API Error (no JSON):', response.statusText);
                    return Promise.reject({ error: response.statusText });
                });
            }
            return response.json();
        })
        .catch(error => {
            console.error('Network Error:', error);
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                showMessage('网络连接失败，请检查服务器是否运行', 'error');
                return Promise.reject({ error: '网络连接失败' });
            }
            return Promise.reject(error);
        });
}

// 导航功能
function showSection(sectionName) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav button').forEach(b => b.classList.remove('active'));
    
    document.getElementById(sectionName).classList.add('active');
    document.getElementById(`nav${sectionName.charAt(0).toUpperCase() + sectionName.slice(1)}`).classList.add('active');
}

// 认证功能
async function login(event) {
    event.preventDefault();
    console.log('Login attempt started');
    
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    
    console.log('Login data:', { username, password: '***' });
    
    if (!username || !password) {
        showMessage('请输入用户名和密码', 'error');
        return;
    }
    
    try {
        showMessage('正在登录...');
        const response = await apiCall('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
        
        console.log('Login response:', response);
        
        authToken = response.token;
        currentUser = response.user;
        localStorage.setItem('authToken', authToken);
        
        showMessage('登录成功！');
        updateUIAfterLogin();
        loadDashboard();
        showSection('dashboard');
    } catch (error) {
        console.error('Login error:', error);
        showMessage(error.error || error.message || '登录失败', 'error');
    }
}

async function register(event) {
    event.preventDefault();
    const userData = {
        username: document.getElementById('regUsername').value,
        email: document.getElementById('regEmail').value,
        password: document.getElementById('regPassword').value,
        fullName: document.getElementById('regFullName').value,
        role: document.getElementById('regRole').value
    };
    
    try {
        const response = await apiCall('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
        
        authToken = response.token;
        currentUser = response.user;
        localStorage.setItem('authToken', authToken);
        
        showMessage('注册成功！');
        updateUIAfterLogin();
        loadDashboard();
        showSection('dashboard');
    } catch (error) {
        showMessage(error.error || '注册失败', 'error');
    }
}

function logout() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('authToken');
    updateUIAfterLogout();
    showSection('auth');
    showMessage('已退出登录');
}

function updateUIAfterLogin() {
    document.getElementById('userInfo').classList.remove('hidden');
    document.getElementById('userName').textContent = currentUser.fullName;
    document.getElementById('userRole').textContent = getRoleText(currentUser.role);
    document.getElementById('userAvatar').src = currentUser.avatar_url || 'https://via.placeholder.com/50';
    
    document.getElementById('navAuth').classList.add('hidden');
    document.getElementById('navDashboard').classList.remove('hidden');
    document.getElementById('navTasks').classList.remove('hidden');
    document.getElementById('navPoints').classList.remove('hidden');
    
    if (currentUser.role === 'advisor' || currentUser.role === 'parent') {
        document.getElementById('navAdmin').classList.remove('hidden');
        document.getElementById('createTaskBtn').style.display = 'inline-block';
    }

    const changeAvatarBtn = document.getElementById('changeAvatarBtn');
    if (changeAvatarBtn) {
        changeAvatarBtn.addEventListener('click', openAvatarModal);
    }
    
    // 绑定头像模块事件（在登录后保证DOM完全加载）
    if (!avatarEventsInitialized) {
        setupAvatarModalEvents();
        avatarEventsInitialized = true;
    }
}

function updateUIAfterLogout() {
    document.getElementById('userInfo').classList.add('hidden');
    document.getElementById('navAuth').classList.remove('hidden');
    document.getElementById('navDashboard').classList.add('hidden');
    document.getElementById('navTasks').classList.add('hidden');
    document.getElementById('navPoints').classList.add('hidden');
    document.getElementById('navAdmin').classList.add('hidden');
}

function getRoleText(role) {
    const roles = { advisor: '顾问', parent: '家长', member: '家庭成员' };
    return roles[role] || role;
}

function getStatusText(status) {
    const statuses = {
        pending: '待认领',
        claimed: '已认领',
        in_progress: '进行中',
        completed: '已完成',
        approved: '已批准'
    };
    return statuses[status] || status;
}

// 仪表板功能
async function loadDashboard() {
    try {
        const [profile, stats, myTasks] = await Promise.all([
            apiCall('/users/profile'),
            apiCall('/points/stats'),
            apiCall('/tasks/my')
        ]);
        
        document.getElementById('userPoints').textContent = profile.user.totalPoints;
        document.getElementById('dashTotalPoints').textContent = stats.stats.total_points;
        document.getElementById('dashWeekPoints').textContent = stats.stats.week_points;
        document.getElementById('dashCompletedTasks').textContent = stats.stats.total_tasks;
        
        const myTasksDiv = document.getElementById('myTasks');
        myTasksDiv.innerHTML = myTasks.tasks.slice(0, 5).map(task => `
            <div class="task-item">
                <strong>${task.title}</strong>
                <span class="task-status status-${task.status}">${getStatusText(task.status)}</span>
                <br><small>${task.task_type_name} | ${task.points}分</small>
            </div>
        `).join('') || '<p>暂无任务</p>';
        
    } catch (error) {
        showMessage('加载仪表板失败', 'error');
    }
}

// 任务管理功能
async function loadTasks() {
    try {
        const [tasksResponse, usersResponse] = await Promise.all([
            apiCall('/tasks'),
            apiCall('/users/all') 
        ]);

        const tasksDiv = document.getElementById('tasksList');
        const users = usersResponse.users;

        tasksDiv.innerHTML = tasksResponse.tasks.map(task => {
            const assignOptions = users.map(user => `<option value="${user.id}" ${task.assigned_to === user.id ? 'selected' : ''}>${user.full_name}</option>`).join('');

            return `
            <div class="task-item">
                <h4>${task.title}</h4>
                <p>${task.description || '无描述'}</p>
                <p>
                    <span class="task-status status-${task.status}">${getStatusText(task.status)}</span>
                    <strong>${task.points}分</strong> | ${task.task_type_name}
                </p>
                <p>
                    分配给: ${task.assigned_full_name || '未分配'} | 
                    创建者: ${task.created_by_full_name}
                    ${task.due_date ? ` | 截止: ${new Date(task.due_date).toLocaleDateString()}` : ''}
                </p>
                <div>
                    ${task.status === 'pending' && !task.assigned_to ? 
                        `<button data-action="claim" data-task-id="${task.id}" class="btn task-action-btn">认领任务</button>` : ''}
                    ${task.assigned_to === currentUser.id && task.status === 'claimed' ? 
                        `<button data-action="start" data-task-id="${task.id}" class="btn task-action-btn">开始任务</button>` : ''}
                    ${task.assigned_to === currentUser.id && task.status === 'in_progress' ? 
                        `<button data-action="complete" data-task-id="${task.id}" class="btn task-action-btn">完成任务</button>` : ''}
                    ${task.status === 'completed' && (currentUser.role === 'advisor' || currentUser.role === 'parent') ? 
                        `<button data-action="approve" data-task-id="${task.id}" class="btn task-action-btn">批准任务</button>` : ''}
                    ${(currentUser.role === 'advisor' || currentUser.role === 'parent') ? 
                        `<select class="assign-user-select" data-task-id="${task.id}"><option value="">指派给...</option>${assignOptions}</select>` : ''}
                </div>
            </div>
        `}).join('') || '<p>暂无任务</p>';
        
        // 添加事件委托处理动态按钮
        document.addEventListener('click', handleTaskAction);
        document.addEventListener('change', handleAssignTask);
    } catch (error) {
        showMessage('加载任务失败', 'error');
    }
}

// 处理任务操作按钮点击
function handleTaskAction(event) {
    if (event.target.classList.contains('task-action-btn')) {
        const action = event.target.getAttribute('data-action');
        const taskId = event.target.getAttribute('data-task-id');
        
        console.log(`Task action: ${action} for task ${taskId}`);
        
        switch(action) {
            case 'claim':
                claimTask(taskId);
                break;
            case 'start':
                updateTaskStatus(taskId, 'in_progress');
                break;
            case 'complete':
                updateTaskStatus(taskId, 'completed');
                break;
            case 'approve':
                updateTaskStatus(taskId, 'approved');
                break;
        }
    }
}

async function handleAssignTask(event) {
    if (event.target.classList.contains('assign-user-select')) {
        const taskId = event.target.getAttribute('data-task-id');
        const userId = event.target.value;

        if (!userId) return;

        try {
            await apiCall(`/tasks/${taskId}/assign`, {
                method: 'PUT',
                body: JSON.stringify({ userId: parseInt(userId) })
            });
            showMessage('任务指派成功！');
            loadTasks();
        } catch (error) {
            showMessage(error.error || '指派失败', 'error');
        }
    }
}

async function claimTask(taskId) {
    try {
        await apiCall(`/tasks/${taskId}/claim`, { method: 'PUT' });
        showMessage('任务认领成功！');
        loadTasks();
    } catch (error) {
        showMessage(error.error || '认领失败', 'error');
    }
}

async function updateTaskStatus(taskId, status) {
    try {
        await apiCall(`/tasks/${taskId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status })
        });
        showMessage('任务状态更新成功！');
        loadTasks();
        if (status === 'approved') {
            loadDashboard(); // 更新积分显示
        }
    } catch (error) {
        showMessage(error.error || '状态更新失败', 'error');
    }
}

function showCreateTaskForm() {
    document.getElementById('createTaskForm').style.display = 'block';
}

function hideCreateTaskForm() {
    document.getElementById('createTaskForm').style.display = 'none';
    document.getElementById('createTaskForm').querySelector('form').reset();
}

async function createTask(event) {
    event.preventDefault();
    const taskData = {
        title: document.getElementById('taskTitle').value,
        description: document.getElementById('taskDescription').value,
        taskType: document.getElementById('taskType').value,
        points: parseInt(document.getElementById('taskPoints').value) || undefined,
        dueDate: document.getElementById('taskDueDate').value || undefined
    };
    
    try {
        await apiCall('/tasks', {
            method: 'POST',
            body: JSON.stringify(taskData)
        });
        showMessage('任务创建成功！');
        hideCreateTaskForm();
        loadTasks();
    } catch (error) {
        showMessage(error.error || '创建失败', 'error');
    }
}

// 积分功能
async function loadPoints() {
    try {
        const [leaderboard, history] = await Promise.all([
            apiCall('/points/leaderboard'),
            apiCall('/points/history?limit=10')
        ]);
        
        const leaderboardDiv = document.getElementById('leaderboard');
        leaderboardDiv.innerHTML = leaderboard.leaderboard.map((user, index) => `
            <div class="leaderboard-item rank-${index + 1}">
                <h4>#${index + 1} ${user.full_name}</h4>
                <p>积分: ${user.total_points}</p>
                <p>完成任务: ${user.completed_tasks}</p>
            </div>
        `).join('') || '<p>暂无数据</p>';
        
        const historyDiv = document.getElementById('pointsHistory');
        historyDiv.innerHTML = history.history.map(record => `
            <div class="task-item">
                <strong>${record.points_change > 0 ? '+' : ''}${record.points_change}分</strong>
                <p>${record.reason}</p>
                <small>${new Date(record.created_at).toLocaleString()}</small>
            </div>
        `).join('') || '<p>暂无记录</p>';
    } catch (error) {
        showMessage('加载积分数据失败', 'error');
    }
}

// 管理功能
async function loadAdmin() {
    try {
        const [dashboard, users] = await Promise.all([
            apiCall('/admin/dashboard'),
            apiCall('/users/all')
        ]);
        
        const statsDiv = document.getElementById('adminStats');
        statsDiv.innerHTML = `
            <p>总用户数: ${dashboard.stats.totalUsers}</p>
            <p>总任务数: ${dashboard.stats.totalTasks}</p>
            <p>待批准任务: ${dashboard.stats.pendingApprovals}</p>
            <p>活跃用户: ${dashboard.stats.activeUsers}</p>
        `;
        
        const usersDiv = document.getElementById('usersList');
        usersDiv.innerHTML = users.users.map(user => `
            <div class="user-item">
                <h4>${user.full_name} (@${user.username})</h4>
                <p>角色: ${getRoleText(user.role)} | 邮箱: ${user.email || '未设置'}</p>
                <p>注册时间: ${new Date(user.created_at).toLocaleDateString()}</p>
                <button class="btn btn-danger delete-user-btn" 
                        data-user-id="${user.id}" 
                        data-username="${user.username}"
                        style="margin-top: 10px;">删除用户</button>
            </div>
        `).join('');
        
        // 添加删除按钮事件监听器
        document.querySelectorAll('.delete-user-btn').forEach(button => {
            button.addEventListener('click', function() {
                const userId = this.getAttribute('data-user-id');
                const username = this.getAttribute('data-username');
                deleteUser(userId, username);
            });
        });
    } catch (error) {
        showMessage('加载管理数据失败', 'error');
    }
}

async function addUser(event) {
    event.preventDefault();
    
    const username = document.getElementById('addUsername').value.trim();
    const email = document.getElementById('addEmail').value.trim();
    const password = document.getElementById('addPassword').value;
    const fullName = document.getElementById('addFullName').value.trim();
    const role = document.getElementById('addRole').value;
    
    // 前端验证
    if (!username || !password || !fullName || !role) {
        showMessage('请填写所有必填字段', 'error');
        return;
    }
    
    if (password.length < 6) {
        showMessage('密码长度至少6个字符', 'error');
        return;
    }
    
    const userData = {
        username,
        email,
        password,
        fullName,
        role
    };

    try {
        await apiCall('/admin/users', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
        showMessage('用户添加成功！', 'success');
        document.getElementById('addUserForm').reset();
        loadAdmin(); // Refresh the user list
    } catch (error) {
        showMessage(error.error || '添加用户失败', 'error');
    }
}

async function deleteUser(userId, username) {
    if (!confirm(`确定要删除用户 "${username}" 吗？这个操作不可撤销。`)) {
        return;
    }

    try {
        await apiCall(`/admin/users/${userId}`, {
            method: 'DELETE'
        });
        showMessage('用户删除成功！', 'success');
        loadAdmin(); // 刷新用户列表
    } catch (error) {
        showMessage(error.error || '删除用户失败', 'error');
    }
}

// 页面加载时检查登录状态和绑定事件
window.addEventListener('load', async () => {
    console.log('页面加载，开始绑定事件...');
    
    // 绑定表单事件
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', login);
        console.log('登录表单事件已绑定');
    }
    
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', register);
        console.log('注册表单事件已绑定');
    }
    
    // 绑定导航按钮事件
    document.getElementById('navAuth').addEventListener('click', () => showSection('auth'));
    document.getElementById('navDashboard').addEventListener('click', () => {
        showSection('dashboard');
        loadDashboard();
    });
    document.getElementById('navTasks').addEventListener('click', () => {
        showSection('tasks');
        loadTasks();
    });
    document.getElementById('navPoints').addEventListener('click', () => {
        showSection('points');
        loadPoints();
    });
    document.getElementById('navAdmin').addEventListener('click', () => {
        showSection('admin');
        loadAdmin();
    });
    
    // 绑定退出登录按钮
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
    
    // 绑定任务管理按钮
    const refreshTasksBtn = document.getElementById('refreshTasksBtn');
    if (refreshTasksBtn) {
        refreshTasksBtn.addEventListener('click', loadTasks);
    }
    
    const createTaskBtn = document.getElementById('createTaskBtn');
    if (createTaskBtn) {
        createTaskBtn.addEventListener('click', showCreateTaskForm);
    }
    
    const cancelTaskBtn = document.getElementById('cancelTaskBtn');
    if (cancelTaskBtn) {
        cancelTaskBtn.addEventListener('click', hideCreateTaskForm);
    }
    
    const createTaskFormElement = document.getElementById('createTaskFormElement');
    if (createTaskFormElement) {
        createTaskFormElement.addEventListener('submit', createTask);
    }

    const addUserForm = document.getElementById('addUserForm');
    if (addUserForm) {
        addUserForm.addEventListener('submit', addUser);
    }

    // 移除不存在的 avatarUploadForm 引用，头像上传通过按钮事件处理
    
    console.log('所有事件已绑定');
    
    // 检查登录状态
    if (authToken) {
        try {
            const response = await apiCall('/auth/me');
            currentUser = response.user;
            updateUIAfterLogin();
            loadDashboard();
            showSection('dashboard');
        } catch (error) {
            logout();
        }
    }
});

