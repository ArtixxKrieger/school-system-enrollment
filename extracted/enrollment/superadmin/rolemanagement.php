
    <!-- Tabs Navigation -->
    <div class="rm-tabs">
        <button class="rm-tab active" data-tab="roles">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            Roles
        </button>
        <button class="rm-tab" data-tab="users">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            Users
        </button>
        <button class="rm-tab" data-tab="audit">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
            Audit Log
        </button>
    </div>

    <!-- Roles Tab Content -->
    <div class="rm-tab-content active" id="tabRoles">
        <!-- Statistics Cards -->
        <div class="rm-stats-grid">
            <div class="rm-stat-card">
                <div class="rm-stat-icon blue">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                        <circle cx="9" cy="7" r="4"></circle>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                </div>
                <div class="rm-stat-content">
                    <div class="rm-stat-value" id="totalRolesCount">0</div>
                    <div class="rm-stat-label">Total Roles</div>
                </div>
            </div>
            <div class="rm-stat-card">
                <div class="rm-stat-icon green">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                </div>
                <div class="rm-stat-content">
                    <div class="rm-stat-value" id="activeRolesCount">0</div>
                    <div class="rm-stat-label">Active Roles</div>
                </div>
            </div>
            <div class="rm-stat-card">
                <div class="rm-stat-icon purple">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                </div>
                <div class="rm-stat-content">
                    <div class="rm-stat-value" id="totalPermissionsCount">0</div>
                    <div class="rm-stat-label">Total Permissions</div>
                </div>
            </div>
            <div class="rm-stat-card">
                <div class="rm-stat-icon orange">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                        <circle cx="9" cy="7" r="4"></circle>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                </div>
                <div class="rm-stat-content">
                    <div class="rm-stat-value" id="totalUsersCount">0</div>
                    <div class="rm-stat-label">Users with Roles</div>
                </div>
            </div>
        </div>

        <!-- Search and Filters -->
        <div class="rm-filters">
            <div class="rm-search">
                <svg class="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.35-4.35"></path>
                </svg>
                <input type="text" id="roleSearch" placeholder="Search roles by name or description..." class="search-input">
            </div>
            <div class="rm-filter-group">
                <label>Status:</label>
                <select id="roleStatusFilter" class="filter-select">
                    <option value="all">All Roles</option>
                    <option value="active">Active Only</option>
                    <option value="inactive">Inactive Only</option>
                </select>
            </div>
            <div class="rm-filter-group">
                <label>Type:</label>
                <select id="roleTypeFilter" class="filter-select">
                    <option value="all">All Types</option>
                    <option value="system">System Roles</option>
                    <option value="custom">Custom Roles</option>
                </select>
            </div>
            <button type="button" class="btn-primary btn-add-role" id="btnAddRole">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                Add New Role
            </button>
        </div>

        <!-- Roles List -->
        <div class="rm-roles-grid" id="rolesList">
            <!-- Roles will be loaded dynamically -->
            <div class="rm-loading">Loading roles...</div>
        </div>
    </div>

    <!-- Users Tab Content -->
    <div class="rm-tab-content" id="tabUsers">
        <div class="rm-section-header" style="margin-bottom: 20px;">
            <div>
                <h2>Users</h2>
                <p>Assign roles to existing users and see which accounts are connected to each role.</p>
            </div>
            <button type="button" class="btn-primary btn-add-role" id="btnAssignRole">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                Assign Role
            </button>
        </div>

        <div class="rm-filters" style="margin-bottom: 16px; gap: 16px; flex-wrap: wrap;">
            <div class="rm-search" style="flex: 1;">
                <svg class="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.35-4.35"></path>
                </svg>
                <input type="text" id="userSearch" placeholder="Search users by name or email..." class="search-input">
            </div>
            <div class="rm-filter-group">
                <label>Status:</label>
                <select id="userStatusFilter" class="filter-select">
                    <option value="all">All Users</option>
                    <option value="active">Active Only</option>
                    <option value="inactive">Inactive Only</option>
                </select>
            </div>
            <div class="rm-filter-group">
                <label>Role:</label>
                <select id="userRoleFilter" class="filter-select">
                    <option value="all">All Roles</option>
                </select>
            </div>
        </div>

        <div id="usersList" class="rm-users-list">
            <div class="rm-loading">Loading users...</div>
        </div>

        <div class="rm-users-pagination" id="rmUsersPagination">
            <div class="rm-users-pagination-info">
                <span id="rmUsersPaginationInfo">Showing 0 of 0</span>
            </div>
            <div class="rm-users-pagination-controls">
                <button type="button" class="rm-users-pagination-btn" id="rmUsersPrevBtn" disabled>Previous</button>
                <div class="rm-users-pagination-pages" id="rmUsersPaginationPages"></div>
                <button type="button" class="rm-users-pagination-btn" id="rmUsersNextBtn" disabled>Next</button>
            </div>
        </div>
    </div>

    <!-- Audit Log Tab Content -->
    <div class="rm-tab-content" id="tabAudit">
        <div class="rm-audit-section">
            <div class="rm-section-header">
                <h2>Audit Log</h2>
                <p>Track all role and permission changes</p>
            </div>

            <div class="rm-audit-filters">
                <div class="rm-filter-group">
                    <label>Action Type:</label>
                    <select id="auditActionFilter" class="filter-select">
                        <option value="all">All Actions</option>
                        <option value="create_role">Create Role</option>
                        <option value="update_role">Update Role</option>
                        <option value="delete_role">Delete Role</option>
                        <option value="assign_role">Assign Role</option>
                        <option value="revoke_role">Revoke Role</option>
                        <option value="grant_permission">Grant Permission</option>
                        <option value="revoke_permission">Revoke Permission</option>
                    </select>
                </div>
                <div class="rm-filter-group">
                    <label>Date Range:</label>
                    <input type="date" id="auditDateFrom" class="filter-input">
                    <span>to</span>
                    <input type="date" id="auditDateTo" class="filter-input">
                </div>
            </div>

            <div class="rm-audit-table-container">
                <table class="rm-audit-table">
                    <thead>
                        <tr>
                            <th>Date & Time</th>
                            <th>Action</th>
                            <th>Entity</th>
                            <th>User</th>
                            <th>Details</th>
                        </tr>
                    </thead>
                    <tbody id="auditLogBody">
                        <tr>
                            <td colspan="5" class="rm-loading">Loading audit log...</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</div>

