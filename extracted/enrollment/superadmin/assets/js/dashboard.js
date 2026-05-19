document.addEventListener('DOMContentLoaded', function() {
    console.log('✓ Dashboard JS Loaded');

    let currentUserRole = 'admin';
    if (window.SharedData && window.SharedData.currentUserRole) {
        currentUserRole = window.SharedData.currentUserRole;
    } else if (window.AppUser && window.AppUser.role) {
        currentUserRole = String(window.AppUser.role).toLowerCase().replace(/[^a-z0-9]/g, '');
    }

    if (currentUserRole === 'super_admin') {
        currentUserRole = 'superadmin';
    }

    const isAdmin = currentUserRole === 'superadmin' || currentUserRole === 'admin';

    function getProfileOverrides() {
        const key = `profile-settings-${String(window.AppUser && (window.AppUser.userId || window.AppUser.id) || 'guest')}`;
        try {
            const stored = localStorage.getItem(key);
            return stored ? JSON.parse(stored) : {};
        } catch (error) {
            console.warn('Failed to load profile overrides', error);
            return {};
        }
    }

    function getInitials(name) {
        if (!name) return 'U';
        return name
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map(part => part[0].toUpperCase())
            .join('') || 'U';
    }

    function escapeHtml(value) {
        const div = document.createElement('div');
        div.textContent = value == null ? '' : String(value);
        return div.innerHTML;
    }

    function formatCount(value) {
        const number = Number(value || 0);
        return Number.isFinite(number) ? number.toLocaleString() : '0';
    }

    function setMetricValue(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = formatCount(value);
        }
    }

    function renderSummaryList(elementId, items, emptyText) {
        const element = document.getElementById(elementId);
        if (!element) {
            return;
        }

        if (!Array.isArray(items) || !items.length) {
            element.innerHTML = `<p class="activity-empty">${escapeHtml(emptyText)}</p>`;
            return;
        }

        element.innerHTML = items.map(item => (
            '<div class="curriculum-program-item">' +
                '<div>' +
                    `<strong>${escapeHtml(item.label)}</strong>` +
                    `<div class="curriculum-program-meta">${escapeHtml(item.meta || '')}</div>` +
                '</div>' +
                `<div class="curriculum-program-count">${escapeHtml(formatCount(item.value))}</div>` +
            '</div>'
        )).join('');
    }

    function formatSemesterLabel(value) {
        const semester = Number(value);
        if (semester === 1) return '1st Semester';
        if (semester === 2) return '2nd Semester';
        return 'All Semesters';
    }

    const hasSharedData = window.SharedData && typeof window.SharedData.getDashboardStats === 'function';
    if (!hasSharedData) {
        console.warn('SharedData not loaded, using fallback data');
    }

    if (currentUserRole === 'student') {
        const statsGrid = document.querySelector('.stats-grid');
        if (statsGrid) {
            statsGrid.style.display = 'none';
        }
    }
    
    // Refresh session data for students to get latest year_level and current_semester
    function refreshStudentSession() {
        if (currentUserRole !== 'student') {
            return Promise.resolve();
        }

        return fetch('api/refresh_session.php', { 
            credentials: 'same-origin',
            method: 'GET'
        })
        .then(response => response.json())
        .then(data => {
            if (data.ok && data.refreshed && data.user) {
                // Update window.AppUser with fresh data
                if (window.AppUser) {
                    window.AppUser.year_level = data.user.year_level;
                    window.AppUser.current_semester = data.user.current_semester;
                    window.AppUser.course_code = data.user.course_code;
                    window.AppUser.profile_photo = data.user.profile_photo;
                    window.AppUser.progression_status = data.user.progression_status || 'enrolled';
                }
                console.log('Session refreshed:', data.user.year_level, 'Sem', data.user.current_semester, 'Status:', data.user.progression_status);
            }
        })
        .catch(error => {
            console.warn('Failed to refresh session:', error);
        });
    }
    
    // Update profile information
    function updateProfileInfo() {
        const profileNameFromUser = window.AppUser ? String(window.AppUser.fullName || window.AppUser.name || 'User').trim() : 'User';
        const profileIdFromUser = window.AppUser ? String(window.AppUser.userId || window.AppUser.id || 'N/A') : 'N/A';
        const profileYearLevelFromUser = window.AppUser ? String(window.AppUser.year_level || window.AppUser.yearLevel || window.AppUser.currentYearLevel || window.AppUser.year || '').trim() : '';
        const profileCourseFromUser = window.AppUser ? String(window.AppUser.course_code || window.AppUser.courseCode || window.AppUser.course || '').trim() : '';
        const profileSemesterFromUser = window.AppUser ? String(window.AppUser.current_semester || window.AppUser.semester || window.AppUser.currentSemester || '').trim() : '';
        const profileOverrides = getProfileOverrides();
        const effectiveProfileName = profileOverrides.fullName || profileNameFromUser || 'User';
        const effectiveProfileRole = profileOverrides.role || (window.AppUser ? String(window.AppUser.role || 'User') : 'User');
        const profilePhotoFromUser = window.AppUser ? window.AppUser.photo || window.AppUser.profile_photo || null : null;
        const profilePhotoFromOverrides = profileOverrides.photo || profilePhotoFromUser || null;

        const profileName = document.getElementById('profileName');
        const profileRole = document.getElementById('profileRole');
        const profileId = document.getElementById('profileId');
        const profileYearLevel = document.getElementById('profileYearLevel');
        const profileCourse = document.getElementById('profileCourse');
        const profileSemester = document.getElementById('profileSemester');
        const dashboardAvatar = document.getElementById('dashboardProfileAvatar');
        const dashboardAvatarImg = document.getElementById('dashboardProfileAvatarImg');
        const dashboardAvatarFallback = document.getElementById('dashboardProfileFallback');

        if (!profileName || !profileRole || !profileId) return;

        // Hide student-specific fields by default
        if (profileYearLevel) profileYearLevel.style.display = 'none';
        if (profileCourse) profileCourse.style.display = 'none';
        if (profileSemester) profileSemester.style.display = 'none';

        if (isAdmin) {
            // ADMIN / SUPERADMIN Profile
            profileName.textContent = effectiveProfileName || 'Administrator';
            profileRole.querySelector('.detail-value').textContent = currentUserRole === 'superadmin' ? 'Super Admin' : 'Admin';
            profileId.querySelector('.detail-value').textContent = profileIdFromUser || (currentUserRole === 'superadmin' ? 'SA-001' : 'ADM-001');
        } else if (currentUserRole === 'student') {
            // STUDENT Profile
            profileName.textContent = effectiveProfileName || 'Student';
            profileRole.querySelector('.detail-value').textContent = 'Student';
            profileId.querySelector('.detail-value').textContent = profileIdFromUser || 'N/A';

            // Show student-specific fields if available
            if (profileYearLevel && profileYearLevelFromUser) {
                profileYearLevel.style.display = 'block';
                profileYearLevel.querySelector('.detail-value').textContent = profileYearLevelFromUser;
            }
            if (profileCourse && profileCourseFromUser) {
                profileCourse.style.display = 'block';
                profileCourse.querySelector('.detail-value').textContent = profileCourseFromUser;
            }
            if (profileSemester && profileSemesterFromUser) {
                profileSemester.style.display = 'block';
                profileSemester.querySelector('.detail-value').textContent = profileSemesterFromUser;
            }
        } else if (currentUserRole === 'staff') {
            // STAFF Profile
            profileName.textContent = effectiveProfileName || 'Staff Member';
            profileRole.querySelector('.detail-value').textContent = 'Staff';
            profileId.querySelector('.detail-value').textContent = profileIdFromUser || 'N/A';
        } else if (currentUserRole === 'professor') {
            // PROFESSOR Profile
            profileName.textContent = effectiveProfileName || 'Professor';
            profileRole.querySelector('.detail-value').textContent = 'Professor';
            profileId.querySelector('.detail-value').textContent = profileIdFromUser || 'N/A';
        } else {
            // Default fallback
            profileName.textContent = effectiveProfileName || 'User';
            profileRole.querySelector('.detail-value').textContent = effectiveProfileRole || currentUserRole || 'Unknown';
            profileId.querySelector('.detail-value').textContent = profileIdFromUser || 'N/A';
        }

        if (dashboardAvatar && dashboardAvatarImg && dashboardAvatarFallback) {
            if (profilePhotoFromOverrides) {
                dashboardAvatarImg.src = profilePhotoFromOverrides;
                dashboardAvatarImg.style.display = 'block';
                dashboardAvatarImg.setAttribute('aria-hidden', 'false');
                dashboardAvatarFallback.style.display = 'none';
                dashboardAvatar.classList.add('has-image');
            } else {
                dashboardAvatarImg.style.display = 'none';
                dashboardAvatarImg.removeAttribute('src');
                dashboardAvatarImg.setAttribute('aria-hidden', 'true');
                dashboardAvatarFallback.style.display = 'flex';
                dashboardAvatarFallback.textContent = getInitials(effectiveProfileName || profileNameFromUser || 'User');
                dashboardAvatar.classList.remove('has-image');
            }
        }
    }

    function refreshProfileData() {
        updateProfileInfo();
    }

    window.addEventListener('appUserUpdated', refreshProfileData);
    window.addEventListener('profileDataUpdated', refreshProfileData);
    
    // Update dashboard statistics
    function updateDashboardStats() {
        if (!hasSharedData) {
            return;
        }

        const stats = window.SharedData.getDashboardStats(currentUserRole);

        if (isAdmin) {
            setMetricValue('dashboardTotalStudents', stats.totalStudents || 0);
            setMetricValue('dashboardActiveCourses', stats.activeCourses || 0);
            setMetricValue('dashboardPendingEnrollees', stats.pendingEnrollments || 0);
            setMetricValue('dashboardEnrolledStudents', stats.totalEnrolled || 0);
        } else if (currentUserRole === 'staff') {
            setMetricValue('dashboardTotalStudents', stats.enrolledStudents || 0);
            setMetricValue('dashboardActiveCourses', stats.schedules || 0);
            setMetricValue('dashboardPendingEnrollees', stats.pendingEnrollments || 0);
            setMetricValue('dashboardEnrolledStudents', stats.enrolledStudents || 0);
        } else if (currentUserRole === 'professor') {
            setMetricValue('dashboardTotalStudents', stats.myStudents || 0);
            setMetricValue('dashboardActiveCourses', stats.myClasses || 0);
            setMetricValue('dashboardPendingEnrollees', stats.schedule || 0);
            setMetricValue('dashboardEnrolledStudents', 0);
        } else if (currentUserRole === 'student') {
            setMetricValue('dashboardTotalStudents', stats.myEnrollments || 0);
            setMetricValue('dashboardActiveCourses', stats.mySchedule || 0);
            setMetricValue('dashboardPendingEnrollees', stats.announcements || 0);
            setMetricValue('dashboardEnrolledStudents', 0);
        }

        // Only load admin/staff data for non-students
        if (currentUserRole !== 'student') {
            loadEnrollmentSnapshot();
            loadOperationalOverview();
        }
    }

    function updateStatCard(label, value) {
        const statCards = document.querySelectorAll('.stat-card');

        statCards.forEach((card) => {
            const cardLabel = card.querySelector('h3');
            if (cardLabel && cardLabel.textContent.trim() === label) {
                const statValue = card.querySelector('.stat-value, .stat-number');
                if (statValue) {
                    statValue.textContent = formatCount(value);
                }
            }
        });
    }

    function loadEnrollmentSnapshot() {
        const sharedStats = hasSharedData ? window.SharedData.getDashboardStats(currentUserRole) : {};
        setMetricValue('dashboardSnapshotEnrolled', sharedStats.totalEnrolled || sharedStats.enrolledStudents || 0);
        setMetricValue('dashboardPendingApprovals', sharedStats.pendingEnrollments || 0);

        fetch('api/enrollees_stats.php', { credentials: 'same-origin' })
            .then(response => response.json())
            .then(data => {
                if (!data.ok || !data.stats) {
                    throw new Error(data.error || 'Failed to load enrollment snapshot');
                }

                const stats = data.stats;
                setMetricValue('dashboardPreRegistered', stats.pre_registered || 0);
                setMetricValue('dashboardApprovedCount', stats.approved || 0);
                setMetricValue('dashboardRegisteredCount', stats.registered || 0);
            })
            .catch(error => {
                console.error('Error loading enrollment snapshot:', error);
                setMetricValue('dashboardPreRegistered', sharedStats.pendingEnrollments || 0);
                setMetricValue('dashboardApprovedCount', 0);
                setMetricValue('dashboardRegisteredCount', sharedStats.totalEnrollees || 0);
            });
    }

    function loadOperationalOverview() {
        const courseEntries = Object.values((window.SharedData && window.SharedData.courses) || {});
        const students = Array.isArray(window.SharedData && window.SharedData.students)
            ? window.SharedData.students
            : [];

        const activeStudents = students.filter((student) => {
            const status = String(student.dbStatus || student.status || '').toLowerCase();
            return status === 'active' || status === 'enrolled';
        });

        const nearCapacity = courseEntries.filter((course) => {
            const capacity = Number(course.capacity || 0);
            const enrolled = Number(course.enrolled || 0);
            return capacity > 0 && enrolled / capacity >= 0.8;
        }).length;

        const remainingCapacity = courseEntries.reduce((sum, course) => {
            const capacity = Number(course.capacity || 0);
            const enrolled = Number(course.enrolled || 0);
            return sum + Math.max(capacity - enrolled, 0);
        }, 0);

        const programCounts = {};
        const yearCounts = { 1: 0, 2: 0, 3: 0, 4: 0 };

        activeStudents.forEach((student) => {
            const courseCode = String(student.course || student.course_code || 'Unassigned').trim() || 'Unassigned';
            const courseName = String(student.course_name || 'Active students').trim() || 'Active students';
            const yearLevel = Number(student.year_level || student.yearLevel || 0);

            if (!programCounts[courseCode]) {
                programCounts[courseCode] = {
                    label: courseCode,
                    meta: courseName,
                    value: 0
                };
            }
            programCounts[courseCode].value += 1;

            if (yearCounts[yearLevel] != null) {
                yearCounts[yearLevel] += 1;
            }
        });

        const programItems = Object.values(programCounts)
            .sort((a, b) => b.value - a.value)
            .slice(0, 6);

        const yearItems = [1, 2, 3, 4].map((year) => ({
            label: `${year}${year === 1 ? 'st' : year === 2 ? 'nd' : year === 3 ? 'rd' : 'th'} Year`,
            meta: 'Currently active students',
            value: yearCounts[year] || 0
        }));

        setMetricValue('dashboardNearCapacity', nearCapacity);
        setMetricValue('dashboardRemainingCapacity', remainingCapacity);
        setMetricValue('dashboardActivePrograms', Object.keys(programCounts).length);

        renderSummaryList('dashboardProgramBreakdown', programItems, 'No program data available yet.');
        renderSummaryList('dashboardYearLevelBreakdown', yearItems, 'No year level data available yet.');
    }

    function loadCurriculumOverview() {
        const subjectEl = document.getElementById('dashboardCurriculumSubjects');
        const programEl = document.getElementById('dashboardCurriculumPrograms');
        const blockEl = document.getElementById('dashboardCurriculumBlocks');
        const coverageEl = document.getElementById('dashboardCurriculumCoverage');
        const highlightsEl = document.getElementById('dashboardCurriculumHighlights');
        const listEl = document.getElementById('dashboardCurriculumList');
        const listTitleEl = document.getElementById('dashboardCurriculumListTitle');
        const listSubtitleEl = document.getElementById('dashboardCurriculumListSubtitle');

        if (!subjectEl || !programEl || !blockEl || !coverageEl || !highlightsEl || !listEl) {
            return;
        }

        if (listTitleEl) {
            listTitleEl.textContent = 'Curriculum by Program';
        }
        if (listSubtitleEl) {
            listSubtitleEl.textContent = 'Configured curriculum blocks currently available in the system.';
        }

        fetch('api/curriculum_list.php', { credentials: 'same-origin' })
            .then(response => response.json())
            .then(data => {
                if (!data.ok || !Array.isArray(data.curriculum)) {
                    throw new Error(data.error || 'Failed to load curriculum data');
                }

                const curriculum = data.curriculum;
                const courseSet = new Set();
                const grouped = {};
                let firstSemCount = 0;
                let secondSemCount = 0;

                curriculum.forEach(subject => {
                    const courseCode = String(subject.course_code || 'N/A');
                    const yearLevel = Number(subject.year_level || 0);
                    const semester = Number(subject.semester || 0);
                    const key = [courseCode, yearLevel, semester].join('::');

                    courseSet.add(courseCode);
                    if (semester === 1) firstSemCount += 1;
                    if (semester === 2) secondSemCount += 1;

                    if (!grouped[key]) {
                        grouped[key] = {
                            courseCode,
                            yearLevel,
                            semester,
                            count: 0
                        };
                    }

                    grouped[key].count += 1;
                });

                const blocks = Object.values(grouped).sort((a, b) => {
                    if (a.courseCode !== b.courseCode) {
                        return a.courseCode.localeCompare(b.courseCode);
                    }
                    if (a.yearLevel !== b.yearLevel) {
                        return a.yearLevel - b.yearLevel;
                    }
                    return a.semester - b.semester;
                });

                subjectEl.textContent = curriculum.length.toLocaleString();
                programEl.textContent = courseSet.size.toLocaleString();
                blockEl.textContent = blocks.length.toLocaleString();
                coverageEl.textContent = `${firstSemCount} / ${secondSemCount}`;

                if (!blocks.length) {
                    highlightsEl.innerHTML = '<span class="curriculum-chip muted">No curriculum configured yet</span>';
                    listEl.innerHTML = '<p class="activity-empty">No curriculum records are available.</p>';
                    return;
                }

                highlightsEl.innerHTML = blocks.slice(0, 6).map(block => (
                    `<span class="curriculum-chip">${escapeHtml(block.courseCode)} • Y${escapeHtml(block.yearLevel)} • ${escapeHtml(block.count)} subjects</span>`
                )).join('');

                listEl.innerHTML = blocks.slice(0, 8).map(block => (
                    '<div class="curriculum-program-item">' +
                        '<div>' +
                            `<strong>${escapeHtml(block.courseCode)}</strong>` +
                            `<div class="curriculum-program-meta">Year ${escapeHtml(block.yearLevel)} • ${escapeHtml(formatSemesterLabel(block.semester))}</div>` +
                        '</div>' +
                        `<div class="curriculum-program-count">${escapeHtml(block.count)} ${block.count === 1 ? 'subject' : 'subjects'}</div>` +
                    '</div>'
                )).join('');
            })
            .catch(error => {
                console.error('Error loading curriculum overview:', error);
                subjectEl.textContent = '—';
                programEl.textContent = '—';
                blockEl.textContent = '—';
                coverageEl.textContent = '—';
                highlightsEl.innerHTML = '<span class="curriculum-chip muted">Curriculum unavailable</span>';
                listEl.innerHTML = '<p class="activity-empty">Unable to load curriculum data right now.</p>';
            });
    }

    // Listen for data changes
    if (window.SharedData && typeof window.SharedData.on === 'function') {
        window.SharedData.on('enrolleeApproved', function () {
            updateDashboardStats();
            loadCurriculumOverview();
        });

        window.SharedData.on('studentsUpdated', function () {
            updateDashboardStats();
            loadCurriculumOverview();
        });

        window.SharedData.on('scheduleAdded', function () {
            updateDashboardStats();
            loadCurriculumOverview();
        });
    }
    
    // Initial load
    refreshStudentSession().then(function() {
        updateProfileInfo();
        updateDashboardStats();
        
        // Only load curriculum overview for non-students
        if (currentUserRole !== 'student') {
            loadCurriculumOverview();
        }
    });
    
    // Update every 5 seconds to catch changes
    setInterval(updateDashboardStats, 5000);
});
