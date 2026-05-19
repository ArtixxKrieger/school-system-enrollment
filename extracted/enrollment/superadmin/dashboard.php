<div class="dashboard-container">
    <div class="profile-container">
        <div class="profile-section">
            <div class="profile-card">
                <div class="profile-avatar" id="dashboardProfileAvatar">
                    <img id="dashboardProfileAvatarImg" class="profile-avatar-img" alt="Profile photo" aria-hidden="true">
                    <div class="profile-avatar-fallback" id="dashboardProfileFallback"></div>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                </div>
                <div class="profile-info">
                    <h2 class="profile-name" id="profileName">Loading...</h2>
                    <div class="profile-details">
                        <div class="profile-detail" id="profileRole">
                            <span class="detail-label">Role:</span>
                            <span class="detail-value">Loading...</span>
                        </div>
                        <div class="profile-detail" id="profileId">
                            <span class="detail-label">ID:</span>
                            <span class="detail-value">Loading...</span>
                        </div>
                        <div class="profile-detail" id="profileYearLevel" style="display: none;">
                            <span class="detail-label">Year Level:</span>
                            <span class="detail-value">Loading...</span>
                        </div>
                        <div class="profile-detail" id="profileCourse" style="display: none;">
                            <span class="detail-label">Course:</span>
                            <span class="detail-value">Loading...</span>
                        </div>
                        <div class="profile-detail" id="profileSemester" style="display: none;">
                            <span class="detail-label">Semester:</span>
                            <span class="detail-value">Loading...</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="stats-grid">
        <div class="stat-card">
            <div class="stat-icon blue">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
                    <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
                </svg>
            </div>
            <div class="stat-content">
                <h3>Total Students</h3>
                <p class="stat-value" id="dashboardTotalStudents">—</p>
                <span class="stat-change positive">Active student records</span>
            </div>
        </div>

        <div class="stat-card">
            <div class="stat-icon green">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path>
                </svg>
            </div>
            <div class="stat-content">
                <h3>Active Courses</h3>
                <p class="stat-value" id="dashboardActiveCourses">—</p>
                <span class="stat-change positive">Configured programs</span>
            </div>
        </div>

        <div class="stat-card">
            <div class="stat-icon purple">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <line x1="19" x2="19" y1="8" y2="14"></line>
                    <line x1="22" x2="16" y1="11" y2="11"></line>
                </svg>
            </div>
            <div class="stat-content">
                <h3>Pending Enrollees</h3>
                <p class="stat-value" id="dashboardPendingEnrollees">—</p>
                <span class="stat-change positive">Awaiting review</span>
            </div>
        </div>

        <div class="stat-card">
            <div class="stat-icon orange">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
            </div>
            <div class="stat-content">
                <h3>Enrolled Students</h3>
                <p class="stat-value" id="dashboardEnrolledStudents">—</p>
                <span class="stat-change neutral">Currently active</span>
            </div>
        </div>
    </div>

    <?php if (current_user_role() !== 'student'): ?>
    <div class="dashboard-insight-grid">
        <section class="activity-section">
            <div class="dashboard-section-heading">
                <div>
                    <h3 class="section-title">Enrollment Snapshot</h3>
                    <p class="section-subtitle">Track the movement from inquiry to active enrollment.</p>
                </div>
            </div>
            <div class="dashboard-metric-list">
                <div class="dashboard-metric-row">
                    <span>Pre-Registered</span>
                    <strong id="dashboardPreRegistered">—</strong>
                </div>
                <div class="dashboard-metric-row">
                    <span>Approved</span>
                    <strong id="dashboardApprovedCount">—</strong>
                </div>
                <div class="dashboard-metric-row">
                    <span>Registered</span>
                    <strong id="dashboardRegisteredCount">—</strong>
                </div>
                <div class="dashboard-metric-row">
                    <span>Enrolled Students</span>
                    <strong id="dashboardSnapshotEnrolled">—</strong>
                </div>
            </div>
        </section>

        <section class="activity-section">
            <div class="dashboard-section-heading">
                <div>
                    <h3 class="section-title">Action Required</h3>
                    <p class="section-subtitle">Items that need immediate superadmin attention.</p>
                </div>
            </div>
            <div class="dashboard-metric-list">
                <div class="dashboard-metric-row">
                    <span>Pending approvals</span>
                    <strong id="dashboardPendingApprovals">—</strong>
                </div>
                <div class="dashboard-metric-row">
                    <span>Courses near full</span>
                    <strong id="dashboardNearCapacity">—</strong>
                </div>
                <div class="dashboard-metric-row">
                    <span>Remaining seats</span>
                    <strong id="dashboardRemainingCapacity">—</strong>
                </div>
                <div class="dashboard-metric-row">
                    <span>Programs with students</span>
                    <strong id="dashboardActivePrograms">—</strong>
                </div>
            </div>
        </section>
    </div>

    <div class="dashboard-insight-grid">
        <section class="activity-section">
            <div class="dashboard-section-heading">
                <div>
                    <h3 class="section-title">Academic Overview</h3>
                    <p class="section-subtitle">Current student distribution by program.</p>
                </div>
            </div>
            <div class="curriculum-program-list" id="dashboardProgramBreakdown">
                <p class="activity-empty">Loading program distribution...</p>
            </div>
        </section>

        <section class="activity-section">
            <div class="dashboard-section-heading">
                <div>
                    <h3 class="section-title">Year Level Distribution</h3>
                    <p class="section-subtitle">See how students are spread across each year level.</p>
                </div>
            </div>
            <div class="curriculum-program-list" id="dashboardYearLevelBreakdown">
                <p class="activity-empty">Loading year level data...</p>
            </div>
        </section>
    </div>

    <div class="dashboard-curriculum-grid">
        <section class="activity-section curriculum-overview-card">
            <div class="dashboard-section-heading">
                <div>
                    <h3 class="section-title">Curriculum Overview</h3>
                    <p class="section-subtitle">Live subject setup by program, year, and semester.</p>
                </div>
            </div>

            <div class="curriculum-summary-grid">
                <div class="curriculum-summary-item">
                    <span class="curriculum-summary-label">Subjects</span>
                    <strong id="dashboardCurriculumSubjects">—</strong>
                </div>
                <div class="curriculum-summary-item">
                    <span class="curriculum-summary-label">Programs</span>
                    <strong id="dashboardCurriculumPrograms">—</strong>
                </div>
                <div class="curriculum-summary-item">
                    <span class="curriculum-summary-label">Blocks</span>
                    <strong id="dashboardCurriculumBlocks">—</strong>
                </div>
                <div class="curriculum-summary-item">
                    <span class="curriculum-summary-label">1st / 2nd Sem</span>
                    <strong id="dashboardCurriculumCoverage">—</strong>
                </div>
            </div>

            <div class="curriculum-tags" id="dashboardCurriculumHighlights">
                <span class="curriculum-chip muted">Loading curriculum setup...</span>
            </div>
        </section>

        <section class="activity-section curriculum-overview-card">
            <div class="dashboard-section-heading">
                <div>
                    <h3 class="section-title" id="dashboardCurriculumListTitle">Curriculum by Program</h3>
                    <p class="section-subtitle" id="dashboardCurriculumListSubtitle">Recent configured year and semester blocks.</p>
                </div>
            </div>

            <div class="curriculum-program-list" id="dashboardCurriculumList">
                <p class="activity-empty">Loading curriculum data...</p>
            </div>
        </section>
    </div>
    <?php endif; ?>

</div>