<!-- Role Modal -->
<div class="rm-modal" id="roleModal">
    <div class="rm-modal-overlay"></div>
    <div class="rm-modal-content">
        <div class="rm-modal-header">
            <h2 id="roleModalTitle">Add New Role</h2>
            <button class="rm-modal-close" id="closeRoleModal">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
        </div>
        <div class="rm-modal-body">
            <form id="roleForm">
                <input type="hidden" id="roleId" name="id">
                
                <div class="rm-form-group">
                    <label for="roleName">Role Name <span class="required">*</span></label>
                    <input type="text" id="roleName" name="name" class="rm-form-input" required>
                </div>

                <div class="rm-form-group">
                    <label for="roleDescription">Description</label>
                    <textarea id="roleDescription" name="description" class="rm-form-input" rows="3"></textarea>
                </div>

                <div class="rm-form-group">
                    <label class="rm-checkbox-label">
                        <input type="checkbox" id="roleIsActive" name="is_active" checked>
                        <span>Active</span>
                    </label>
                </div>

                <!-- Role Template (for auto-filling name/description only) -->
                <div class="rm-form-group" style="margin-top: 24px; padding-top: 24px; border-top: 2px solid #e5e7eb;">
                    <label class="rm-template-label">Role Template (Optional):</label>
                    <p style="font-size: 13px; color: #6b7280; margin-bottom: 12px;">Select a template to auto-fill role details. Permissions can be configured later from each role.</p>
                    <select id="roleTemplate" class="rm-form-input">
                        <option value="">-- Select Template (Optional) --</option>
                        <option value="super_admin">Super Admin - Full Access</option>
                        <option value="admin">Admin - Edit/Add/View/Delete (No Role Management)</option>
                        <option value="staff">Staff - Edit/View (Schedule, Enrollment, Menu Only)</option>
                        <option value="professor">Professor - Schedule Management, Dashboard, Students, Curriculum, Offer and Offered</option>
                        <option value="student">Student - View Only (Dashboard, Offer and Offered)</option>
                    </select>
                </div>
            </form>
        </div>
        <div class="rm-modal-footer">
            <button type="button" class="btn-secondary" id="cancelRoleModal">Cancel</button>
            <button type="button" class="btn-primary" id="saveRole">Save Role</button>
        </div>
    </div>
