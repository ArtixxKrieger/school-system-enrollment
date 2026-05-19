<aside class="sidebar" id="sidebar">
    <div class="sidebar-header">
        <div class="logo-container">
            <div class="logo-icon">
                <img src="superadmin/assets/img/logo.jpg" alt="Kurios Enrollment Logo">
            </div>
            <div class="logo-text">
                <h1>KURIOS ENROLLMENT</h1>
                <p>SYSTEM</p>
            </div>
        </div>
        <button class="sidebar-collapse-btn" id="sidebarCollapseBtn" title="Collapse sidebar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M15 18l-6-6 6-6"/>
            </svg>
        </button>
    </div>

    <?php
        $canView = $canViewModule ?? static fn(string $module): bool => false;
        $hasStudentsSection  = $canView('student') || $canView('course');
        $hasEnrollmentSection = $canView('enrollees') || $canView('enrollment');
        $hasAcademicsSection = $canView('curriculum') || $canView('subjects');
        $hasSystemSection = $canView('settings') || $canView('rolemanagement');
        $appUrl = $appBaseUrl ?? 'app';
        $logoutUrl = (isset($appBasePath) ? $appBasePath : '') . '/?logout=1';

        $studentsActive   = in_array($page, ['student', 'course']);
        $enrollmentActive = in_array($page, ['enrollees', 'enrollment']);
        $academicsActive  = in_array($page, ['curriculum', 'offer', 'offered', 'subjects', 'curriculum-1st', 'curriculum-2nd', 'curriculum-3rd', 'curriculum-4th']);
        $systemActive     = in_array($page, ['settings', 'management', 'notification', 'enrollmentsettings', 'security']);
    ?>
    <nav class="sidebar-nav">
        <div class="nav-heading">NAVIGATION</div>

        <a data-label="Dashboard" href="<?php echo htmlspecialchars($appUrl, ENT_QUOTES, 'UTF-8'); ?>/dashboard" class="nav-item <?php echo $page == 'dashboard' ? 'active' : ''; ?>">
            <svg class="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
            <span>Dashboard</span>
        </a>

        <?php if ($hasStudentsSection): ?>
        <button data-label="Students" data-group="students" class="nav-item nav-toggle <?php echo $studentsActive ? 'open' : ''; ?>">
            <svg class="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            <span>Students</span>
            <svg class="chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 18l6-6-6-6"/>
            </svg>
        </button>
        <div class="nav-submenu <?php echo $studentsActive ? 'open' : ''; ?>">
            <?php if ($canView('student')): ?>
            <a data-label="Master List" href="<?php echo htmlspecialchars($appUrl, ENT_QUOTES, 'UTF-8'); ?>/student" class="nav-item submenu-item <?php echo $page == 'student' ? 'active' : ''; ?>">
                <span>Master List</span>
            </a>
            <?php endif; ?>
            <?php if ($canView('course')): ?>
            <a data-label="Courses" href="<?php echo htmlspecialchars($appUrl, ENT_QUOTES, 'UTF-8'); ?>/course" class="nav-item submenu-item <?php echo $page == 'course' ? 'active' : ''; ?>">
                <span>Courses</span>
            </a>
            <?php endif; ?>
        </div>
        <?php endif; ?>

        <?php if ($hasEnrollmentSection): ?>
        <button data-label="Enrollment" data-group="enrollment" class="nav-item nav-toggle <?php echo $enrollmentActive ? 'open' : ''; ?>">
            <svg class="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            <span>Enrollment</span>
            <svg class="chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 18l6-6-6-6"/>
            </svg>
        </button>
        <div class="nav-submenu <?php echo $enrollmentActive ? 'open' : ''; ?>">
            <?php if ($canView('enrollees')): ?>
            <a data-label="Enrolees" href="<?php echo htmlspecialchars($appUrl, ENT_QUOTES, 'UTF-8'); ?>/enrollees" class="nav-item submenu-item <?php echo $page == 'enrollees' ? 'active' : ''; ?>">
                <span>Enrolees</span>
            </a>
            <?php endif; ?>
            <?php if ($canView('enrollment')): ?>
            <a data-label="Enrolled" href="<?php echo htmlspecialchars($appUrl, ENT_QUOTES, 'UTF-8'); ?>/enrollment" class="nav-item submenu-item <?php echo $page == 'enrollment' ? 'active' : ''; ?>">
                <span>Enrolled</span>
            </a>
            <?php endif; ?>
        </div>
        <?php endif; ?>

        <?php if ($hasAcademicsSection): ?>
        <button data-label="Academics" data-group="academics" class="nav-item nav-toggle <?php echo $academicsActive ? 'open' : ''; ?>">
            <svg class="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
                <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
            </svg>
            <span>Academics</span>
            <svg class="chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 18l6-6-6-6"/>
            </svg>
        </button>
        <div class="nav-submenu <?php echo $academicsActive ? 'open' : ''; ?>">
            <?php if ($canView('curriculum') && current_user_role() !== 'student'): ?>
            <a data-label="Curriculum" href="<?php echo htmlspecialchars($appUrl, ENT_QUOTES, 'UTF-8'); ?>/curriculum" class="nav-item submenu-item <?php echo ($page == 'curriculum' || $page == 'curriculum-1st' || $page == 'curriculum-2nd' || $page == 'curriculum-3rd' || $page == 'curriculum-4th') ? 'active' : ''; ?>">
                <span>Curriculum</span>
            </a>
            <?php endif; ?>
            <?php if ($canView('subjects')): ?>
            <a data-label="Offer" href="<?php echo htmlspecialchars($appUrl, ENT_QUOTES, 'UTF-8'); ?>/offer" class="nav-item submenu-item <?php echo ($page == 'offer' || $page == 'subjects') ? 'active' : ''; ?>">
                <span><?php echo current_user_role() === 'student' ? 'Offer / Enroll' : 'Offer'; ?></span>
            </a>
            <a data-label="Offered" href="<?php echo htmlspecialchars($appUrl, ENT_QUOTES, 'UTF-8'); ?>/offered" class="nav-item submenu-item <?php echo $page == 'offered' ? 'active' : ''; ?>">
                <span><?php echo current_user_role() === 'student' ? 'My Offered' : 'Offered'; ?></span>
            </a>
            <?php endif; ?>
        </div>
        <?php endif; ?>

        <?php if ($hasSystemSection): ?>
        <button data-label="Settings" data-group="system" class="nav-item nav-toggle <?php echo $systemActive ? 'open' : ''; ?>">
            <svg class="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
                <circle cx="12" cy="12" r="3"></circle>
            </svg>
            <span>System Control</span>
            <svg class="chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 18l6-6-6-6"/>
            </svg>
        </button>
        <div class="nav-submenu <?php echo $systemActive ? 'open' : ''; ?>">
            <?php if ($canView('settings')): ?>
            <a data-label="Settings" href="<?php echo htmlspecialchars($appUrl, ENT_QUOTES, 'UTF-8'); ?>/settings" class="nav-item submenu-item <?php echo $page == 'settings' ? 'active' : ''; ?>">
                <span>Settings</span>
            </a>
            <?php endif; ?>
            <?php if ($canView('rolemanagement')): ?>
            <a data-label="Role Management" href="<?php echo htmlspecialchars($appUrl, ENT_QUOTES, 'UTF-8'); ?>/management" class="nav-item submenu-item <?php echo $page == 'management' ? 'active' : ''; ?>">
                <span>Role Management</span>
            </a>
            <?php endif; ?>
        </div>
        <?php endif; ?>

    </nav>

    <div class="sidebar-footer">
        <a data-label="Logout" href="<?php echo htmlspecialchars($logoutUrl, ENT_QUOTES, 'UTF-8'); ?>" class="nav-item nav-logout">
            <svg class="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            <span>Logout</span>
        </a>
    </div>
</aside>