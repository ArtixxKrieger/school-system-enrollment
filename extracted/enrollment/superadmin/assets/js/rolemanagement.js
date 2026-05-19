document.addEventListener('DOMContentLoaded', function() {
    console.log('✓ Role Management JS Loaded');

    // =====================================================
    // MOCK DATA
    // =====================================================
    const mockData = {
        roles: [], // Will be initialized after roleTemplates
        modules: [
            { id: 1, name: 'Dashboard', slug: 'dashboard' },
            { id: 2, name: 'Students', slug: 'student' },
            { id: 3, name: 'Courses', slug: 'course' },
            { id: 4, name: 'Enrollment', slug: 'enrollment' },
            { id: 5, name: 'Enrollees', slug: 'enrollees' },
            { id: 6, name: 'Curriculum', slug: 'curriculum' },
            { id: 7, name: 'Offer & Offered', slug: 'subjects' },
            { id: 8, name: 'Schedule', slug: 'schedule' },
            { id: 9, name: 'Professors', slug: 'professor' },
            { id: 10, name: 'Administrators', slug: 'administrator' },
            { id: 11, name: 'Role Management', slug: 'rolemanagement' },
            { id: 12, name: 'Settings', slug: 'settings' },
            { id: 13, name: 'Reports', slug: 'reports' }
        ],
        // No pre-existing demo records (no database in this project).
        users: [],
        auditLog: []
    };

    // =====================================================
    // ROLE TEMPLATES - Predefined Permission Sets
    // =====================================================
    const roleTemplates = {
        super_admin: {
            name: 'Super Admin',
            description: 'Full system access with all permissions',
            priority: 100,
            permissions: {
                // All modules with all actions
                dashboard: { view: true, create: true, edit: true, delete: true, approve: true },
                student: { view: true, create: true, edit: true, delete: true, approve: true },
                course: { view: true, create: true, edit: true, delete: true, approve: true },
                enrollment: { view: true, create: true, edit: true, delete: true, approve: true },
                enrollees: { view: true, create: true, edit: true, delete: true, approve: true },
                curriculum: { view: true, create: true, edit: true, delete: true, approve: true },
                subjects: { view: true, create: true, edit: true, delete: true, approve: true },
                schedule: { view: true, create: true, edit: true, delete: true, approve: true },
                professor: { view: true, create: true, edit: true, delete: true, approve: true },
                administrator: { view: true, create: true, edit: true, delete: true, approve: true },
                rolemanagement: { view: true, create: true, edit: true, delete: true, approve: true },
                settings: { view: true, create: true, edit: true, delete: true, approve: true },
                reports: { view: true, create: true, edit: true, delete: true, approve: true }
            }
        },
        admin: {
            name: 'Admin',
            description: 'Administrative access - can edit, add, view, delete. Can access roles but NOT role management',
            priority: 80,
            permissions: {
                dashboard: { view: true, create: true, edit: true, delete: true, approve: true },
                student: { view: true, create: true, edit: true, delete: true, approve: true },
                course: { view: true, create: true, edit: true, delete: true, approve: true },
                enrollment: { view: true, create: true, edit: true, delete: true, approve: true },
                enrollees: { view: true, create: true, edit: true, delete: true, approve: true },
                curriculum: { view: true, create: true, edit: true, delete: true, approve: true },
                subjects: { view: true, create: true, edit: true, delete: true, approve: true },
                schedule: { view: true, create: true, edit: true, delete: true, approve: true },
                professor: { view: true, create: true, edit: true, delete: true, approve: true },
                administrator: { view: true, create: true, edit: true, delete: true, approve: true },
                settings: { view: true, create: true, edit: true, delete: true, approve: true },
                reports: { view: true, create: true, edit: true, delete: true, approve: true }
            }
        },
        staff: {
            name: 'Staff',
            description: 'Staff access - can edit and view. Only schedule, enrollment, menu. NOT role management',
            priority: 60,
            permissions: {
                dashboard: { view: true, create: false, edit: false, delete: false, approve: false },
                schedule: { view: true, create: false, edit: true, delete: false, approve: false },
                enrollment: { view: true, create: false, edit: true, delete: false, approve: false },
                enrollees: { view: true, create: false, edit: true, delete: false, approve: false }
            }
        },
        professor: {
            name: 'Professor',
            description: 'Professor access - can add their own schedule, dashboard, students (view only, no edit/delete)',
            priority: 40,
            permissions: {
                dashboard: { view: true, create: true, edit: true, delete: false, approve: false },
                schedule: { view: true, create: true, edit: true, delete: false, approve: false },
                student: { view: true, create: false, edit: false, delete: false, approve: false },
                curriculum: { view: true, create: false, edit: false, delete: false, approve: false },
                subjects: { view: true, create: false, edit: false, delete: false, approve: false }
            }
        },
        student: {
            name: 'Student',
            description: 'Student access - view only: dashboard, curriculum',
            priority: 20,
            permissions: {
                dashboard: { view: true, create: false, edit: false, delete: false, approve: false },
                curriculum: { view: true, create: false, edit: false, delete: false, approve: false },
                subjects: { view: true, create: false, edit: false, delete: false, approve: false }
            }
        }
    };

    const API_BASE = ((window.ApiBaseUrl || 'api').replace(/\/$/, '')) + '/';

    async function apiFetch(path, method = 'GET', data = null) {
        const options = { method, headers: { 'Content-Type': 'application/json' } };
        if (data !== null) {
            options.body = JSON.stringify(data);
        }

        const res = await fetch(API_BASE + path, options);
        const payload = await res.json().catch(() => ({}));
        if (!res.ok || !payload.ok) {
            throw new Error(payload.error || 'API request failed');
        }
        return payload;
    }

    async function refreshRoles() {
        try {
            const data = await apiFetch('roles_list.php', 'GET');
            state.roles = Array.isArray(data.roles) ? data.roles : [];
            state.roles.forEach(role => {
                if (!role.permissions || typeof role.permissions !== 'object') {
                    role.permissions = {};
                }
            });
            loadRoles();
            loadPermissions();

            const userRoleFilter = document.getElementById('userRoleFilter');
            if (userRoleFilter) {
                const selectedRole = userRoleFilter.value || 'all';
                userRoleFilter.innerHTML = '<option value="all">All Roles</option>';
                state.roles.filter(r => r.is_active).forEach(role => {
                    userRoleFilter.innerHTML += `<option value="${role.id}">${escapeHtml(role.name)}</option>`;
                });
                userRoleFilter.value = selectedRole;
            }
        } catch (error) {
            console.error('Failed to load roles:', error);
            showNotification('Failed to load roles from database', 'error');
        }
    }

    async function refreshUsers() {
        try {
            const data = await apiFetch('users_roles.php', 'GET');
            mockData.users = Array.isArray(data.users) ? data.users : [];
            loadUsers();
        } catch (error) {
            console.error('Failed to load users:', error);
            showNotification('Failed to load users from database', 'error');
        }
    }

    async function saveRoleToDb(roleId, roleData) {
        try {
            const payload = {
                id: roleId || null,
                name: roleData.name,
                description: roleData.description,
                is_active: roleData.is_active ? 1 : 0,
                permissions: roleData.permissions || {}
            };

            const data = await apiFetch('roles_save.php', 'POST', payload);
            if (data.role) {
                const existingIndex = state.roles.findIndex(r => r.id == data.role.id);
                if (existingIndex >= 0) {
                    state.roles[existingIndex] = data.role;
                } else {
                    state.roles.push(data.role);
                }
            }
            return data.role;
        } catch (error) {
            console.error('Failed to save role:', error);
            showNotification(error.message, 'error');
            throw error;
        }
    }

    async function addRole(roleData) {
        return saveRoleToDb(null, roleData);
    }
    window.addRole = addRole;

    async function deleteRoleFromDb(roleId) {
        try {
            await apiFetch('roles_delete.php', 'POST', { id: roleId });
            state.roles = state.roles.filter(r => r.id !== roleId);
            loadRoles();
            refreshUsers();
            showNotification('Role deleted successfully', 'success');
        } catch (error) {
            console.error('Failed to delete role:', error);
            showNotification(error.message, 'error');
        }
    }

    async function assignUserRoleToDb(userId, roleId) {
        try {
            const data = await apiFetch('user_assign_role.php', 'POST', { user_id: userId, role_id: roleId });
            const userIndex = mockData.users.findIndex(u => u.id == data.user.id);
            if (userIndex >= 0) {
                mockData.users[userIndex] = data.user;
            } else {
                mockData.users.push(data.user);
            }
            loadUsers();
            return data.user;
        } catch (error) {
            console.error('Failed to assign role to user:', error);
            showNotification(error.message, 'error');
            throw error;
        }
    }

    async function saveRolePermissionsToDb(roleId, permissions) {
        try {
            const payload = { id: roleId, permissions };
            const data = await apiFetch('roles_save.php', 'POST', payload);
            if (data.role) {
                const existingIndex = state.roles.findIndex(r => r.id == data.role.id);
                if (existingIndex >= 0) {
                    state.roles[existingIndex] = data.role;
                }
            }
            loadRoles();
            return data.role;
        } catch (error) {
            console.error('Failed to save role permissions:', error);
            showNotification(error.message, 'error');
            throw error;
        }
    }

    // Initialize default roles with template permissions
    function initializeDefaultRoles() {
        // Start empty (no example roles). Templates remain available via the modal dropdown.
        return [];
    }

    function calculatePermissionCount(permissions) {
        let count = 0;
        Object.values(permissions).forEach(modulePerms => {
            Object.values(modulePerms).forEach(enabled => {
                if (enabled) count++;
            });
        });
        return count;
    }

    // Initialize roles with template permissions
    const defaultRoles = initializeDefaultRoles();

    let state = {
        roles: defaultRoles,
        currentRole: null,
        currentTab: 'roles',
        selectedPermissions: {} // Store selected permissions per module
    };

    // =====================================================
    // UTILITY FUNCTIONS
    // =====================================================

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `rm-notification rm-notification-${type}`;
        notification.textContent = message;
        
        if (!document.getElementById('rm-notification-styles')) {
            const style = document.createElement('style');
            style.id = 'rm-notification-styles';
            style.textContent = `
                .rm-notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    padding: 16px 24px;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                    z-index: 3000;
                    animation: slideIn 0.3s ease;
                }
                .rm-notification-success { background: #dcfce7; color: #166534; }
                .rm-notification-error { background: #fee2e2; color: #991b1b; }
                .rm-notification-info { background: #dbeafe; color: #1e40af; }
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    function showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
        }
    }

    function hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
        }
    }

    function normalizeRoleKey(value) {
        return String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    }

    function formatRoleLabel(value) {
        const map = {
            superadmin: 'Super Admin',
            admin: 'Admin',
            staff: 'Staff',
            professor: 'Professor',
            student: 'Student'
        };
        const key = normalizeRoleKey(value);
        return map[key] || String(value || 'User');
    }

    function getDefaultPasswordForRole(roleName) {
        const defaults = {
            superadmin: 'superadmin123',
            admin: 'admin123',
            staff: 'staff123',
            professor: 'professor123',
            student: 'student123'
        };
        const key = normalizeRoleKey(roleName);
        return defaults[key] || 'password123';
    }

    // ---- Profile Photo State ----
    let roleUserPhotoData = null; // base64 data URL or null

    function setRoleUserAvatar(photoData, name) {
        const avatarPreview = document.getElementById('roleUserAvatarPreview');
        const avatarImage = document.getElementById('roleUserAvatarImage');
        const avatarFallback = document.getElementById('roleUserAvatarFallback');
        const displayName = name || 'U';

        if (avatarFallback) avatarFallback.textContent = displayName.charAt(0).toUpperCase();

        if (photoData) {
            if (avatarImage) {
                avatarImage.src = photoData;
                avatarImage.style.display = 'block';
            }
            if (avatarFallback) avatarFallback.style.display = 'none';
            if (avatarPreview) avatarPreview.classList.add('has-image');
        } else {
            if (avatarImage) {
                avatarImage.removeAttribute('src');
                avatarImage.style.display = 'none';
            }
            if (avatarFallback) avatarFallback.style.display = 'flex';
            if (avatarPreview) avatarPreview.classList.remove('has-image');
        }
    }

    function handleRoleUserPhotoChange(event) {
        const file = event.target.files && event.target.files[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            showNotification('Please select a valid image file.', 'error');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            showNotification('Image must be under 5 MB.', 'error');
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            roleUserPhotoData = reader.result;
            const name = document.getElementById('roleUserFullName')?.value.trim() || 'U';
            setRoleUserAvatar(roleUserPhotoData, name);
        };
        reader.onerror = () => showNotification('Unable to read the selected image.', 'error');
        reader.readAsDataURL(file);
    }

    function triggerRoleUserPhotoUpload() {
        document.getElementById('roleUserPhotoInput')?.click();
    }

    function updateRoleUserPreview() {
        const fullName = document.getElementById('roleUserFullName')?.value.trim() || 'New User';
        const idNumber = document.getElementById('roleUserIdNumber')?.value.trim() || '—';
        const roleName = document.getElementById('roleUserRoleName')?.value || 'User';

        const previewName = document.getElementById('roleUserPreviewName');
        const previewRole = document.getElementById('roleUserPreviewRole');
        const previewId = document.getElementById('roleUserPreviewId');
        const avatarFallback = document.getElementById('roleUserAvatarFallback');

        if (previewName) previewName.textContent = fullName;
        if (previewRole) previewRole.textContent = formatRoleLabel(roleName);
        if (previewId) previewId.textContent = `ID: ${idNumber}`;
        if (avatarFallback) avatarFallback.textContent = fullName.charAt(0).toUpperCase() || 'U';

        // Keep photo showing if we have one
        if (!roleUserPhotoData) {
            if (avatarFallback) avatarFallback.style.display = 'flex';
        }
    }

    function resetRoleUserForm(role) {
        const form = document.getElementById('roleUserForm');
        if (form) {
            form.reset();
        }

        // Clear edit mode
        const userIdInput = document.getElementById('roleUserUserId');
        if (userIdInput) userIdInput.value = '';

        // Clear photo
        roleUserPhotoData = null;
        setRoleUserAvatar(null, 'U');
        const photoInput = document.getElementById('roleUserPhotoInput');
        if (photoInput) photoInput.value = '';

        const saveBtn = document.getElementById('saveRoleUserButton');
        if (saveBtn) saveBtn.textContent = 'Save User';

        const roleIdInput = document.getElementById('roleUserRoleId');
        const roleNameInput = document.getElementById('roleUserRoleName');
        const title = document.getElementById('roleUserInfoTitle');
        const hint = document.getElementById('roleUserHint');
        const passwordInput = document.getElementById('roleUserPassword');
        const confirmInput = document.getElementById('roleUserConfirmPassword');
        const defaultPassword = getDefaultPasswordForRole(role.name || '');

        if (roleIdInput) roleIdInput.value = String(role.id || '');
        if (roleNameInput) roleNameInput.value = String(role.name || '');
        if (title) title.textContent = `Add ${formatRoleLabel(role.name)}`;
        if (hint) {
            hint.textContent = `Fill in the ${formatRoleLabel(role.name).toLowerCase()} information below. If password is blank, the default will be ${defaultPassword}.`;
        }
        if (passwordInput) passwordInput.placeholder = `Default: ${defaultPassword}`;
        if (confirmInput) confirmInput.placeholder = `Default: ${defaultPassword}`;

        updateRoleUserPreview();
    }

    async function saveRoleUserForm() {
        const editUserId = String(document.getElementById('roleUserUserId')?.value || '').trim();
        const isEdit = editUserId !== '';
        const roleId = Number(document.getElementById('roleUserRoleId')?.value || 0);
        const roleName = String(document.getElementById('roleUserRoleName')?.value || '');
        const fullName = String(document.getElementById('roleUserFullName')?.value || '').trim();
        const idNumber = String(document.getElementById('roleUserIdNumber')?.value || '').trim();
        const gender = String(document.getElementById('roleUserGender')?.value || '').trim();
        const birthDate = String(document.getElementById('roleUserBirthDate')?.value || '').trim();
        const email = String(document.getElementById('roleUserEmail')?.value || '').trim();
        const phone = String(document.getElementById('roleUserPhone')?.value || '').trim();
        const address = String(document.getElementById('roleUserAddress')?.value || '').trim();
        let password = String(document.getElementById('roleUserPassword')?.value || '');
        let confirmPassword = String(document.getElementById('roleUserConfirmPassword')?.value || '');

        if (!roleId || !fullName || !idNumber) {
            showNotification('Please complete the required name and ID fields.', 'error');
            return;
        }

        if (isEdit) {
            // Edit mode: password blank means keep unchanged
            if (password && password !== confirmPassword) {
                showNotification('Password and confirm password do not match.', 'error');
                return;
            }
        } else {
            // Add mode: blank password uses default
            const defaultPassword = getDefaultPasswordForRole(roleName);
            if (!password) password = defaultPassword;
            if (!confirmPassword) confirmPassword = password;
            if (password !== confirmPassword) {
                showNotification('Password and confirm password do not match.', 'error');
                return;
            }
        }

        try {
            const payload = {
                role_id: roleId,
                full_name: fullName,
                username: idNumber,
                email,
                phone,
                address,
                birth_date: birthDate,
                gender,
                password,
                confirm_password: confirmPassword,
                profile_photo: roleUserPhotoData || ''
            };
            if (isEdit) payload.user_id = Number(editUserId);

            const data = await apiFetch('role_user_save.php', 'POST', payload);

            if (isEdit) {
                showNotification(data.message || 'User updated successfully', 'success');
            } else {
                const defaultPassword = getDefaultPasswordForRole(roleName);
                showNotification((data.message || 'User saved successfully') + ` Default password: ${data.default_password || defaultPassword}`, 'success');
            }
            hideModal('roleUserInfoModal');
            await refreshUsers();
            await refreshRoles();
        } catch (error) {
            console.error('Failed to save role user:', error);
            showNotification(error.message || 'Failed to save user', 'error');
        }
    }

    window.openRoleUserInfoModal = function(roleId) {
        const role = state.roles.find(r => r.id == roleId);
        if (!role) return;

        resetRoleUserForm(role);
        showModal('roleUserInfoModal');
    };

    window.editUserProfile = async function(userId) {
        try {
            const res = await fetch(API_BASE + 'profile_data.php?user_id=' + userId);
            const data = await res.json();
            if (!data.ok && !data.profile) {
                showNotification('Failed to load user profile', 'error');
                return;
            }
            const profile = data.profile || data;
            const userRoleId = profile.role_id || '';
            let role = state.roles.find(r => r.id == userRoleId);
            if (!role) {
                const roleName = profile.role || '';
                role = state.roles.find(r => r.name && r.name.toLowerCase() === roleName.toLowerCase());
            }
            if (!role) {
                role = { id: userRoleId || 0, name: profile.role || 'User' };
            }

            resetRoleUserForm(role);

            // Switch to edit mode
            const userIdInput = document.getElementById('roleUserUserId');
            if (userIdInput) userIdInput.value = String(profile.id || userId);

            const title = document.getElementById('roleUserInfoTitle');
            if (title) title.textContent = `Edit ${formatRoleLabel(role.name || 'User')}`;

            const hint = document.getElementById('roleUserHint');
            if (hint) hint.textContent = `Update the profile information below. Leave password blank to keep unchanged.`;

            const saveBtn = document.getElementById('saveRoleUserButton');
            if (saveBtn) saveBtn.textContent = 'Update User';

            // Fill form fields
            const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
            setVal('roleUserFullName', profile.full_name);
            setVal('roleUserIdNumber', profile.user_id);
            setVal('roleUserGender', profile.gender);
            setVal('roleUserBirthDate', profile.birth_date);
            setVal('roleUserEmail', profile.email);
            setVal('roleUserPhone', profile.phone);
            setVal('roleUserAddress', profile.address);

            // Load existing photo
            roleUserPhotoData = profile.profile_photo || null;
            setRoleUserAvatar(roleUserPhotoData, profile.full_name || 'U');

            // Password placeholders for edit
            const pwInput = document.getElementById('roleUserPassword');
            const cpInput = document.getElementById('roleUserConfirmPassword');
            if (pwInput) pwInput.placeholder = 'Leave blank to keep unchanged';
            if (cpInput) cpInput.placeholder = 'Leave blank to keep unchanged';

            updateRoleUserPreview();
            showModal('roleUserInfoModal');
        } catch (err) {
            console.error('Failed to load user profile:', err);
            showNotification('Failed to load user profile', 'error');
        }
    };

    // =====================================================
    // TAB NAVIGATION
    // =====================================================

    function initTabs() {
        const tabs = document.querySelectorAll('.rm-tab');
        const tabContents = document.querySelectorAll('.rm-tab-content');

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.dataset.tab;
                
                // Update active tab
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                // Update active content
                tabContents.forEach(content => {
                    content.classList.remove('active');
                    const contentId = `tab${tabName.charAt(0).toUpperCase() + tabName.slice(1)}`;
                    if (content.id === contentId) {
                        content.classList.add('active');
                    }
                });
                
                state.currentTab = tabName;
                
                // Load content for active tab
                switch(tabName) {
                    case 'roles':
                        loadRoles();
                        break;
                    case 'permissions':
                        loadPermissions();
                        break;
                    case 'users':
                        loadUsers();
                        break;
                    case 'audit':
                        loadAuditLog();
                        break;
                }
            });
        });
    }

    // =====================================================
    // ROLES MANAGEMENT
    // =====================================================

    function loadRoles() {
        const rolesList = document.getElementById('rolesList');
        if (!rolesList) return;

        if (state.roles.length === 0) {
            rolesList.innerHTML = '<div class="rm-empty-state"><h3>No roles found</h3><p>Add a role to get started.</p></div>';
            updateStatistics();
            return;
        }

        rolesList.innerHTML = state.roles.map(role => `
            <div class="rm-role-card ${role.is_system ? 'system' : ''}">
                <div class="rm-role-card-header">
                    <div>
                        <h3 class="rm-role-card-title">${escapeHtml(role.name)}</h3>
                        <div style="display: flex; gap: 8px; margin-top: 8px; flex-wrap: wrap;">
                            ${role.is_system ? '<span class="rm-role-card-badge system">System</span>' : ''}
                            <span class="rm-role-card-badge ${role.is_active ? 'active' : 'inactive'}">
                                ${role.is_active ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                    </div>
                </div>
                <p class="rm-role-card-description">${escapeHtml(role.description || 'No description')}</p>
                <div class="rm-role-card-stats">
                    <div class="rm-role-card-stat">
                        <span class="rm-role-card-stat-value">${role.user_count || 0}</span>
                        <span class="rm-role-card-stat-label">Users</span>
                    </div>
                    <div class="rm-role-card-stat">
                        <span class="rm-role-card-stat-value">${role.permission_count || 0}</span>
                        <span class="rm-role-card-stat-label">Permissions</span>
                    </div>
                </div>
                <div class="rm-role-card-actions">
                    ${(window.UserCan && window.UserCan.edit('rolemanagement')) ? `
                    <button class="rm-role-card-action edit" onclick="editRole(${role.id})">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                        Edit
                    </button>` : ''}
                    ${(window.UserCan && window.UserCan.create('rolemanagement')) ? `
                    <button class="rm-role-card-action permissions" onclick="openRoleUserInfoModal(${role.id})">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        Add
                    </button>` : ''}
                    ${(window.UserCan && window.UserCan.edit('rolemanagement')) ? `
                    <button class="rm-role-card-action permissions" onclick="managePermissions(${role.id})">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                        </svg>
                        Permissions
                    </button>` : ''}
                    ${!role.is_system && (window.UserCan && window.UserCan.del('rolemanagement')) ? `
                        <button class="rm-role-card-action delete" onclick="deleteRole(${role.id}, '${escapeHtml(role.name)}')">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                            Delete
                        </button>
                    ` : ''}
                </div>
            </div>
        `).join('');

        // Update statistics
        updateStatistics();
    }

    function updateStatistics() {
        const totalRoles = state.roles.length;
        const activeRoles = state.roles.filter(r => r.is_active).length;
        const totalPermissions = state.roles.reduce((sum, role) => {
            const permissionCount = Array.isArray(role.permissions)
                ? 0
                : Object.values(role.permissions || {}).reduce((count, modulePerms) => {
                    return count + Object.values(modulePerms || {}).filter(Boolean).length;
                }, 0);
            return sum + permissionCount;
        }, 0);
        const totalUsers = mockData.users.length;

        const totalRolesEl = document.getElementById('totalRolesCount');
        const activeRolesEl = document.getElementById('activeRolesCount');
        const totalPermissionsEl = document.getElementById('totalPermissionsCount');
        const totalUsersEl = document.getElementById('totalUsersCount');

        if (totalRolesEl) totalRolesEl.textContent = totalRoles;
        if (activeRolesEl) activeRolesEl.textContent = activeRoles;
        if (totalPermissionsEl) totalPermissionsEl.textContent = totalPermissions;
        if (totalUsersEl) totalUsersEl.textContent = totalUsers;
    }

    /**
     * Apply role template to form (basic - only name, description)
     */
    function applyRoleTemplateBasic(templateName) {
        const template = roleTemplates[templateName];
        if (!template) return;

        // Set form values only (no permissions)
        document.getElementById('roleName').value = template.name;
        document.getElementById('roleDescription').value = template.description;
    }

    /**
     * Show permission summary
     */
    function showPermissionSummary(permissions) {
        const summaryEl = document.getElementById('permissionSummary');
        if (!summaryEl) return;

        let totalPermissions = 0;
        let modulesWithAccess = 0;
        const moduleList = [];

        Object.keys(permissions).forEach(moduleSlug => {
            const modulePerms = permissions[moduleSlug];
            const enabledActions = Object.values(modulePerms).filter(v => v).length;
            if (enabledActions > 0) {
                modulesWithAccess++;
                totalPermissions += enabledActions;
                const module = mockData.modules.find(m => m.slug === moduleSlug);
                if (module) {
                    const actions = Object.keys(modulePerms).filter(a => modulePerms[a]).map(a => a.charAt(0).toUpperCase() + a.slice(1));
                    moduleList.push(`${module.name}: ${actions.join(', ')}`);
                }
            }
        });

        summaryEl.innerHTML = `
            <div class="rm-summary-card">
                <div class="rm-summary-stats">
                    <div class="rm-summary-stat">
                        <span class="rm-summary-value">${modulesWithAccess}</span>
                        <span class="rm-summary-label">Modules</span>
                    </div>
                    <div class="rm-summary-stat">
                        <span class="rm-summary-value">${totalPermissions}</span>
                        <span class="rm-summary-label">Permissions</span>
                    </div>
                </div>
                <div class="rm-summary-modules">
                    <strong>Accessible Modules:</strong>
                    <div class="rm-summary-module-list">${moduleList.join(' • ')}</div>
                </div>
            </div>
        `;
        summaryEl.style.display = 'block';
    }

    /**
     * Load module permissions UI
     */
    function loadModulePermissions() {
        renderModulePermissions();
    }

    /**
     * Render module permissions grid
     */
    function renderModulePermissions() {
        const grid = document.getElementById('modulePermissionsGrid');
        if (!grid) return;

        grid.innerHTML = mockData.modules.map(module => {
            const modulePerms = state.selectedPermissions[module.slug] || {};
            const actions = ['view', 'create', 'edit', 'delete', 'approve'];
            
            return `
                <div class="rm-module-permission-card">
                    <div class="rm-module-permission-header">
                        <h4>${escapeHtml(module.name)}</h4>
                        <label class="rm-checkbox-label">
                            <input type="checkbox" class="rm-module-select-all" 
                                   data-module="${module.slug}"
                                   onchange="toggleModulePermissions('${module.slug}', this.checked)">
                            <span>Select All</span>
                        </label>
                    </div>
                    <div class="rm-module-permission-actions">
                        ${actions.map(action => `
                            <label class="rm-action-checkbox">
                                <input type="checkbox" 
                                       data-module="${module.slug}"
                                       data-action="${action}"
                                       ${modulePerms[action] ? 'checked' : ''}
                                       onchange="updateModulePermission('${module.slug}', '${action}', this.checked)">
                                <span>${action.charAt(0).toUpperCase() + action.slice(1)}</span>
                            </label>
                        `).join('')}
                    </div>
                </div>
            `;
        }).join('');
    }

    window.toggleModulePermissions = function(moduleSlug, checked) {
        if (!state.selectedPermissions[moduleSlug]) {
            state.selectedPermissions[moduleSlug] = {};
        }
        ['view', 'create', 'edit', 'delete', 'approve'].forEach(action => {
            state.selectedPermissions[moduleSlug][action] = checked;
        });
        renderModulePermissions();
        const template = document.getElementById('roleTemplate')?.value;
        if (template === 'custom') {
            showPermissionSummary(state.selectedPermissions);
        }
    };

    window.updateModulePermission = function(moduleSlug, action, checked) {
        if (!state.selectedPermissions[moduleSlug]) {
            state.selectedPermissions[moduleSlug] = {};
        }
        state.selectedPermissions[moduleSlug][action] = checked;
        
        // Update "Select All" checkbox state
        const moduleCard = document.querySelector(`[data-module="${moduleSlug}"].rm-module-select-all`)?.closest('.rm-module-permission-card');
        if (moduleCard) {
            const allChecked = ['view', 'create', 'edit', 'delete', 'approve'].every(a => 
                state.selectedPermissions[moduleSlug][a] === true
            );
            const selectAll = moduleCard.querySelector('.rm-module-select-all');
            if (selectAll) {
                selectAll.checked = allChecked;
            }
        }

        // Update permission summary if in custom mode
        const template = document.getElementById('roleTemplate')?.value;
        if (template === 'custom') {
            showPermissionSummary(state.selectedPermissions);
        }
    };

    window.editRole = function(roleId) {
        const role = state.roles.find(r => r.id == roleId);
        if (!role) return;

        document.getElementById('roleId').value = role.id;
        document.getElementById('roleName').value = role.name;
        document.getElementById('roleDescription').value = role.description || '';
        document.getElementById('roleIsActive').checked = role.is_active;
        document.getElementById('roleTemplate').value = '';

        document.getElementById('roleModalTitle').textContent = 'Edit Role';
        showModal('roleModal');
    };

    window.deleteRole = async function(roleId, roleName) {
        const role = state.roles.find(r => r.id == roleId);
        if (!role) return;

        // Prevent deletion of system roles
        if (role.is_system) {
            showNotification('System roles cannot be deleted', 'error');
            return;
        }

        if (confirm(`Are you sure you want to delete the role "${roleName}"? This action cannot be undone.`)) {
            await deleteRoleFromDb(roleId);
            mockData.auditLog.unshift({
                id: mockData.auditLog.length + 1,
                action: 'delete_role',
                entity: `Role: ${roleName}`,
                user: 'Current User',
                date: new Date().toLocaleString()
            });
        }
    };

    window.managePermissions = function(roleId) {
        state.currentRole = roleId;
        const role = state.roles.find(r => r.id == roleId);
        if (role) {
            document.getElementById('permissionModalTitle').textContent = `Manage Permissions - ${role.name}`;
        }
        loadPermissionMatrixForModal(roleId);
        showModal('permissionModal');
    };

    function loadPermissionMatrixForModal(roleId) {
        const matrixContainer = document.getElementById('permissionMatrixContent');
        if (!matrixContainer) return;

        matrixContainer.innerHTML = '<div class="rm-loading">Loading permissions...</div>';

        setTimeout(() => {
            const role = state.roles.find(r => r.id == roleId);
            if (!role) return;

            const rolePermissions = role.permissions || {};

            let matrixHTML = `
                <table class="rm-permission-table">
                    <thead>
                        <tr>
                            <th>Module</th>
                            <th>View</th>
                            <th>Create</th>
                            <th>Edit</th>
                            <th>Delete</th>
                            <th>Approve</th>
                        </tr>
                    </thead>
                    <tbody>
            `;

            mockData.modules.forEach(module => {
                const actions = ['view', 'create', 'edit', 'delete', 'approve'];
                const modulePerms = rolePermissions[module.slug] || {};
                
                matrixHTML += '<tr>';
                matrixHTML += `<td class="rm-permission-module"><strong>${escapeHtml(module.name)}</strong></td>`;
                
                actions.forEach(action => {
                    const hasPermission = modulePerms[action] === true;
                    matrixHTML += `
                        <td class="rm-permission-checkbox">
                            <input type="checkbox" 
                                   data-module="${module.slug}"
                                   data-action="${action}"
                                   ${hasPermission ? 'checked' : ''}
                                   onchange="updatePermissionInMatrix('${module.slug}', '${action}', this.checked, ${roleId})">
                        </td>
                    `;
                });
                
                matrixHTML += '</tr>';
            });

            matrixHTML += '</tbody></table>';
            matrixContainer.innerHTML = matrixHTML;
        }, 300);
    }

    // =====================================================
    // ROLE FORM
    // =====================================================

    function initRoleUserInfoModal() {
        const previewInputs = ['roleUserFullName', 'roleUserIdNumber'];
        previewInputs.forEach(id => {
            document.getElementById(id)?.addEventListener('input', updateRoleUserPreview);
        });

        // Photo upload handlers
        document.getElementById('roleUserPhotoInput')?.addEventListener('change', handleRoleUserPhotoChange);
        document.getElementById('roleUserAvatarOverlay')?.addEventListener('click', triggerRoleUserPhotoUpload);
        document.getElementById('roleUserChangePhotoBtn')?.addEventListener('click', triggerRoleUserPhotoUpload);

        document.getElementById('saveRoleUserButton')?.addEventListener('click', saveRoleUserForm);
        document.getElementById('closeRoleUserInfoModal')?.addEventListener('click', () => hideModal('roleUserInfoModal'));
        document.getElementById('cancelRoleUserInfoModal')?.addEventListener('click', () => hideModal('roleUserInfoModal'));
        document.getElementById('roleUserInfoModal')?.addEventListener('click', (e) => {
            if (e.target.classList.contains('rm-modal-overlay')) {
                hideModal('roleUserInfoModal');
            }
        });
    }

    function initRoleForm() {
        const btnAddRole = document.getElementById('btnAddRole');
        if (btnAddRole) {
            if (!(window.UserCan && window.UserCan.create('rolemanagement'))) {
                btnAddRole.style.display = 'none';
            }
            btnAddRole.addEventListener('click', () => {
                document.getElementById('roleForm').reset();
                document.getElementById('roleId').value = '';
                document.getElementById('roleIsActive').checked = true;
                document.getElementById('roleModalTitle').textContent = 'Add New Role';
                document.getElementById('roleTemplate').value = '';
                showModal('roleModal');
            });
        }

        // Role template selector (only auto-fills name, description)
        const roleTemplate = document.getElementById('roleTemplate');
        if (roleTemplate) {
            roleTemplate.addEventListener('change', (e) => {
                const template = e.target.value;
                if (template && roleTemplates[template]) {
                    applyRoleTemplateBasic(template);
                }
            });
        }

        const saveRole = document.getElementById('saveRole');
        if (saveRole) {
            saveRole.addEventListener('click', async () => {
                const form = document.getElementById('roleForm');
                if (!form.checkValidity()) {
                    form.reportValidity();
                    return;
                }

                const roleId = document.getElementById('roleId').value;
                const template = document.getElementById('roleTemplate').value;
                let rolePermissions = {};

                if (!roleId && template && roleTemplates[template]) {
                    rolePermissions = JSON.parse(JSON.stringify(roleTemplates[template].permissions));
                } else if (roleId) {
                    const existingRole = state.roles.find(r => r.id == roleId);
                    if (existingRole && existingRole.permissions) {
                        rolePermissions = JSON.parse(JSON.stringify(existingRole.permissions));
                    }
                }

                const roleData = {
                    name: document.getElementById('roleName').value.trim(),
                    description: document.getElementById('roleDescription').value.trim(),
                    is_active: document.getElementById('roleIsActive').checked,
                    permissions: rolePermissions
                };

                try {
                    const savedRole = await saveRoleToDb(roleId ? parseInt(roleId, 10) : null, roleData);
                    if (savedRole) {
                        mockData.auditLog.unshift({
                            id: mockData.auditLog.length + 1,
                            action: roleId ? 'update_role' : 'create_role',
                            entity: `Role: ${savedRole.name}`,
                            user: 'Current User',
                            date: new Date().toLocaleString()
                        });

                        showNotification(roleId ? 'Role updated successfully' : 'Role created successfully', 'success');
                    }

                    hideModal('roleModal');
                    await refreshRoles();
                    if (state.currentTab === 'permissions') {
                        loadPermissions();
                    }
                } catch (error) {
                    // Error already displayed by saveRoleToDb
                }
            });
        }

        // Close modal handlers
        document.getElementById('closeRoleModal')?.addEventListener('click', () => hideModal('roleModal'));
        document.getElementById('cancelRoleModal')?.addEventListener('click', () => hideModal('roleModal'));
        document.getElementById('roleModal')?.addEventListener('click', (e) => {
            if (e.target.classList.contains('rm-modal-overlay')) {
                hideModal('roleModal');
            }
        });
    }

    // =====================================================
    // PERMISSIONS
    // =====================================================

    let permissionsListenerBound = false;

    function loadPermissions() {
        const roleSelect = document.getElementById('permissionRoleSelect');
        if (roleSelect) {
            roleSelect.innerHTML = '<option value="">-- Select a role --</option>';
            state.roles.forEach(role => {
                if (role.is_active) {
                    roleSelect.innerHTML += `<option value="${role.id}">${escapeHtml(role.name)}</option>`;
                }
            });

            if (!permissionsListenerBound) {
                permissionsListenerBound = true;
                roleSelect.addEventListener('change', (e) => {
                const roleId = e.target.value;
                if (roleId) {
                    loadPermissionMatrix(roleId);
                    const permissionActions = document.getElementById('permissionActions');
                    if (permissionActions) {
                        permissionActions.style.display = 'flex';
                    }
                } else {
                    const matrix = document.getElementById('permissionMatrix');
                    if (matrix) {
                        matrix.innerHTML = `
                            <div class="rm-empty-state">
                                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                </svg>
                                <h3>Select a Role</h3>
                                <p>Choose a role from the dropdown above to view permissions</p>
                            </div>
                        `;
                    }
                    const permissionActions = document.getElementById('permissionActions');
                    if (permissionActions) {
                        permissionActions.style.display = 'none';
                    }
                }
                });
            }
        }
    }

    function loadPermissionMatrix(roleId) {
        const matrixContainer = document.getElementById('permissionMatrix');
        if (!matrixContainer) return;

        matrixContainer.innerHTML = '<div class="rm-loading">Loading permissions...</div>';

        setTimeout(() => {
            const role = state.roles.find(r => r.id == roleId);
            if (!role) return;

            const rolePermissions = role.permissions || {};

            let matrixHTML = `
                <table class="rm-permission-table">
                    <thead>
                        <tr>
                            <th>Module</th>
                            <th>View</th>
                            <th>Create</th>
                            <th>Edit</th>
                            <th>Delete</th>
                            <th>Approve</th>
                        </tr>
                    </thead>
                    <tbody>
            `;

            mockData.modules.forEach(module => {
                const actions = ['view', 'create', 'edit', 'delete', 'approve'];
                const modulePerms = rolePermissions[module.slug] || {};
                
                // Check if module has any permissions
                const hasAnyPermission = actions.some(action => modulePerms[action] === true);
                
                matrixHTML += '<tr>';
                matrixHTML += `<td class="rm-permission-module"><strong>${escapeHtml(module.name)}</strong></td>`;
                
                actions.forEach(action => {
                    const hasPermission = modulePerms[action] === true;
                    matrixHTML += `
                        <td class="rm-permission-checkbox">
                            <input type="checkbox" 
                                   data-module="${module.slug}"
                                   data-action="${action}"
                                   ${hasPermission ? 'checked' : ''}
                                   onchange="updatePermissionInMatrix('${module.slug}', '${action}', this.checked, ${roleId})">
                        </td>
                    `;
                });
                
                matrixHTML += '</tr>';
            });

            matrixHTML += '</tbody></table>';
            matrixContainer.innerHTML = matrixHTML;
            
            // Show quick actions
            const permissionActions = document.getElementById('permissionActions');
            if (permissionActions) {
                permissionActions.style.display = 'flex';
            }
        }, 300);
    }

    // Quick actions for permissions tab (using event delegation)
    document.addEventListener('click', function(e) {
        if (e.target.closest('#selectAllPermissions')) {
            const isInModal = e.target.closest('#permissionModal');
            handleQuickAction('selectAll', isInModal ? 'modal' : 'tab');
        } else if (e.target.closest('#deselectAllPermissions')) {
            const isInModal = e.target.closest('#permissionModal');
            handleQuickAction('deselectAll', isInModal ? 'modal' : 'tab');
        } else if (e.target.closest('#selectViewOnly')) {
            const isInModal = e.target.closest('#permissionModal');
            handleQuickAction('viewOnly', isInModal ? 'modal' : 'tab');
        }
    });

    window.updatePermissionInMatrix = function(moduleSlug, action, checked, roleId) {
        const role = state.roles.find(r => r.id == roleId);
        if (!role) return;

        if (!role.permissions) {
            role.permissions = {};
        }
        if (!role.permissions[moduleSlug]) {
            role.permissions[moduleSlug] = {};
        }
        role.permissions[moduleSlug][action] = checked;
        
        // Update permission count
        let count = 0;
        Object.values(role.permissions).forEach(modulePerms => {
            count += Object.values(modulePerms).filter(v => v).length;
        });
        role.permission_count = count;

        // Add to audit log
        mockData.auditLog.unshift({
            id: mockData.auditLog.length + 1,
            action: checked ? 'grant_permission' : 'revoke_permission',
            entity: `Role: ${role.name}, Module: ${moduleSlug}, Action: ${action}`,
            user: 'Current User',
            date: new Date().toLocaleString()
        });
    };

    window.updatePermissionSelection = function(isChecked) {
        // Handle permission selection
        console.log('Permission updated:', isChecked);
    };

    function initPermissionModal() {
        document.getElementById('savePermissions')?.addEventListener('click', async () => {
            if (!state.currentRole) {
                showNotification('Please select a role first', 'error');
                return;
            }

            const role = state.roles.find(r => r.id == state.currentRole);
            if (role) {
                try {
                    await saveRolePermissionsToDb(role.id, role.permissions || {});
                    mockData.auditLog.unshift({
                        id: mockData.auditLog.length + 1,
                        action: 'grant_permission',
                        entity: `Permissions updated for role ${role.name}`,
                        user: 'Current User',
                        date: new Date().toLocaleString()
                    });
                    showNotification('Permissions updated successfully', 'success');
                    hideModal('permissionModal');
                    loadRoles(); // Refresh to show updated permission count
                } catch (error) {
                    // Error already handled in saveRolePermissionsToDb
                }
            }
        });

        document.getElementById('closePermissionModal')?.addEventListener('click', () => hideModal('permissionModal'));
        document.getElementById('cancelPermissionModal')?.addEventListener('click', () => hideModal('permissionModal'));
        document.getElementById('permissionModal')?.addEventListener('click', (e) => {
            if (e.target.classList.contains('rm-modal-overlay')) {
                hideModal('permissionModal');
            }
        });

        // Modal quick actions
        document.getElementById('modalSelectAll')?.addEventListener('click', () => handleQuickAction('selectAll', 'modal'));
        document.getElementById('modalDeselectAll')?.addEventListener('click', () => handleQuickAction('deselectAll', 'modal'));
        document.getElementById('modalViewOnly')?.addEventListener('click', () => handleQuickAction('viewOnly', 'modal'));
    }

    // Quick actions handler (works for both tab and modal)
    function handleQuickAction(action, context = 'tab') {
        let roleId;
        let matrixContainer;
        
        if (context === 'modal') {
            roleId = state.currentRole;
            matrixContainer = 'permissionMatrixContent';
        } else {
            roleId = document.getElementById('permissionRoleSelect')?.value;
            matrixContainer = 'permissionMatrix';
        }
        
        if (!roleId) {
            showNotification('Please select a role first', 'error');
            return;
        }
        
        const role = state.roles.find(r => r.id == roleId);
        if (!role) return;

        if (!role.permissions) role.permissions = {};

        if (action === 'selectAll') {
            mockData.modules.forEach(module => {
                if (!role.permissions[module.slug]) {
                    role.permissions[module.slug] = {};
                }
                ['view', 'create', 'edit', 'delete', 'approve'].forEach(permAction => {
                    role.permissions[module.slug][permAction] = true;
                });
            });
        } else if (action === 'deselectAll') {
            role.permissions = {};
        } else if (action === 'viewOnly') {
            mockData.modules.forEach(module => {
                if (!role.permissions[module.slug]) {
                    role.permissions[module.slug] = {};
                }
                ['view', 'create', 'edit', 'delete', 'approve'].forEach(permAction => {
                    role.permissions[module.slug][permAction] = (permAction === 'view');
                });
            });
        }

        // Update permission count
        role.permission_count = calculatePermissionCount(role.permissions);

        // Reload matrix
        if (context === 'modal') {
            loadPermissionMatrixForModal(roleId);
        } else {
            loadPermissionMatrix(roleId);
        }
        
        showNotification(`Permissions ${action === 'selectAll' ? 'selected' : action === 'deselectAll' ? 'deselected' : 'set to view-only'}`, 'success');
    }

    // =====================================================
    // USER ASSIGNMENTS
    // =====================================================

    const USER_ITEMS_PER_PAGE = 10;
    let currentUsersPage = 1;

    function getFilteredUsersForRoleTab() {
        let filtered = Array.isArray(mockData.users) ? mockData.users.slice() : [];

        const userSearch = document.getElementById('userSearch');
        const userStatusFilter = document.getElementById('userStatusFilter');
        const userRoleFilter = document.getElementById('userRoleFilter');

        const searchTerm = userSearch?.value.toLowerCase().trim() || '';
        const roleId = userRoleFilter?.value || 'all';
        const status = userStatusFilter?.value || 'all';

        if (searchTerm !== '') {
            filtered = filtered.filter(user =>
                String(user.name || '').toLowerCase().includes(searchTerm) ||
                String(user.email || '').toLowerCase().includes(searchTerm) ||
                (user.roles && user.roles.some(r => String(r).toLowerCase().includes(searchTerm)))
            );
        }

        if (roleId !== 'all') {
            const role = state.roles.find(r => r.id == roleId);
            if (role) {
                filtered = filtered.filter(user => user.roles && user.roles.includes(role.name));
            }
        }

        if (status !== 'all') {
            filtered = filtered.filter(user => status === 'active' ? !!user.is_active : !user.is_active);
        }

        return filtered;
    }

    function buildUsersMarkup(users) {
        return `
            <div class="rm-users-list">
                ${users.map(user => `
                    <div class="rm-user-item">
                        <div class="rm-user-avatar">${escapeHtml(String(user.name || '?').charAt(0).toUpperCase())}</div>
                        <div class="rm-user-info">
                            <h3 class="rm-user-name">${escapeHtml(user.name || '')}</h3>
                            <p class="rm-user-email">${escapeHtml(user.email || '')}</p>
                            <div class="rm-user-meta">
                                <span class="rm-user-meta-item">Status: ${user.is_active ? 'Active' : 'Inactive'}</span>
                                <span class="rm-user-meta-item">Role: ${user.roles && user.roles.length > 0 ? escapeHtml(user.roles.join(', ')) : 'None'}</span>
                            </div>
                            <div class="rm-user-roles">
                                ${user.roles && user.roles.length > 0 ? user.roles.map(role => `
                                    <span class="rm-user-role-badge">${escapeHtml(role)}</span>
                                `).join('') : '<span class="rm-user-empty-role">No roles assigned</span>'}
                            </div>
                        </div>
                        <div class="rm-user-actions">
                            ${(function() {
                                const isStudent = user.roles && user.roles.some(r => r.toLowerCase().includes('student'));
                                if (isStudent) {
                                    return `<button class="rm-role-card-action edit" onclick="editUserRoles(${user.id})">Edit Roles</button>`;
                                } else {
                                    return `<button class="rm-role-card-action edit" onclick="editUserProfile(${user.id})">Edit</button>`;
                                }
                            })()}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    function renderUsersPagination(totalRecords) {
        const info = document.getElementById('rmUsersPaginationInfo');
        const prevBtn = document.getElementById('rmUsersPrevBtn');
        const nextBtn = document.getElementById('rmUsersNextBtn');
        const pagesContainer = document.getElementById('rmUsersPaginationPages');
        const totalPages = Math.max(1, Math.ceil(totalRecords / USER_ITEMS_PER_PAGE));
        const start = totalRecords === 0 ? 0 : ((currentUsersPage - 1) * USER_ITEMS_PER_PAGE) + 1;
        const end = Math.min(currentUsersPage * USER_ITEMS_PER_PAGE, totalRecords);

        if (info) {
            info.textContent = totalRecords === 0 ? 'Showing 0 of 0' : `Showing ${start} to ${end} of ${totalRecords}`;
        }

        if (prevBtn) prevBtn.disabled = currentUsersPage <= 1 || totalRecords === 0;
        if (nextBtn) nextBtn.disabled = currentUsersPage >= totalPages || totalRecords === 0;

        if (!pagesContainer) return;
        pagesContainer.innerHTML = '';

        if (totalRecords === 0) {
            return;
        }

        let startPage = Math.max(1, currentUsersPage - 2);
        let endPage = Math.min(totalPages, startPage + 4);
        startPage = Math.max(1, endPage - 4);

        for (let page = startPage; page <= endPage; page++) {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'rm-users-page-btn' + (page === currentUsersPage ? ' active' : '');
            button.textContent = String(page);
            button.addEventListener('click', () => {
                currentUsersPage = page;
                renderUsersWithPagination(getFilteredUsersForRoleTab());
            });
            pagesContainer.appendChild(button);
        }
    }

    function renderUsersWithPagination(users) {
        const usersList = document.getElementById('usersList');
        if (!usersList) return;

        const list = Array.isArray(users) ? users : [];
        if (list.length === 0) {
            usersList.innerHTML = '<div class="rm-empty-state"><h3>No users found</h3><p>Try adjusting your search or filter</p></div>';
            renderUsersPagination(0);
            return;
        }

        const totalPages = Math.max(1, Math.ceil(list.length / USER_ITEMS_PER_PAGE));
        if (currentUsersPage > totalPages) {
            currentUsersPage = totalPages;
        }

        const startIndex = (currentUsersPage - 1) * USER_ITEMS_PER_PAGE;
        const pageUsers = list.slice(startIndex, startIndex + USER_ITEMS_PER_PAGE);

        usersList.innerHTML = buildUsersMarkup(pageUsers);
        renderUsersPagination(list.length);
    }

    function loadUsers(resetPage = false) {
        if (resetPage) {
            currentUsersPage = 1;
        }
        renderUsersWithPagination(getFilteredUsersForRoleTab());
    }

    window.editUserRoles = function(userId) {
        const user = mockData.users.find(u => u.id === userId);
        if (!user) return;

        const userSelect = document.getElementById('assignUserId');
        if (userSelect) {
            userSelect.innerHTML = '<option value="">-- Select User --</option>';
            mockData.users.forEach(u => {
                userSelect.innerHTML += `<option value="${u.id}" ${u.id === userId ? 'selected' : ''}>${escapeHtml(u.name)} (${escapeHtml(u.email)})</option>`;
            });
        }

        const roleSelect = document.getElementById('assignRoleId');
        if (roleSelect) {
            roleSelect.innerHTML = '<option value="">-- Select Role --</option>';
            state.roles.filter(r => r.is_active).forEach(role => {
                const selected = user.role_id && role.id === user.role_id ? 'selected' : '';
                roleSelect.innerHTML += `<option value="${role.id}" ${selected}>${escapeHtml(role.name)}</option>`;
            });
        }

        showModal('userRoleModal');
    };

    function initUserRoleForm() {
        document.getElementById('btnAssignRole')?.addEventListener('click', () => {
            // Populate user dropdown
            const userSelect = document.getElementById('assignUserId');
            if (userSelect) {
                userSelect.innerHTML = '<option value="">-- Select User --</option>';
                mockData.users.forEach(user => {
                    userSelect.innerHTML += `<option value="${user.id}">${escapeHtml(user.name)} (${escapeHtml(user.email)})</option>`;
                });
            }

            // Populate role dropdown
            const roleSelect = document.getElementById('assignRoleId');
            if (roleSelect) {
                roleSelect.innerHTML = '<option value="">-- Select Role --</option>';
                state.roles.filter(r => r.is_active).forEach(role => {
                    roleSelect.innerHTML += `<option value="${role.id}">${escapeHtml(role.name)}</option>`;
                });
            }

            showModal('userRoleModal');
        });

        document.getElementById('saveUserRole')?.addEventListener('click', async () => {
            const userId = document.getElementById('assignUserId')?.value;
            const roleId = document.getElementById('assignRoleId')?.value;

            if (!userId || !roleId) {
                showNotification('Please select both user and role', 'error');
                return;
            }

            try {
                const updatedUser = await assignUserRoleToDb(parseInt(userId, 10), parseInt(roleId, 10));
                const role = state.roles.find(r => r.id == roleId);
                if (updatedUser && role) {
                    mockData.auditLog.unshift({
                        id: mockData.auditLog.length + 1,
                        action: 'assign_role',
                        entity: `User: ${updatedUser.name}, Role: ${role.name}`,
                        user: 'Current User',
                        date: new Date().toLocaleString()
                    });
                }

                showNotification('Role assigned successfully', 'success');
                hideModal('userRoleModal');
                await refreshUsers();
                await refreshRoles();
            } catch (error) {
                // error handled by assignUserRoleToDb
            }
        });

        document.getElementById('closeUserRoleModal')?.addEventListener('click', () => hideModal('userRoleModal'));
        document.getElementById('cancelUserRoleModal')?.addEventListener('click', () => hideModal('userRoleModal'));
    }

    // =====================================================
    // AUDIT LOG
    // =====================================================

    function loadAuditLog() {
        const auditBody = document.getElementById('auditLogBody');
        if (!auditBody) return;

        if (mockData.auditLog.length === 0) {
            auditBody.innerHTML = '<tr><td colspan="5" class="rm-empty-state">No audit entries found</td></tr>';
            return;
        }

        auditBody.innerHTML = mockData.auditLog.map(log => `
            <tr>
                <td>${log.date}</td>
                <td>
                    <span class="rm-audit-action-badge ${log.action.split('_')[0]}">
                        ${log.action.replace(/_/g, ' ')}
                    </span>
                </td>
                <td>${escapeHtml(log.entity)}</td>
                <td>${escapeHtml(log.user)}</td>
                <td>Change recorded</td>
            </tr>
        `).join('');
    }

    // =====================================================
    // SEARCH AND FILTERS
    // =====================================================

    function initSearchAndFilters() {
        const roleSearch = document.getElementById('roleSearch');
        if (roleSearch) {
            roleSearch.addEventListener('input', (e) => {
                const searchTerm = e.target.value.toLowerCase();
                const filtered = state.roles.filter(role => 
                    role.name.toLowerCase().includes(searchTerm) ||
                    (role.description && role.description.toLowerCase().includes(searchTerm))
                );
                renderFilteredRoles(filtered);
            });
        }

        const roleStatusFilter = document.getElementById('roleStatusFilter');
        if (roleStatusFilter) {
            roleStatusFilter.addEventListener('change', (e) => {
                applyFilters();
            });
        }

        const roleTypeFilter = document.getElementById('roleTypeFilter');
        if (roleTypeFilter) {
            roleTypeFilter.addEventListener('change', (e) => {
                applyFilters();
            });
        }

        // User search in Users tab
        const userSearch = document.getElementById('userSearch');
        const userStatusFilter = document.getElementById('userStatusFilter');
        const userRoleFilter = document.getElementById('userRoleFilter');

        function renderUsers(users) {
            renderUsersWithPagination(users);
        }

        function getFilteredUsers() {
            return getFilteredUsersForRoleTab();
        }

        if (userSearch) {
            userSearch.addEventListener('input', () => {
                currentUsersPage = 1;
                renderUsers(getFilteredUsers());
            });
        }

        if (userStatusFilter) {
            userStatusFilter.addEventListener('change', () => {
                currentUsersPage = 1;
                renderUsers(getFilteredUsers());
            });
        }

        if (userRoleFilter) {
            // Populate role filter
            userRoleFilter.innerHTML = '<option value="all">All Roles</option>';
            state.roles.filter(r => r.is_active).forEach(role => {
                userRoleFilter.innerHTML += `<option value="${role.id}">${escapeHtml(role.name)}</option>`;
            });

            userRoleFilter.addEventListener('change', () => {
                currentUsersPage = 1;
                renderUsers(getFilteredUsers());
            });
        }

        const usersPrevBtn = document.getElementById('rmUsersPrevBtn');
        const usersNextBtn = document.getElementById('rmUsersNextBtn');

        if (usersPrevBtn) {
            usersPrevBtn.addEventListener('click', () => {
                if (currentUsersPage > 1) {
                    currentUsersPage--;
                    renderUsers(getFilteredUsers());
                }
            });
        }

        if (usersNextBtn) {
            usersNextBtn.addEventListener('click', () => {
                const totalPages = Math.max(1, Math.ceil(getFilteredUsers().length / USER_ITEMS_PER_PAGE));
                if (currentUsersPage < totalPages) {
                    currentUsersPage++;
                    renderUsers(getFilteredUsers());
                }
            });
        }

        // Audit log filters
        const auditActionFilter = document.getElementById('auditActionFilter');
        if (auditActionFilter) {
            auditActionFilter.addEventListener('change', () => {
                applyAuditFilters();
            });
        }

        const auditDateFrom = document.getElementById('auditDateFrom');
        const auditDateTo = document.getElementById('auditDateTo');
        if (auditDateFrom) auditDateFrom.addEventListener('change', () => applyAuditFilters());
        if (auditDateTo) auditDateTo.addEventListener('change', () => applyAuditFilters());
    }

    function applyFilters() {
        const searchTerm = document.getElementById('roleSearch')?.value.toLowerCase() || '';
        const status = document.getElementById('roleStatusFilter')?.value || 'all';
        const type = document.getElementById('roleTypeFilter')?.value || 'all';

        let filtered = state.roles;

        // Search filter
        if (searchTerm) {
            filtered = filtered.filter(role => 
                role.name.toLowerCase().includes(searchTerm) ||
                (role.description && role.description.toLowerCase().includes(searchTerm))
            );
        }

        // Status filter
        if (status === 'active') {
            filtered = filtered.filter(r => r.is_active);
        } else if (status === 'inactive') {
            filtered = filtered.filter(r => !r.is_active);
        }

        // Type filter
        if (type === 'system') {
            filtered = filtered.filter(r => r.is_system);
        } else if (type === 'custom') {
            filtered = filtered.filter(r => !r.is_system);
        }

        renderFilteredRoles(filtered);
    }

    function applyAuditFilters() {
        const actionFilter = document.getElementById('auditActionFilter')?.value || 'all';
        const dateFrom = document.getElementById('auditDateFrom')?.value;
        const dateTo = document.getElementById('auditDateTo')?.value;

        let filtered = [...mockData.auditLog];

        // Action filter
        if (actionFilter !== 'all') {
            filtered = filtered.filter(log => log.action === actionFilter);
        }

        // Date filter
        if (dateFrom || dateTo) {
            filtered = filtered.filter(log => {
                const logDate = new Date(log.date);
                if (dateFrom && logDate < new Date(dateFrom)) return false;
                if (dateTo && logDate > new Date(dateTo + 'T23:59:59')) return false;
                return true;
            });
        }

        const auditBody = document.getElementById('auditLogBody');
        if (!auditBody) return;

        if (filtered.length === 0) {
            auditBody.innerHTML = '<tr><td colspan="5" class="rm-empty-state">No audit entries found</td></tr>';
            return;
        }

        auditBody.innerHTML = filtered.map(log => `
            <tr>
                <td>${log.date}</td>
                <td>
                    <span class="rm-audit-action-badge ${log.action.split('_')[0]}">
                        ${log.action.replace(/_/g, ' ')}
                    </span>
                </td>
                <td>${escapeHtml(log.entity)}</td>
                <td>${escapeHtml(log.user)}</td>
                <td>Change recorded</td>
            </tr>
        `).join('');
    }

    function renderFilteredRoles(roles) {
        const rolesList = document.getElementById('rolesList');
        if (!rolesList) return;

        if (roles.length === 0) {
            rolesList.innerHTML = '<div class="rm-empty-state"><h3>No roles found</h3><p>Try adjusting your search or filters</p></div>';
            return;
        }

        rolesList.innerHTML = roles.map(role => `
            <div class="rm-role-card ${role.is_system ? 'system' : ''}">
                <div class="rm-role-card-header">
                    <div>
                        <h3 class="rm-role-card-title">${escapeHtml(role.name)}</h3>
                        <div style="display: flex; gap: 8px; margin-top: 8px;">
                            ${role.is_system ? '<span class="rm-role-card-badge system">System</span>' : ''}
                            <span class="rm-role-card-badge ${role.is_active ? 'active' : 'inactive'}">
                                ${role.is_active ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                    </div>
                </div>
                <p class="rm-role-card-description">${escapeHtml(role.description || 'No description')}</p>
                <div class="rm-role-card-stats">
                    <div class="rm-role-card-stat">
                        <span class="rm-role-card-stat-value">${role.user_count || 0}</span>
                        <span class="rm-role-card-stat-label">Users</span>
                    </div>
                    <div class="rm-role-card-stat">
                        <span class="rm-role-card-stat-value">${role.permission_count || 0}</span>
                        <span class="rm-role-card-stat-label">Permissions</span>
                    </div>
                </div>
                <div class="rm-role-card-actions">
                    <button class="rm-role-card-action edit" onclick="editRole(${role.id})">Edit</button>
                    <button class="rm-role-card-action permissions" onclick="openRoleUserInfoModal(${role.id})">Add</button>
                    <button class="rm-role-card-action permissions" onclick="managePermissions(${role.id})">Permissions</button>
                    ${!role.is_system ? `<button class="rm-role-card-action delete" onclick="deleteRole(${role.id}, '${escapeHtml(role.name)}')">Delete</button>` : ''}
                </div>
            </div>
        `).join('');
    }

    // =====================================================
    // INITIALIZATION
    // =====================================================

    async function init() {
        initTabs();
        initRoleUserInfoModal();
        initRoleForm();
        initPermissionModal();
        initUserRoleForm();
        initSearchAndFilters();
        
        // Load initial data from the database
        await refreshRoles();
        await refreshUsers();

        loadPermissions();
    }

    // Start initialization
    init().catch(error => {
        console.error('Role management initialization failed:', error);
    });
});