</div>

<!-- Permission Matrix Modal -->
<div class="rm-modal" id="permissionModal">
    <div class="rm-modal-overlay"></div>
    <div class="rm-modal-content rm-modal-large">
        <div class="rm-modal-header">
            <h2 id="permissionModalTitle">Manage Permissions</h2>
            <button class="rm-modal-close" id="closePermissionModal">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
        </div>
        <div class="rm-modal-body">
            <div style="display:flex; gap:8px; margin-bottom:12px;">
                <button type="button" class="btn-secondary" id="modalSelectAll" style="font-size:13px; padding:6px 14px;">Select All</button>
                <button type="button" class="btn-secondary" id="modalDeselectAll" style="font-size:13px; padding:6px 14px;">Deselect All</button>
                <button type="button" class="btn-secondary" id="modalViewOnly" style="font-size:13px; padding:6px 14px;">View Only</button>
            </div>
            <div id="permissionMatrixContent">
                <!-- Permission matrix will be loaded here -->
            </div>
        </div>
        <div class="rm-modal-footer">
            <button type="button" class="btn-secondary" id="cancelPermissionModal">Cancel</button>
            <button type="button" class="btn-primary" id="savePermissions">Save Permissions</button>
        </div>
    </div>
</div>

<!-- User Role Assignment Modal -->
<div class="rm-modal" id="userRoleModal">
    <div class="rm-modal-overlay"></div>
    <div class="rm-modal-content">
        <div class="rm-modal-header">
            <h2>Assign Role to User</h2>
            <button class="rm-modal-close" id="closeUserRoleModal">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
        </div>
        <div class="rm-modal-body">
            <form id="userRoleForm">
                <div class="rm-form-group">
                    <label for="assignUserId">User</label>
                    <select id="assignUserId" class="rm-form-input" required>
                        <option value="">-- Select User --</option>
                    </select>
                </div>

                <div class="rm-form-group">
                    <label for="assignRoleId">Role</label>
                    <select id="assignRoleId" class="rm-form-input" required>
                        <option value="">-- Select Role --</option>
                    </select>
                </div>
            </form>
        </div>
        <div class="rm-modal-footer">
            <button type="button" class="btn-secondary" id="cancelUserRoleModal">Cancel</button>
            <button type="button" class="btn-primary" id="saveUserRole">Save Assignment</button>
        </div>
    </div>
</div>

<!-- Role User Information Modal -->
<div class="rm-modal" id="roleUserInfoModal">
    <div class="rm-modal-overlay"></div>
    <div class="rm-modal-content rm-modal-large">
        <div class="rm-modal-header">
            <h2 id="roleUserInfoTitle">Add Role User</h2>
            <button class="rm-modal-close" id="closeRoleUserInfoModal">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
        </div>
        <div class="rm-modal-body">
            <form id="roleUserForm">
                <input type="hidden" id="roleUserRoleId">
                <input type="hidden" id="roleUserRoleName">
                <input type="hidden" id="roleUserUserId" value="">

                <div class="rm-profile-preview">
                    <div class="rm-profile-preview-grid">
                        <div class="rm-profile-card rm-profile-edit-card">
                            <div class="rm-profile-avatar-edit" id="roleUserAvatarPreview">
                                <img id="roleUserAvatarImage" alt="Profile photo" style="display:none;">
                                <div class="rm-profile-avatar-fallback" id="roleUserAvatarFallback">U</div>
                                <div class="rm-avatar-edit-overlay" id="roleUserAvatarOverlay" title="Upload a profile photo">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M12 5v14"></path>
                                        <path d="M5 12h14"></path>
                                    </svg>
                                </div>
                            </div>
                            <input type="file" id="roleUserPhotoInput" accept="image/*" hidden>
                            <button type="button" class="btn-secondary rm-change-photo-btn" id="roleUserChangePhotoBtn">Change Photo</button>
                            <div class="rm-profile-edit-details">
                                <h3 id="roleUserPreviewName">New User</h3>
                                <p id="roleUserPreviewRole">Selected Role</p>
                                <p class="rm-profile-edit-note" id="roleUserPreviewId">ID: —</p>
                            </div>
                        </div>

                        <div class="rm-profile-form-card">
                            <div class="rm-profile-section-block">
                                <div class="rm-section-heading">
                                    <h4>Personal Information</h4>
                                    <p id="roleUserHint">Fill in the profile details for the selected role.</p>
                                </div>

                                <div class="rm-form-group">
                                    <label for="roleUserFullName">Name</label>
                                    <input type="text" id="roleUserFullName" class="rm-form-input" placeholder="Enter full name" required>
                                </div>

                                <div class="rm-profile-form-grid-two">
                                    <div class="rm-form-group">
                                        <label for="roleUserIdNumber">ID Number</label>
                                        <input type="text" id="roleUserIdNumber" class="rm-form-input" placeholder="Enter ID number" required>
                                    </div>
                                    <div class="rm-form-group">
                                        <label for="roleUserGender">Gender</label>
                                        <select id="roleUserGender" class="rm-form-input">
                                            <option value="">Select gender</option>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                </div>

                                <div class="rm-form-group">
                                    <label for="roleUserBirthDate">Birthday</label>
                                    <input type="date" id="roleUserBirthDate" class="rm-form-input">
                                </div>
                            </div>

                            <div class="rm-profile-section-block">
                                <div class="rm-section-heading">
                                    <h4>Contact Information</h4>
                                    <p>Enter the contact details and address.</p>
                                </div>

                                <div class="rm-profile-form-grid-two">
                                    <div class="rm-form-group">
                                        <label for="roleUserEmail">Email</label>
                                        <input type="email" id="roleUserEmail" class="rm-form-input" placeholder="Optional email">
                                    </div>
                                    <div class="rm-form-group">
                                        <label for="roleUserPhone">Contact Info</label>
                                        <input type="text" id="roleUserPhone" class="rm-form-input" placeholder="Phone or mobile number">
                                    </div>
                                </div>

                                <div class="rm-form-group">
                                    <label for="roleUserAddress">Address</label>
                                    <textarea id="roleUserAddress" class="rm-form-input" rows="3" placeholder="Enter address"></textarea>
                                </div>
                            </div>

                            <div class="rm-profile-section-block">
                                <div class="rm-section-heading">
                                    <h4>Security</h4>
                                    <p>Leave the password blank to use the default for the selected role.</p>
                                </div>

                                <div class="rm-profile-form-grid-two">
                                    <div class="rm-form-group">
                                        <label for="roleUserPassword">Password</label>
                                        <input type="password" id="roleUserPassword" class="rm-form-input" placeholder="Default password will be used">
                                    </div>
                                    <div class="rm-form-group">
                                        <label for="roleUserConfirmPassword">Confirm Password</label>
                                        <input type="password" id="roleUserConfirmPassword" class="rm-form-input" placeholder="Confirm password">
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </div>
        <div class="rm-modal-footer">
            <button type="button" class="btn-secondary" id="cancelRoleUserInfoModal">Cancel</button>
            <button type="button" class="btn-primary" id="saveRoleUserButton">Save User</button>
        </div>
    </div>
</div>

<!-- Confirmation Modal -->
<div class="rm-modal" id="confirmModal">
    <div class="rm-modal-overlay"></div>
    <div class="rm-modal-content rm-modal-small">
        <div class="rm-modal-header">
            <h2 id="confirmModalTitle">Confirm Action</h2>
        </div>
        <div class="rm-modal-body">
            <p id="confirmModalMessage">Are you sure you want to perform this action?</p>
        </div>
        <div class="rm-modal-footer">
            <button type="button" class="btn-secondary" id="cancelConfirm">Cancel</button>
            <button type="button" class="btn-danger" id="confirmAction">Confirm</button>
        </div>
    </div>
</div>
